"""
楼层管理 API 路由

提供楼层的 CRUD 操作和语义搜索功能。
使用内存存储作为 MVP 后端，mock embedding 生成向量。
"""

import uuid
import random
import logging
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from app.schemas.rag import (
    FloorCreateRequest,
    FloorUpdateRequest,
    FloorItem,
    FloorSearchRequest,
    FloorSearchItem,
)
from app.schemas.base import DataResponse, ListResponse, BaseResponse
from app.core.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/floors", tags=["Floors"])

# ---------------------------------------------------------------------------
# In-memory storage (MVP)
# ---------------------------------------------------------------------------
floors_db: Dict[str, dict] = {}
stores_db: Dict[str, dict] = {}  # store_id -> {"floor_id": ...}


def _get_embedding_dim() -> int:
    return get_settings().EMBEDDING_DIMENSION


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_embedding(text: str) -> List[float]:
    """Generate a deterministic mock embedding seeded by text hash."""
    dim = _get_embedding_dim()
    rng = random.Random(hash(text))
    return [rng.uniform(-1, 1) for _ in range(dim)]


def _floor_to_item(record: dict) -> FloorItem:
    """Convert an internal floor record to a FloorItem response model."""
    return FloorItem(
        floor_id=record["floor_id"],
        floor_name=record["floor_name"],
        height_range=record["height_range"],
        layout_description=record["layout_description"],
        store_ids=record.get("store_ids", []),
    )


def _update_store_associations(floor_id: str, store_ids: List[str] | None) -> None:
    """Sync store ↔ floor associations in the in-memory stores_db."""
    if store_ids is None:
        return

    # Clear old associations pointing to this floor
    for sid, store in stores_db.items():
        if store.get("floor_id") == floor_id:
            store["floor_id"] = None

    # Set new associations
    for sid in store_ids:
        if sid not in stores_db:
            stores_db[sid] = {}
        stores_db[sid]["floor_id"] = floor_id


def _clear_store_associations(floor_id: str) -> None:
    """Clear floor_id from all stores associated with the given floor."""
    for store in stores_db.values():
        if store.get("floor_id") == floor_id:
            store["floor_id"] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=DataResponse[FloorItem])
async def create_floor(request: FloorCreateRequest):
    """
    创建楼层

    - 生成 layout_description 的 mock embedding
    - 同步更新关联店铺的 floor_id
    """
    try:
        floor_id = str(uuid.uuid4())

        embedding = _generate_embedding(request.layout_description) if request.layout_description else [0.0] * _get_embedding_dim()

        record = {
            "floor_id": floor_id,
            "floor_name": request.floor_name,
            "height_range": request.height_range.model_dump(),
            "layout_description": request.layout_description,
            "store_ids": request.store_ids or [],
            "embedding": embedding,
        }
        floors_db[floor_id] = record

        _update_store_associations(floor_id, request.store_ids)

        logger.info(f"Floor created: {floor_id} ({request.floor_name})")
        return DataResponse(data=_floor_to_item(record))

    except Exception as e:
        logger.error(f"Failed to create floor: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="创建楼层失败")


@router.get("", response_model=ListResponse[FloorItem])
async def list_floors():
    """查询所有楼层列表"""
    try:
        items = [_floor_to_item(r) for r in floors_db.values()]
        return ListResponse(data=items, total=len(items))
    except Exception as e:
        logger.error(f"Failed to list floors: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="查询楼层列表失败")


@router.get("/{floor_id}", response_model=DataResponse[FloorItem])
async def get_floor(floor_id: str):
    """查询单个楼层详情"""
    record = floors_db.get(floor_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"楼层 {floor_id} 不存在")
    return DataResponse(data=_floor_to_item(record))


@router.put("/{floor_id}", response_model=DataResponse[FloorItem])
async def update_floor(floor_id: str, request: FloorUpdateRequest):
    """
    更新楼层信息

    - 若 layout_description 变更则重新生成 embedding
    - 若 store_ids 变更则同步更新关联
    """
    record = floors_db.get(floor_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"楼层 {floor_id} 不存在")

    try:
        if request.floor_name is not None:
            record["floor_name"] = request.floor_name

        if request.height_range is not None:
            record["height_range"] = request.height_range.model_dump()

        if request.layout_description is not None:
            record["layout_description"] = request.layout_description
            record["embedding"] = _generate_embedding(request.layout_description) if request.layout_description else [0.0] * _get_embedding_dim()

        if request.store_ids is not None:
            record["store_ids"] = request.store_ids
            _update_store_associations(floor_id, request.store_ids)

        logger.info(f"Floor updated: {floor_id}")
        return DataResponse(data=_floor_to_item(record))

    except Exception as e:
        logger.error(f"Failed to update floor {floor_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="更新楼层失败")


@router.delete("/{floor_id}", response_model=BaseResponse)
async def delete_floor(floor_id: str):
    """
    删除楼层

    - 先清空关联店铺的 floor_id，再删除楼层记录
    """
    record = floors_db.get(floor_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"楼层 {floor_id} 不存在")

    try:
        _clear_store_associations(floor_id)
        del floors_db[floor_id]

        logger.info(f"Floor deleted: {floor_id}")
        return BaseResponse(message=f"楼层 {floor_id} 已删除")

    except Exception as e:
        logger.error(f"Failed to delete floor {floor_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="删除楼层失败")


@router.post("/search", response_model=ListResponse[FloorSearchItem])
async def search_floors(request: FloorSearchRequest):
    """
    语义搜索楼层

    使用 mock embedding 计算余弦相似度进行排序。
    """
    try:
        query_embedding = _generate_embedding(request.query)

        scored: list[tuple[float, dict]] = []
        for record in floors_db.values():
            rec_emb = record.get("embedding", [])
            if not rec_emb:
                continue
            score = _cosine_similarity(query_embedding, rec_emb)
            if score >= (request.score_threshold or 0.0):
                scored.append((score, record))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[: request.top_k or 5]

        items = [
            FloorSearchItem(
                floor_id=r["floor_id"],
                floor_name=r["floor_name"],
                height_range=r["height_range"],
                layout_description=r["layout_description"],
                store_ids=r.get("store_ids", []),
                score=round(s, 4),
            )
            for s, r in top
        ]

        return ListResponse(data=items, total=len(items))

    except Exception as e:
        logger.error(f"Floor search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="楼层搜索失败")


# ---------------------------------------------------------------------------
# Math helper
# ---------------------------------------------------------------------------

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    import math

    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
