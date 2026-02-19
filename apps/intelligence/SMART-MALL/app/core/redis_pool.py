"""
Redis 连接池工厂

提供统一的 Redis 异步连接池，供记忆系统、事件总线、重试队列共用。
Redis 不可用时记录警告日志，由上层模块决定降级策略。
"""

import logging
from typing import Optional

import redis.asyncio as aioredis

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class RedisPoolFactory:
    """统一 Redis 连接池工厂（单例）"""

    _pool: Optional[aioredis.ConnectionPool] = None

    @classmethod
    async def get_pool(cls) -> aioredis.ConnectionPool:
        """获取或创建连接池"""
        if cls._pool is None:
            settings = get_settings()
            try:
                cls._pool = aioredis.ConnectionPool.from_url(
                    settings.REDIS_URL,
                    max_connections=settings.REDIS_MAX_CONNECTIONS,
                    decode_responses=True,
                )
                logger.info(f"Redis connection pool created: {settings.REDIS_URL}")
            except Exception as e:
                logger.warning(f"Failed to create Redis connection pool: {e}")
                raise
        return cls._pool

    @classmethod
    async def get_client(cls) -> aioredis.Redis:
        """获取 Redis 客户端（基于连接池）"""
        pool = await cls.get_pool()
        return aioredis.Redis(connection_pool=pool)

    @classmethod
    async def close(cls) -> None:
        """关闭连接池，释放资源"""
        if cls._pool is not None:
            await cls._pool.disconnect()
            cls._pool = None
            logger.info("Redis connection pool closed")
