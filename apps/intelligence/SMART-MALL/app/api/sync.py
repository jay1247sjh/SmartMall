"""
同步监控 API

提供同步状态查询、死信队列管理和 Prometheus 指标端点。

Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.config import settings
from app.core.redis_pool import RedisPoolFactory
from app.core.sync.event_bus import EventBus
from app.core.sync.events import SyncEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sync", tags=["sync"])


# ---------- Response Models ----------

class SyncStatusResponse(BaseModel):
    """同步状态响应"""
    retry_queue_size: int = 0
    dead_letter_count: int = 0
    last_sync_time: Optional[str] = None
    consistency_checker_heartbeat: Optional[Dict[str, Any]] = None
    timestamp: str


class DeadLetterItem(BaseModel):
    """死信队列条目"""
    event_id: str
    entity_type: str
    operation: str
    entity_id: str
    source: str
    timestamp: str


class DeadLetterResponse(BaseModel):
    """死信队列响应"""
    total: int
    items: List[DeadLetterItem]


class PublishEventResponse(BaseModel):
    """发布同步事件响应"""
    accepted: bool
    message_id: str


# ---------- Endpoints ----------

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status():
    """查询同步状态：队列积压量、最近同步时间、失败事件数。"""
    try:
        client = await RedisPoolFactory.get_client()

        # 重试队列积压量
        retry_size = await client.zcard("smartmall:sync:retry") or 0

        # 死信队列数量
        dl_count = await client.llen("smartmall:sync:dead_letter") or 0

        # 一致性检查器心跳
        heartbeat_raw = await client.get(
            "smartmall:sync:consistency_checker:heartbeat"
        )
        heartbeat = json.loads(heartbeat_raw) if heartbeat_raw else None

        return SyncStatusResponse(
            retry_queue_size=retry_size,
            dead_letter_count=dl_count,
            last_sync_time=heartbeat.get("last_run") if heartbeat else None,
            consistency_checker_heartbeat=heartbeat,
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.error(json.dumps({
            "event": "sync_status_query_failed",
            "reason": str(e),
        }, ensure_ascii=False))
        raise HTTPException(status_code=503, detail="无法获取同步状态")


@router.post("/events", response_model=PublishEventResponse, status_code=202)
async def publish_sync_event(event: SyncEvent):
    """接收后端增量同步事件并写入 Redis Stream。"""
    try:
        bus = EventBus()
        message_id = await bus.publish(event)
        return PublishEventResponse(accepted=True, message_id=message_id)
    except Exception as e:
        logger.error(json.dumps({
            "event": "sync_event_publish_failed",
            "event_id": event.event_id,
            "reason": str(e),
        }, ensure_ascii=False))
        raise HTTPException(status_code=500, detail="同步事件发布失败")


@router.get("/dead-letter", response_model=DeadLetterResponse)
async def get_dead_letter(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """查询死信队列。"""
    try:
        client = await RedisPoolFactory.get_client()
        total = await client.llen("smartmall:sync:dead_letter") or 0
        raw_items = await client.lrange(
            "smartmall:sync:dead_letter", offset, offset + limit - 1
        )

        items = []
        for raw in raw_items:
            try:
                data = json.loads(raw)
                items.append(DeadLetterItem(
                    event_id=data.get("event_id", ""),
                    entity_type=data.get("entity_type", ""),
                    operation=data.get("operation", ""),
                    entity_id=data.get("entity_id", ""),
                    source=data.get("source", ""),
                    timestamp=data.get("timestamp", ""),
                ))
            except (json.JSONDecodeError, KeyError):
                continue

        return DeadLetterResponse(total=total, items=items)
    except Exception as e:
        logger.error(json.dumps({
            "event": "dead_letter_query_failed",
            "reason": str(e),
        }, ensure_ascii=False))
        raise HTTPException(status_code=503, detail="无法获取死信队列")


@router.post("/dead-letter/{event_id}/retry")
async def retry_dead_letter(event_id: str):
    """重试死信队列中的指定事件。

    从死信 LIST 中查找并移除该事件，重新发布到 EventBus。
    """
    try:
        from app.core.sync.event_bus import EventBus
        from app.core.sync.events import SyncEvent

        client = await RedisPoolFactory.get_client()
        dl_key = "smartmall:sync:dead_letter"

        # 遍历查找目标事件
        all_items = await client.lrange(dl_key, 0, -1)
        target_raw = None
        for raw in all_items:
            try:
                data = json.loads(raw)
                if data.get("event_id") == event_id:
                    target_raw = raw
                    break
            except json.JSONDecodeError:
                continue

        if not target_raw:
            raise HTTPException(status_code=404, detail="事件未找到")

        # 从死信队列移除
        await client.lrem(dl_key, 1, target_raw)

        # 重新发布到 EventBus
        event = SyncEvent.model_validate_json(target_raw)
        bus = EventBus()
        await bus.publish(event)

        return {"status": "retried", "event_id": event_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(json.dumps({
            "event": "dead_letter_retry_failed",
            "event_id": event_id,
            "reason": str(e),
        }, ensure_ascii=False))
        raise HTTPException(status_code=500, detail="重试失败")


# ---------- Prometheus Metrics ----------

metrics_router = APIRouter(tags=["metrics"])


@metrics_router.get("/metrics")
async def prometheus_metrics():
    """Prometheus 格式暴露同步指标。"""
    try:
        client = await RedisPoolFactory.get_client()

        retry_size = await client.zcard("smartmall:sync:retry") or 0
        dl_count = await client.llen("smartmall:sync:dead_letter") or 0
        stream_len = await client.xlen("smartmall:sync:events") or 0

        lines = [
            "# HELP smartmall_sync_retry_queue_size Current retry queue size",
            "# TYPE smartmall_sync_retry_queue_size gauge",
            f"smartmall_sync_retry_queue_size {retry_size}",
            "",
            "# HELP smartmall_sync_dead_letter_count Dead letter queue size",
            "# TYPE smartmall_sync_dead_letter_count gauge",
            f"smartmall_sync_dead_letter_count {dl_count}",
            "",
            "# HELP smartmall_sync_stream_length Event stream length",
            "# TYPE smartmall_sync_stream_length gauge",
            f"smartmall_sync_stream_length {stream_len}",
        ]

        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content="\n".join(lines) + "\n",
            media_type="text/plain; version=0.0.4; charset=utf-8",
        )
    except Exception as e:
        logger.error(json.dumps({
            "event": "metrics_query_failed",
            "reason": str(e),
        }, ensure_ascii=False))
        raise HTTPException(status_code=503, detail="无法获取指标")
