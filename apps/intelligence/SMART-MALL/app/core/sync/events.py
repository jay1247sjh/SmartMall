"""
同步事件模型

定义增量同步管道中使用的事件数据模型和一致性检查报告。

Requirements: 7.1, 7.4
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class SyncEvent(BaseModel):
    """增量同步事件

    由 Java 后端通过 HTTP 推送或 EventBus 发布，
    描述一次实体变更操作（创建/更新/删除）。

    Attributes:
        event_id: 事件唯一标识（UUID），用于幂等性检查
        entity_type: 实体类型，对应 Milvus 集合映射
        operation: 操作类型
        entity_id: 被操作实体的业务 ID
        payload: 实体数据（create/update 时包含完整或增量数据，delete 时可为空）
        timestamp: 事件产生时间
        source: 事件来源标识
    """

    event_id: str = Field(default_factory=lambda: str(uuid4()))
    entity_type: Literal["store", "product", "location", "review", "rule"]
    operation: Literal["create", "update", "delete"]
    entity_id: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = "java_backend"


class ConsistencyReport(BaseModel):
    """一致性检查报告

    记录 PostgreSQL（通过 Java 后端）与 Milvus 之间的数据差异及修复结果。

    Attributes:
        collection: 检查的 Milvus 集合名称
        checked_at: 检查执行时间
        backend_count: Java 后端返回的实体数量
        milvus_count: Milvus 中的实体数量
        missing_in_milvus: Milvus 中缺失的实体 ID 列表
        orphaned_in_milvus: Milvus 中多余的实体 ID 列表
        compensating_events_created: 生成的补偿事件数量
        orphaned_cleaned: 清理的孤立记录数量
    """

    collection: str
    checked_at: datetime = Field(default_factory=datetime.utcnow)
    backend_count: int = 0
    milvus_count: int = 0
    missing_in_milvus: List[str] = Field(default_factory=list)
    orphaned_in_milvus: List[str] = Field(default_factory=list)
    compensating_events_created: int = 0
    orphaned_cleaned: int = 0
    error: Optional[str] = None
