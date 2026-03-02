"""短期记忆持久层（Redis List + 内存降级）。

键格式：
  smartmall:memory:short:{user_id}

数据结构：
  Redis List，元素为 JSON 字符串（MemoryMessage 序列化）
"""

from __future__ import annotations

import json
import logging
from typing import Dict, List

from app.core.memory.short_term import MemoryMessage

logger = logging.getLogger(__name__)


class ShortTermStore:
    """短期记忆持久层。"""

    KEY_PREFIX = "smartmall:memory:short:"
    _fallback_store: Dict[str, List[MemoryMessage]] = {}

    def __init__(self, user_id: str, max_rounds: int, session_timeout_minutes: int):
        self.user_id = user_id
        self._capacity = max_rounds * 2
        self._ttl_seconds = session_timeout_minutes * 60 + 300
        self._key = f"{self.KEY_PREFIX}{user_id}"

    @property
    def capacity(self) -> int:
        return self._capacity

    async def load_messages(self) -> List[MemoryMessage]:
        """加载短期记忆消息列表。"""
        try:
            from app.core.redis_pool import RedisPoolFactory

            client = await RedisPoolFactory.get_client()
            rows = await client.lrange(self._key, 0, -1)
            messages: List[MemoryMessage] = []
            for row in rows:
                try:
                    payload = json.loads(row)
                    role = payload.get("role")
                    content = payload.get("content")
                    timestamp = payload.get("timestamp")
                    if role in {"user", "assistant", "tool"} and isinstance(content, str):
                        if isinstance(timestamp, (float, int)):
                            messages.append(
                                MemoryMessage(role=role, content=content, timestamp=float(timestamp))
                            )
                        else:
                            messages.append(MemoryMessage(role=role, content=content))
                except Exception:
                    continue
            return messages
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "short_term_memory_load_degraded",
                        "user_id": self.user_id,
                        "reason": str(e),
                        "fallback": "memory_dict",
                    },
                    ensure_ascii=False,
                )
            )
            return list(self._fallback_store.get(self.user_id, []))

    async def overwrite_messages(self, messages: List[MemoryMessage]) -> None:
        """覆盖写入短期记忆（用于裁剪后回写）。"""
        trimmed = list(messages[-self._capacity :]) if self._capacity > 0 else []
        encoded = [
            json.dumps(
                {"role": m.role, "content": m.content, "timestamp": m.timestamp},
                ensure_ascii=False,
            )
            for m in trimmed
        ]
        try:
            from app.core.redis_pool import RedisPoolFactory

            client = await RedisPoolFactory.get_client()
            async with client.pipeline(transaction=True) as pipe:
                await pipe.delete(self._key)
                if encoded:
                    await pipe.rpush(self._key, *encoded)
                await pipe.expire(self._key, self._ttl_seconds)
                await pipe.execute()
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "short_term_memory_save_degraded",
                        "user_id": self.user_id,
                        "reason": str(e),
                        "fallback": "memory_dict",
                    },
                    ensure_ascii=False,
                )
            )
            self._fallback_store[self.user_id] = trimmed

    async def append_messages(self, messages: List[MemoryMessage]) -> None:
        """追加消息并按容量自动裁剪。"""
        if not messages:
            return
        existing = await self.load_messages()
        merged = existing + messages
        await self.overwrite_messages(merged)

    async def clear(self) -> None:
        """清空短期记忆。"""
        try:
            from app.core.redis_pool import RedisPoolFactory

            client = await RedisPoolFactory.get_client()
            await client.delete(self._key)
        except Exception:
            pass
        self._fallback_store.pop(self.user_id, None)
