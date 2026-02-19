"""中期记忆：Redis 存储对话摘要

key 格式: smartmall:memory:mid:{user_id}
TTL: MEMORY_MID_TERM_TTL_DAYS 天（默认 7 天）
Redis 不可用时降级为内存 Dict 存储。
"""

import json
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class MidTermMemory:
    """中期记忆：Redis 存储对话摘要，Redis 不可用时降级为内存"""

    KEY_PREFIX = "smartmall:memory:mid:"

    # 内存降级存储（类级别共享，模拟跨实例不可用场景）
    _fallback_store: Dict[str, str] = {}

    def __init__(self, user_id: str):
        self.user_id = user_id
        self._key = f"{self.KEY_PREFIX}{user_id}"

    async def load(self) -> Optional[str]:
        """加载对话摘要，Redis 不可用时从内存降级存储读取"""
        try:
            from app.core.redis_pool import RedisPoolFactory
            client = await RedisPoolFactory.get_client()
            value = await client.get(self._key)
            if value is not None:
                return value
        except Exception as e:
            logger.warning(json.dumps({
                "event": "mid_term_memory_load_degraded",
                "user_id": self.user_id,
                "reason": str(e),
                "fallback": "memory_dict",
            }, ensure_ascii=False))

        # 降级：从内存读取
        return self._fallback_store.get(self.user_id)

    async def save(self, summary: str) -> None:
        """保存对话摘要，Redis 不可用时写入内存降级存储"""
        try:
            from app.core.redis_pool import RedisPoolFactory
            from app.core.config import get_settings
            settings = get_settings()
            ttl = settings.MEMORY_MID_TERM_TTL_DAYS * 86400

            client = await RedisPoolFactory.get_client()
            await client.setex(self._key, ttl, summary)
            return
        except Exception as e:
            logger.warning(json.dumps({
                "event": "mid_term_memory_save_degraded",
                "user_id": self.user_id,
                "reason": str(e),
                "fallback": "memory_dict",
            }, ensure_ascii=False))

        # 降级：写入内存
        self._fallback_store[self.user_id] = summary

    async def clear(self) -> None:
        """清除当前用户的中期记忆"""
        try:
            from app.core.redis_pool import RedisPoolFactory
            client = await RedisPoolFactory.get_client()
            await client.delete(self._key)
        except Exception:
            pass
        self._fallback_store.pop(self.user_id, None)
