"""
数据一致性检查器

通过 Java 后端内部 API 获取实体 ID 列表（不直接访问业务数据库），
对比 PostgreSQL 和 Milvus 中的 ID 集合，生成补偿事件修复差异。

支持手动触发和定时调度（默认每日凌晨执行）。
每次执行后写入心跳 key（TTL=26h），Prometheus 告警规则监控心跳超时。

Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Set

from app.core.config import settings
from app.core.redis_pool import RedisPoolFactory
from app.core.sync.events import ConsistencyReport, SyncEvent

logger = logging.getLogger(__name__)

# 所有需要检查的集合
ALL_COLLECTIONS = ["stores", "products", "locations", "reviews", "rules"]

# 集合名 → 实体类型映射（用于生成补偿事件）
COLLECTION_TO_ENTITY_TYPE = {
    "stores": "store",
    "products": "product",
    "locations": "location",
    "reviews": "review",
    "rules": "rule",
}


class ConsistencyChecker:
    """数据一致性检查器

    遵循架构约束：Python AI 服务不直接访问业务数据库。
    通过 Java 后端内部 API 获取实体 ID 列表。
    """

    HEARTBEAT_KEY = "smartmall:sync:consistency_checker:heartbeat"
    HEARTBEAT_TTL = 93600  # 26 小时（略大于告警阈值 25h）


    def __init__(self, event_bus=None):
        self.event_bus = event_bus
        self.backend_url = settings.JAVA_BACKEND_INTERNAL_URL

    async def check_collection(self, collection: str) -> ConsistencyReport:
        """对比 Java 后端（PostgreSQL）与 Milvus 中的实体 ID 集合。

        为缺失实体生成 create 补偿事件，清理 Milvus 中的孤立记录。
        """
        backend_ids = await self._get_entity_ids_from_backend(collection)
        milvus_ids = await self._get_milvus_entity_ids(collection)

        missing_in_milvus = backend_ids - milvus_ids
        orphaned_in_milvus = milvus_ids - backend_ids

        entity_type = COLLECTION_TO_ENTITY_TYPE.get(collection, collection)
        compensating_count = 0
        orphaned_count = 0

        # 为缺失实体生成 create 补偿事件
        for entity_id in missing_in_milvus:
            try:
                await self._publish_compensating_event(
                    entity_type, entity_id, "create"
                )
                compensating_count += 1
            except Exception as e:
                logger.error(json.dumps({
                    "event": "compensating_event_failed",
                    "collection": collection,
                    "entity_id": entity_id,
                    "reason": str(e),
                }, ensure_ascii=False))

        # 清理 Milvus 中的孤立记录
        for entity_id in orphaned_in_milvus:
            try:
                await self._cleanup_orphaned(collection, entity_id)
                orphaned_count += 1
            except Exception as e:
                logger.error(json.dumps({
                    "event": "orphan_cleanup_failed",
                    "collection": collection,
                    "entity_id": entity_id,
                    "reason": str(e),
                }, ensure_ascii=False))

        report = ConsistencyReport(
            collection=collection,
            backend_count=len(backend_ids),
            milvus_count=len(milvus_ids),
            missing_in_milvus=sorted(missing_in_milvus),
            orphaned_in_milvus=sorted(orphaned_in_milvus),
            compensating_events_created=compensating_count,
            orphaned_cleaned=orphaned_count,
        )

        logger.info(json.dumps({
            "event": "consistency_check_done",
            "collection": collection,
            "backend_count": report.backend_count,
            "milvus_count": report.milvus_count,
            "missing": len(missing_in_milvus),
            "orphaned": len(orphaned_in_milvus),
        }, ensure_ascii=False))

        return report

    async def run_all_checks(self) -> Dict[str, ConsistencyReport]:
        """执行所有集合的一致性检查，并写入心跳 key。"""
        reports: Dict[str, ConsistencyReport] = {}

        for collection in ALL_COLLECTIONS:
            try:
                reports[collection] = await self.check_collection(collection)
            except Exception as e:
                logger.error(json.dumps({
                    "event": "consistency_check_failed",
                    "collection": collection,
                    "reason": str(e),
                }, ensure_ascii=False))
                reports[collection] = ConsistencyReport(
                    collection=collection, error=str(e)
                )

        await self._write_heartbeat(reports)
        return reports

    async def _write_heartbeat(self, reports: Dict[str, ConsistencyReport]) -> None:
        """写入心跳 key 到 Redis（TTL=26h）。"""
        try:
            client = await RedisPoolFactory.get_client()
            heartbeat = json.dumps({
                "last_run": datetime.utcnow().isoformat(),
                "result": {
                    col: {
                        "missing": len(r.missing_in_milvus),
                        "orphaned": len(r.orphaned_in_milvus),
                    }
                    for col, r in reports.items()
                    if not r.error
                },
                "errors": [col for col, r in reports.items() if r.error],
            })
            await client.set(self.HEARTBEAT_KEY, heartbeat, ex=self.HEARTBEAT_TTL)
        except Exception as e:
            logger.error(json.dumps({
                "event": "heartbeat_write_failed",
                "reason": str(e),
            }, ensure_ascii=False))

    async def _publish_compensating_event(
        self, entity_type: str, entity_id: str, operation: str
    ) -> None:
        """发布补偿事件到 EventBus。"""
        event = SyncEvent(
            entity_type=entity_type,
            operation=operation,
            entity_id=entity_id,
            payload={},
            source="consistency_checker",
        )
        if self.event_bus:
            await self.event_bus.publish(event)

    # --- 外部依赖接口（由子类或集成测试覆盖） ---

    async def _get_entity_ids_from_backend(self, collection: str) -> Set[str]:
        """调用 Java 后端内部接口获取实体 ID 列表。"""
        # 实际实现：httpx.AsyncClient GET /api/internal/entity-ids?type=collection
        return set()

    async def _get_milvus_entity_ids(self, collection: str) -> Set[str]:
        """从 Milvus 获取集合中所有实体 ID。"""
        # 实际实现：pymilvus query
        return set()

    async def _cleanup_orphaned(self, collection: str, entity_id: str) -> None:
        """从 Milvus 删除孤立记录。"""
        # 实际实现：pymilvus delete
        pass
