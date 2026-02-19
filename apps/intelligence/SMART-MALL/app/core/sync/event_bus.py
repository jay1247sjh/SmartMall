"""
Event Bus - 基于 Redis Streams 的事件总线

提供事件发布、消费、确认功能，供增量同步管道使用。

Requirements: 7.2, 7.3, 7.5
"""

import logging
from typing import List, Tuple

from app.core.redis_pool import RedisPoolFactory
from app.core.sync.events import SyncEvent

logger = logging.getLogger(__name__)


class EventBus:
    """基于 Redis Streams 的事件总线"""

    STREAM_KEY = "smartmall:sync:events"
    GROUP_NAME = "sync_workers"

    async def initialize(self) -> None:
        """初始化 Consumer Group（幂等操作）。

        在 FastAPI lifespan 启动阶段调用，确保 Consumer Group 存在。
        如果 Group 已存在（BUSYGROUP），静默忽略。
        """
        client = await RedisPoolFactory.get_client()
        try:
            await client.xgroup_create(
                self.STREAM_KEY, self.GROUP_NAME, id="0", mkstream=True
            )
            logger.info(f"Consumer group '{self.GROUP_NAME}' created")
        except Exception as e:
            if "BUSYGROUP" in str(e):
                logger.debug(f"Consumer group '{self.GROUP_NAME}' already exists")
            else:
                raise

    async def publish(self, event: SyncEvent) -> str:
        """发布事件到 Stream。

        Args:
            event: 同步事件

        Returns:
            Redis Stream 消息 ID
        """
        client = await RedisPoolFactory.get_client()
        msg_id = await client.xadd(
            self.STREAM_KEY,
            {"data": event.model_dump_json()},
        )
        logger.debug(f"Published event {event.event_id} as {msg_id}")
        return msg_id

    async def consume(
        self, consumer_name: str, count: int = 10
    ) -> List[Tuple[str, SyncEvent]]:
        """消费消息，返回 (message_id, SyncEvent) 列表。

        使用 XREADGROUP 从 Consumer Group 读取新消息。
        调用方处理完成后必须调用 acknowledge(message_id) 确认，
        否则消息会留在 PEL 中，consumer 重启后被重新投递。

        Args:
            consumer_name: 消费者名称（如 "worker-1"）
            count: 单次最多读取消息数

        Returns:
            (message_id, SyncEvent) 元组列表
        """
        client = await RedisPoolFactory.get_client()
        raw = await client.xreadgroup(
            groupname=self.GROUP_NAME,
            consumername=consumer_name,
            streams={self.STREAM_KEY: ">"},
            count=count,
            block=5000,
        )
        results: List[Tuple[str, SyncEvent]] = []
        if raw:
            for _stream_name, messages in raw:
                for msg_id, fields in messages:
                    event = SyncEvent.model_validate_json(fields["data"])
                    results.append((msg_id, event))
        return results

    async def acknowledge(self, message_id: str) -> None:
        """确认消息已处理（XACK），从 PEL 中移除。

        必须在 process_event 成功后调用。

        Args:
            message_id: Redis Stream 消息 ID
        """
        client = await RedisPoolFactory.get_client()
        await client.xack(self.STREAM_KEY, self.GROUP_NAME, message_id)
        logger.debug(f"Acknowledged message {message_id}")
