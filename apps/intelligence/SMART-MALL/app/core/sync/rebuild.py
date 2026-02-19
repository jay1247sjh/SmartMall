"""
全量重建服务

采用别名切换策略避免服务中断：
1. 创建新集合 {collection}_v{N}
2. 全量写入新数据
3. pymilvus utility.alter_alias 切换别名
4. 删除旧集合

langchain-milvus 兼容性：RAGRetrieverFactory 始终使用逻辑名称（如 stores），
由 Milvus 服务端解析 alias 到实际集合。全量重建使用 pymilvus 原生 API。

Requirements: 11.1, 11.2, 11.3, 11.4
"""

import json
import logging
import time
from typing import Dict, List, Optional, Set

from app.core.config import settings

logger = logging.getLogger(__name__)

# 所有可重建的集合
ALL_COLLECTIONS = ["stores", "products", "locations", "reviews", "rules"]


class RebuildService:
    """全量重建服务（别名切换策略）

    重建期间旧集合仍可通过别名提供检索服务，
    重建完成后原子性切换别名到新集合，删除旧集合。
    """

    def __init__(self):
        self.backend_url = settings.JAVA_BACKEND_INTERNAL_URL

    async def rebuild_collection(self, collection: str) -> Dict:
        """重建指定集合。

        流程：创建新集合 → 全量写入 → 切换别名 → 删除旧集合。
        重建期间旧集合仍可用于检索（通过别名机制）。

        Args:
            collection: 逻辑集合名（如 stores）

        Returns:
            重建结果摘要
        """
        start_time = time.time()
        new_collection = f"{collection}_v{int(time.time())}"
        old_collection: Optional[str] = None

        try:
            # 1. 查找当前别名指向的旧集合
            old_collection = await self._resolve_alias(collection)

            # 2. 创建新集合（与旧集合相同 schema）
            await self._create_collection(new_collection, collection)

            # 3. 全量获取数据并写入新集合
            count = await self._bulk_write(new_collection, collection)

            # 4. 切换别名：collection → new_collection
            await self._switch_alias(collection, new_collection)

            # 5. 删除旧集合（别名已切换，旧集合不再被访问）
            if old_collection and old_collection != collection:
                await self._drop_collection(old_collection)

            elapsed = round(time.time() - start_time, 2)
            result = {
                "collection": collection,
                "new_physical": new_collection,
                "old_physical": old_collection,
                "documents_written": count,
                "elapsed_seconds": elapsed,
                "status": "success",
            }
            logger.info(json.dumps({
                "event": "rebuild_complete", **result,
            }, ensure_ascii=False))
            return result

        except Exception as e:
            elapsed = round(time.time() - start_time, 2)
            logger.error(json.dumps({
                "event": "rebuild_failed",
                "collection": collection,
                "new_physical": new_collection,
                "reason": str(e),
                "elapsed_seconds": elapsed,
            }, ensure_ascii=False))
            # 清理失败的新集合（best effort）
            try:
                await self._drop_collection(new_collection)
            except Exception:
                pass
            raise

    async def rebuild_all(self) -> Dict[str, Dict]:
        """全量重建所有集合。

        Safety_Level=critical，需要用户确认。
        按顺序逐个重建，任一失败不影响其他集合。
        """
        results = {}
        for collection in ALL_COLLECTIONS:
            try:
                results[collection] = await self.rebuild_collection(collection)
            except Exception as e:
                results[collection] = {
                    "collection": collection,
                    "status": "failed",
                    "error": str(e),
                }
        return results

    # --- 底层操作接口（由集成实现或测试覆盖） ---

    async def _resolve_alias(self, alias: str) -> Optional[str]:
        """解析别名当前指向的物理集合名。

        如果别名不存在（首次创建），返回 None。
        实际实现使用 pymilvus utility.list_aliases()。
        """
        # pymilvus: utility.list_aliases(collection_name) 或遍历查找
        return None

    async def _create_collection(
        self, new_name: str, template_collection: str
    ) -> None:
        """创建新集合，schema 与模板集合一致。

        实际实现使用 pymilvus Collection + FieldSchema。
        """
        pass

    async def _bulk_write(self, target_collection: str, source_type: str) -> int:
        """从 Java 后端全量获取数据，生成向量，写入目标集合。

        通过 Java 后端内部 API 分页获取实体数据，
        使用 get_embeddings() 生成向量后批量写入 Milvus。

        Returns:
            写入的文档数量
        """
        # 实际实现：httpx 分页获取 + embeddings + pymilvus insert
        return 0

    async def _switch_alias(self, alias: str, new_collection: str) -> None:
        """原子性切换别名到新集合。

        使用 pymilvus utility.alter_alias(collection_name, alias)。
        如果别名不存在则 utility.create_alias()。
        """
        pass

    async def _drop_collection(self, collection_name: str) -> None:
        """删除物理集合。

        实际实现使用 pymilvus utility.drop_collection()。
        """
        pass
