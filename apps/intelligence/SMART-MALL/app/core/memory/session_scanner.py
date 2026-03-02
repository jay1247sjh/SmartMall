"""Session Scanner：后台定时任务，检测超时 Session

每 SESSION_SCAN_INTERVAL_MINUTES 分钟扫描一次 Redis 中的
`smartmall:session:active:*` keys，检测超过 SESSION_TIMEOUT_MINUTES
无活动的 session。

Session 结束时触发：
1. 最终摘要更新（Summarizer 强制执行，跳过防抖）
2. LLM 自动提取用户偏好写入长期记忆

在 FastAPI lifespan 中通过 asyncio.create_task(scanner.start()) 启动。
"""

import asyncio
import json
import logging
import time

logger = logging.getLogger(__name__)

SESSION_ACTIVE_PREFIX = "smartmall:session:active:"


class SessionScanner:
    """Session 超时检测器"""

    def __init__(self):
        from app.core.config import get_settings
        settings = get_settings()
        self._interval = settings.SESSION_SCAN_INTERVAL_MINUTES * 60
        self._timeout = settings.SESSION_TIMEOUT_MINUTES * 60

    async def start(self):
        """后台循环，定期扫描超时 session"""
        while True:
            await asyncio.sleep(self._interval)
            try:
                await self._scan_expired_sessions()
            except Exception as e:
                logger.error(json.dumps({
                    "event": "session_scan_error",
                    "reason": str(e),
                }, ensure_ascii=False))

    async def _scan_expired_sessions(self):
        """扫描超时 session，触发结束流程"""
        from app.core.redis_pool import RedisPoolFactory

        client = await RedisPoolFactory.get_client()
        now = time.time()

        async for key in client.scan_iter(match=f"{SESSION_ACTIVE_PREFIX}*"):
            try:
                raw = await client.get(key)
                if raw is None:
                    continue
                last_active = float(raw)
                if now - last_active > self._timeout:
                    # key format: smartmall:session:active:{user_id}
                    if isinstance(key, bytes):
                        key = key.decode("utf-8")
                    user_id = key[len(SESSION_ACTIVE_PREFIX):]
                    await self._handle_session_end(user_id)
                    await client.delete(key)
                    logger.info(json.dumps({
                        "event": "session_expired",
                        "user_id": user_id,
                        "inactive_seconds": int(now - last_active),
                    }, ensure_ascii=False))
            except Exception as e:
                logger.warning(json.dumps({
                    "event": "session_check_failed",
                    "key": str(key),
                    "reason": str(e),
                }, ensure_ascii=False))

    async def _handle_session_end(self, user_id: str):
        """Session 结束处理：最终摘要 + 偏好提取"""
        from app.core.memory.manager import MemoryManager

        memory = MemoryManager(user_id=user_id)
        messages = await memory.get_short_term_messages()

        if messages:
            # 强制摘要（跳过防抖）
            memory.summarizer.reset_debounce(user_id)
            await memory.summarizer.maybe_summarize(messages, memory.mid_term)

        # LLM 提取用户偏好写入长期记忆
        await memory.long_term.extract_and_save_preferences(
            messages, session_id=f"session-end-{user_id}"
        )
