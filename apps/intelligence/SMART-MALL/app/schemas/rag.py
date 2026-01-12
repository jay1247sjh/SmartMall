"""
RAG API Schema 定义

定义 RAG 相关 API 的请求和响应模型
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ============ 店铺搜索 ============

class StoreSearchRequest(BaseModel):
    """店铺搜索请求"""
    query: str = Field(..., description="搜索查询", min_length=1, max_length=500)
    category: Optional[str] = Field(None, description="店铺分类过滤")
    floor: Optional[int] = Field(None, description="楼层过滤", ge=1, le=10)
    top_k: Optional[int] = Field(5, description="返回数量", ge=1, le=20)
    score_threshold: Optional[float] = Field(0.5, description="相似度阈值", ge=0, le=1)


class StorePosition(BaseModel):
    """店铺位置"""
    x: float
    y: float
    z: float


class StoreSearchItem(BaseModel):
    """店铺搜索结果项"""
    id: str
    name: str
    category: str
    description: str
    floor: int
    area: str
    position: StorePosition
    score: float


class StoreSearchResponse(BaseModel):
    """店铺搜索响应"""
    success: bool = True
    query: str
    total: int
    results: List[StoreSearchItem]
    message: Optional[str] = None


# ============ 商品搜索 ============

class ProductSearchRequest(BaseModel):
    """商品搜索请求"""
    query: str = Field(..., description="搜索查询", min_length=1, max_length=500)
    category: Optional[str] = Field(None, description="商品分类过滤")
    brand: Optional[str] = Field(None, description="品牌过滤")
    min_price: Optional[float] = Field(None, description="最低价格", ge=0)
    max_price: Optional[float] = Field(None, description="最高价格", ge=0)
    top_k: Optional[int] = Field(10, description="返回数量", ge=1, le=50)
    score_threshold: Optional[float] = Field(0.5, description="相似度阈值", ge=0, le=1)


class ProductSearchItem(BaseModel):
    """商品搜索结果项"""
    id: str
    name: str
    brand: str
    category: str
    description: str
    price: float
    store_id: str
    store_name: str
    score: float


class ProductSearchResponse(BaseModel):
    """商品搜索响应"""
    success: bool = True
    query: str
    total: int
    results: List[ProductSearchItem]
    message: Optional[str] = None


# ============ 数据同步 ============

class SyncRequest(BaseModel):
    """同步请求"""
    collections: Optional[List[str]] = Field(
        None,
        description="要同步的集合列表，为空则同步全部"
    )
    force: bool = Field(False, description="是否强制全量同步")


class SyncResultItem(BaseModel):
    """同步结果项"""
    collection: str
    total: int
    inserted: int
    updated: int
    failed: int
    duration_ms: float
    timestamp: str


class SyncResponse(BaseModel):
    """同步响应"""
    success: bool = True
    results: List[SyncResultItem]
    message: Optional[str] = None


# ============ 健康检查 ============

class HealthCheckResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="整体状态: healthy/unhealthy")
    milvus: bool = Field(..., description="Milvus 连接状态")
    embedding: bool = Field(..., description="Embedding 服务状态")
    collections: Dict[str, bool] = Field(..., description="各集合状态")


# ============ 导航 ============

class NavigateRequest(BaseModel):
    """导航请求"""
    store_name: str = Field(..., description="店铺名称", min_length=1)


class NavigateResponse(BaseModel):
    """导航响应"""
    success: bool
    store: Optional[StoreSearchItem] = None
    message: str
