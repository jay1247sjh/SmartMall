"""
指数退避重试队列（DB 优先持久化）

enqueue() 先写数据库（sync_event_log status='retry_pending'），再写 Redis Sorted Set。
Redis 重启不丢失重试事件，服务启动时 recover_from_db() 从数据库恢复。

Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.core.redis_pool import RedisPoolFactory
from app.core.sync.events import SyncEvent

logger = logging.getLogger(__name__)

# Prometheus 计数器（延迟导入，不可用时降级为空操作）
try:
    from prometheus_client import Counter
    SYNC_DEAD_LETTER_TOTAL = Counter(
        "sync_dead_letter_total",
        "Total number of events moved to dead letter queue",
    )
except ImportError:
    class _NoopCounter:
        def inc(self, amount=1): pass
    SYNC_DEAD_LETTER_TOTAL = _NoopCounter()


class RetryQueue:
    """指数退避重试队列（DB 优先持久化）"""

    RETRY_KEY = "smartmall:sync:retry"
    DEAD_LETTER_KEY = "smartmall:sync:dead_letter"
    MAX_RETRIES = 5
    INITIAL_DELAY = 1    # 秒
    MAX_DELAY = 300       # 5 分钟

    # Lua 脚本：原子性读取+删除到期事件，防止多实例竞争重复读取
    _PROCESS_DUE_LUA = """
    local key = KEYS[1]
    local now = ARGV[1]
    local limit = ARGV[2]
    local results = redis.call('ZRANGEBYSCORE', key, '0', now, 'LIMIT', 0, tonumber(limit))
    if #results > 0 then
        redis.call('ZREM', key, unpack(results))
    end
    return results
    """


    def calculate_delay(self, retry_count: int) -> float:
        """计算指数退避延迟：min(INITIAL_DELAY * 2^retry_count, MAX_DELAY)"""
        return min(self.INITIAL_DELAY * (2 ** retry_count), self.MAX_DELAY)

    async def enqueue(self, event: SyncEvent, error: str, retry_count: int = 0) -> None:
        """入队重试事件。

        持久化顺序：
        1. 先写数据库（sync_event_log status='retry_pending'）→ 持久化保障
        2. 再写 Redis Sorted Set → 调度加速层

        如果 Redis ZADD 失败，事件仍在数据库中，recover_from_db() 会恢复。
        """
        if retry_count >= self.MAX_RETRIES:
            await self.move_to_dead_letter(event, error)
            return

        delay = self.calculate_delay(retry_count)
        execute_at = time.time() + delay

        # 1. 先写数据库（持久化保障）
        await self._log_retry_event(
            event, error, retry_count, status="retry_pending"
        )

        # 2. 再写 Redis Sorted Set（调度加速层）
        try:
            client = await RedisPoolFactory.get_client()
            entry = json.dumps({
                "event": event.model_dump_json(),
                "retry_count": retry_count,
                "error": error,
            })
            await client.zadd(self.RETRY_KEY, {entry: execute_at})
        except Exception as e:
            # Redis 写入失败不影响持久化，recover_from_db() 会恢复
            logger.warning(json.dumps({
                "event": "retry_redis_zadd_failed",
                "event_id": event.event_id,
                "reason": str(e),
            }, ensure_ascii=False))

    async def process_due(self, limit: int = 10) -> List[Dict[str, Any]]:
        """原子性读取+删除到期事件（Lua 脚本，防多实例竞争）。"""
        client = await RedisPoolFactory.get_client()
        now = time.time()
        results = await client.eval(
            self._PROCESS_DUE_LUA, 1, self.RETRY_KEY, str(now), str(limit)
        )
        entries = []
        for raw in (results or []):
            data = json.loads(raw)
            event = SyncEvent.model_validate_json(data["event"])
            entries.append({
                "event": event,
                "retry_count": data["retry_count"],
                "error": data["error"],
            })
        return entries

    async def move_to_dead_letter(self, event: SyncEvent, error: str) -> None:
        """移入死信队列：写数据库 + Redis LIST + 告警日志 + Prometheus 计数器。"""
        # 1. 写数据库（持久化保障）
        await self._log_retry_event(
            event, error, self.MAX_RETRIES, status="dead_letter"
        )

        # 2. 写 Redis LIST（供 API 查询）
        try:
            client = await RedisPoolFactory.get_client()
            await client.lpush(self.DEAD_LETTER_KEY, event.model_dump_json())
        except Exception as e:
            logger.warning(json.dumps({
                "event": "dead_letter_redis_push_failed",
                "event_id": event.event_id,
                "reason": str(e),
            }, ensure_ascii=False))

        # 3. 告警日志
        logger.error(json.dumps({
            "event": "dead_letter",
            "event_id": event.event_id,
            "entity_type": event.entity_type,
            "entity_id": event.entity_id,
            "error": error,
        }, ensure_ascii=False))

        # 4. Prometheus 计数器
        SYNC_DEAD_LETTER_TOTAL.inc()

    async def recover_from_db(self) -> int:
        """服务启动时从数据库恢复 status='retry_pending' 的事件到 Redis Sorted Set。

        Returns:
            恢复的事件数量
        """
        pending_events = await self._get_pending_events_from_db()
        if not pending_events:
            return 0

        client = await RedisPoolFactory.get_client()
        recovered = 0
        for record in pending_events:
            event = SyncEvent(
                event_id=record["event_id"],
                entity_type=record["entity_type"],
                operation=record["operation"],
                entity_id=record["entity_id"],
                payload=record.get("payload", {}),
            )
            delay = self.calculate_delay(record.get("retry_count", 0))
            execute_at = time.time() + delay
            entry = json.dumps({
                "event": event.model_dump_json(),
                "retry_count": record.get("retry_count", 0),
                "error": record.get("error_message", "recovered_from_db"),
            })
            await client.zadd(self.RETRY_KEY, {entry: execute_at})
            recovered += 1

        logger.info(f"Recovered {recovered} retry events from database")
        return recovered

    # --- 外部依赖接口（由子类或集成测试覆盖） ---

    async def _log_retry_event(
        self, event: SyncEvent, error: str, retry_count: int, status: str
    ) -> None:
        """将重试/死信记录写入数据库（sync_event_log 表）。"""
        # 实际实现将 INSERT/UPDATE sync_event_log
        pass

    async def _get_pending_events_from_db(self) -> List[Dict[str, Any]]:
        """从数据库获取 status='retry_pending' 的事件列表。"""
        # 实际实现将 SELECT FROM sync_event_log WHERE status='retry_pending'
        return []
