"""
增量同步服务

负责将 Java 后端推送的实体变更事件同步到 Milvus 向量数据库。
采用 Cache-Aside 幂等性策略：数据库为唯一真相源，Redis 仅作查询加速缓存。

Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2
"""

import asyncio
import json
import logging
import time
from typing import Optional

from app.core.embedding_provider import get_embeddings, EmbeddingProvider
from app.core.rag.milvus_client import get_milvus_client
from app.core.redis_pool import RedisPoolFactory
from app.core.sync.event_bus import EventBus
from app.core.sync.events import SyncEvent

logger = logging.getLogger(__name__)


class SyncService:
    """增量同步服务

    处理流程：幂等检查 → 业务处理（Milvus upsert）→ 写数据库日志 → 写 Redis 缓存 → XACK
    """

    PROCESSED_KEY_PREFIX = "smartmall:sync:processed:"
    PROCESSED_TTL = 86400  # 24h

    # 实体类型 → Milvus 集合映射
    COLLECTION_MAP = {
        "store": "stores",
        "product": "products",
        "location": "locations",
        "review": "reviews",
        "rule": "rules",
    }

    def __init__(self, event_bus: Optional[EventBus] = None, retry_queue=None):
        self.event_bus = event_bus or EventBus()
        self.retry_queue = retry_queue
        self._shutdown = asyncio.Event()

    async def process_event(self, event: SyncEvent, message_id: str = None) -> None:
        """处理单个同步事件。

        Args:
            event: 同步事件
            message_id: Redis Stream 消息 ID（来自 EventBus 时提供）
        """
        # 1. 幂等性检查
        if await self._is_event_processed(event.event_id):
            logger.debug(f"Event {event.event_id} already processed, skipping")
            if message_id:
                await self.event_bus.acknowledge(message_id)
            return

        collection = self.COLLECTION_MAP.get(event.entity_type)
        if not collection:
            logger.error(json.dumps({
                "event": "unknown_entity_type",
                "entity_type": event.entity_type,
                "event_id": event.event_id,
            }, ensure_ascii=False))
            return

        embedding_provider = EmbeddingProvider.get_current_provider_name()

        # 2. 业务处理（Milvus upsert/delete）
        if event.operation in ("create", "update"):
            await self._handle_upsert(collection, event, embedding_provider)
        elif event.operation == "delete":
            await self._handle_delete(collection, event)

        # 3. 写数据库日志（持久化保障，UNIQUE(event_id) 防重复）
        await self._log_event(event, status="processed")

        # 4. 写 Redis 缓存（加速层，失败不影响正确性）
        try:
            client = await RedisPoolFactory.get_client()
            cache_key = f"{self.PROCESSED_KEY_PREFIX}{event.event_id}"
            await client.set(cache_key, "1", ex=self.PROCESSED_TTL)
        except Exception as e:
            logger.warning(json.dumps({
                "event": "redis_cache_write_failed",
                "event_id": event.event_id,
                "reason": str(e),
            }, ensure_ascii=False))

        # 5. XACK 确认
        if message_id:
            await self.event_bus.acknowledge(message_id)

        logger.info(json.dumps({
            "event": "sync_event_processed",
            "event_id": event.event_id,
            "entity_type": event.entity_type,
            "operation": event.operation,
            "entity_id": event.entity_id,
            "collection": collection,
            "embedding_provider": embedding_provider,
        }, ensure_ascii=False))

    async def run_consumer(self, consumer_name: str = "worker-1") -> None:
        """消费循环：持续从 EventBus 读取事件并处理。

        关键可靠性设计：
        - retry_queue.enqueue() 成功 → XACK（重试由 RetryQueue 负责）
        - retry_queue.enqueue() 失败 → 不 XACK，消息留在 PEL 中等待重新投递

        支持优雅退出：调用 shutdown() 后当前批次处理完毕即退出。
        """
        while not self._shutdown.is_set():
            try:
                messages = await self.event_bus.consume(consumer_name)
                for message_id, event in messages:
                    try:
                        await self.process_event(event, message_id=message_id)
                    except Exception as e:
                        logger.error(json.dumps({
                            "event": "sync_event_failed",
                            "event_id": event.event_id,
                            "reason": str(e),
                        }, ensure_ascii=False))
                        # 尝试写入 RetryQueue（DB 优先持久化）
                        try:
                            if self.retry_queue:
                                await self.retry_queue.enqueue(
                                    event, str(e), retry_count=0
                                )
                            # enqueue 成功 → XACK，重试由 RetryQueue 负责
                            await self.event_bus.acknowledge(message_id)
                        except Exception as enqueue_err:
                            # enqueue 失败 → 不 XACK，消息留在 PEL 中
                            logger.error(json.dumps({
                                "event": "retry_enqueue_failed",
                                "event_id": event.event_id,
                                "reason": str(enqueue_err),
                                "action": "message_stays_in_pel",
                            }, ensure_ascii=False))
            except asyncio.CancelledError:
                logger.info("Consumer task cancelled, shutting down gracefully")
                break
            except Exception as e:
                logger.error(f"Consumer loop error: {e}")
                await asyncio.sleep(1)

    async def shutdown(self) -> None:
        """优雅退出"""
        self._shutdown.set()

    async def _is_event_processed(self, event_id: str) -> bool:
        """幂等性检查：Redis 缓存（快速路径）→ 数据库（持久化保障）→ 回填缓存。"""
        # 快速路径：Redis 缓存
        try:
            client = await RedisPoolFactory.get_client()
            cache_key = f"{self.PROCESSED_KEY_PREFIX}{event_id}"
            if await client.get(cache_key):
                return True
        except Exception:
            pass  # Redis 不可用，降级到数据库

        # 持久化路径：数据库
        db_exists = await self._check_event_in_db(event_id)
        if db_exists:
            # 回填 Redis 缓存
            try:
                client = await RedisPoolFactory.get_client()
                cache_key = f"{self.PROCESSED_KEY_PREFIX}{event_id}"
                await client.set(cache_key, "1", ex=self.PROCESSED_TTL)
            except Exception:
                pass
        return db_exists

    async def _handle_upsert(
        self, collection: str, event: SyncEvent, embedding_provider: str
    ) -> None:
        """处理 create/update：生成向量，upsert 到 Milvus。"""
        text = self._build_text_for_embedding(event)
        embeddings = get_embeddings()
        vector = await embeddings.aembed_query(text)

        metadata = {
            **event.payload,
            "entity_id": event.entity_id,
            "entity_type": event.entity_type,
            "embedding_provider": embedding_provider,
        }

        await self._milvus_upsert(collection, event.entity_id, vector, metadata)

    async def _handle_delete(self, collection: str, event: SyncEvent) -> None:
        """处理 delete：从 Milvus 删除记录。"""
        await self._milvus_delete(collection, event.entity_id)

    def _build_text_for_embedding(self, event: SyncEvent) -> str:
        """从事件 payload 构建用于 Embedding 的文本。"""
        payload = event.payload
        parts = []
        for key in ("name", "description", "content", "text", "title"):
            if key in payload:
                parts.append(str(payload[key]))
        if not parts:
            parts.append(json.dumps(payload, ensure_ascii=False))
        return " ".join(parts)

    # --- 以下方法为外部依赖接口，由子类或集成测试覆盖 ---

    async def _check_event_in_db(self, event_id: str) -> bool:
        """检查事件是否已在数据库中记录（sync_event_log 表）。"""
        try:
            import asyncpg
            from app.core.config import get_settings

            conn = await asyncpg.connect(get_settings().pg_dsn)
            try:
                row = await conn.fetchrow(
                    """
                    SELECT status FROM sync_event_log
                    WHERE event_id = $1 AND is_deleted = FALSE
                    LIMIT 1
                    """,
                    event_id,
                )
                if not row:
                    return False
                return row["status"] in {"processed", "dead_letter", "retry_pending"}
            finally:
                await conn.close()
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "sync_event_db_check_failed",
                        "event_id": event_id,
                        "reason": str(e),
                    },
                    ensure_ascii=False,
                )
            )
            return False

    async def _log_event(self, event: SyncEvent, status: str) -> None:
        """将事件处理记录写入数据库（sync_event_log 表）。"""
        try:
            import asyncpg
            from app.core.config import get_settings

            conn = await asyncpg.connect(get_settings().pg_dsn)
            try:
                await conn.execute(
                    """
                    INSERT INTO sync_event_log
                        (event_id, entity_type, operation, entity_id, status, error_message, retry_count, processed_at)
                    VALUES
                        ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                    ON CONFLICT (event_id)
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        error_message = EXCLUDED.error_message,
                        retry_count = EXCLUDED.retry_count,
                        processed_at = EXCLUDED.processed_at,
                        update_time = CURRENT_TIMESTAMP
                    """,
                    event.event_id,
                    event.entity_type,
                    event.operation,
                    event.entity_id,
                    status,
                    None,
                    0,
                )
            finally:
                await conn.close()
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "sync_event_log_write_failed",
                        "event_id": event.event_id,
                        "status": status,
                        "reason": str(e),
                    },
                    ensure_ascii=False,
                )
            )

    async def _milvus_upsert(
        self, collection: str, entity_id: str, vector: list, metadata: dict
    ) -> None:
        """Upsert 到 Milvus（create 和 update 均使用 upsert）。"""
        client = get_milvus_client()
        if not client.is_connected():
            client.connect()

        col = client.get_collection(collection)
        if col is None:
            raise RuntimeError(f"Milvus collection not found: {collection}")

        entity = self._build_entity_for_collection(collection, entity_id, vector, metadata)

        try:
            col.delete(expr=f"id in ['{entity_id}']")
        except Exception:
            # 允许旧数据不存在
            pass

        field_names = [field.name for field in col.schema.fields]
        insert_data = [[entity[field]] for field in field_names]
        col.insert(insert_data)
        col.flush()

    async def _milvus_delete(self, collection: str, entity_id: str) -> None:
        """从 Milvus 删除记录。"""
        client = get_milvus_client()
        if not client.is_connected():
            client.connect()

        col = client.get_collection(collection)
        if col is None:
            return
        col.delete(expr=f"id in ['{entity_id}']")
        col.flush()

    def _build_entity_for_collection(
        self, collection: str, entity_id: str, vector: list, metadata: dict
    ) -> dict:
        now = int(time.time())

        if collection == "products":
            return {
                "id": entity_id,
                "name": str(metadata.get("name", "")),
                "description": str(metadata.get("description", "")),
                "category": str(metadata.get("category", "")),
                "brand": str(metadata.get("brand", "")),
                "price": float(metadata.get("price", 0.0) or 0.0),
                "store_id": str(metadata.get("store_id", "")),
                "store_name": str(metadata.get("store_name", "")),
                "image_url": str(metadata.get("image_url", "")),
                "rating": float(metadata.get("rating", 0.0) or 0.0),
                "stock": int(metadata.get("stock", 0) or 0),
                "tags": metadata.get("tags", "[]") if isinstance(metadata.get("tags", "[]"), str) else json.dumps(metadata.get("tags", []), ensure_ascii=False),
                "embedding": vector,
                "updated_at": int(metadata.get("updated_at", now) or now),
            }

        if collection == "stores":
            return {
                "id": entity_id,
                "name": str(metadata.get("name", "")),
                "description": str(metadata.get("description", "")),
                "category": str(metadata.get("category", "")),
                "floor": int(metadata.get("floor", 1) or 1),
                "area": str(metadata.get("area", "")),
                "position_x": float(metadata.get("position_x", 0.0) or 0.0),
                "position_y": float(metadata.get("position_y", 0.0) or 0.0),
                "position_z": float(metadata.get("position_z", 0.0) or 0.0),
                "business_hours": str(metadata.get("business_hours", "09:00-22:00")),
                "rating": float(metadata.get("rating", 0.0) or 0.0),
                "tags": metadata.get("tags", "[]") if isinstance(metadata.get("tags", "[]"), str) else json.dumps(metadata.get("tags", []), ensure_ascii=False),
                "embedding": vector,
                "updated_at": int(metadata.get("updated_at", now) or now),
            }

        if collection == "locations":
            return {
                "id": entity_id,
                "name": str(metadata.get("name", "")),
                "type": str(metadata.get("type", "area")),
                "floor": int(metadata.get("floor", 1) or 1),
                "position_x": float(metadata.get("position_x", 0.0) or 0.0),
                "position_y": float(metadata.get("position_y", 0.0) or 0.0),
                "position_z": float(metadata.get("position_z", 0.0) or 0.0),
                "description": str(metadata.get("description", "")),
                "embedding": vector,
                "updated_at": int(metadata.get("updated_at", now) or now),
            }

        if collection == "reviews":
            return {
                "id": entity_id,
                "product_id": str(metadata.get("product_id", "")),
                "product_name": str(metadata.get("product_name", "")),
                "store_id": str(metadata.get("store_id", "")),
                "store_name": str(metadata.get("store_name", "")),
                "rating": float(metadata.get("rating", 0.0) or 0.0),
                "content": str(metadata.get("content", "")),
                "reply_content": str(metadata.get("reply_content", "")),
                "embedding": vector,
                "updated_at": int(metadata.get("updated_at", now) or now),
            }

        if collection == "rules":
            return {
                "id": entity_id,
                "content": str(metadata.get("content", "")),
                "embedding": vector,
                "updated_at": int(metadata.get("updated_at", now) or now),
            }

        raise RuntimeError(f"Unsupported collection: {collection}")
