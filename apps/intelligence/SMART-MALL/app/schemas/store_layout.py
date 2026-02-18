"""
店铺布局数据模型

定义 AI 生成店铺布局的请求/响应和数据结构
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class Position3D(BaseModel):
    """3D 位置"""
    x: float
    y: float
    z: float


class Rotation(BaseModel):
    """旋转（绕 Y 轴）"""
    y: float = 0.0


class Scale3D(BaseModel):
    """3D 缩放"""
    x: float = 1.0
    y: float = 1.0
    z: float = 1.0


class StoreObject(BaseModel):
    """店铺内的单个对象"""
    name: str
    materialId: str
    position: Position3D
    rotation: Rotation = Field(default_factory=Rotation)
    scale: Scale3D = Field(default_factory=Scale3D)


class StoreLayoutData(BaseModel):
    """店铺布局数据"""
    theme: str
    areaId: str
    objects: List[StoreObject]


class Vertex(BaseModel):
    """2D 顶点"""
    x: float
    y: float


class MaterialInfo(BaseModel):
    """材质信息"""
    id: str
    name: str
    commercialType: Optional[str] = None


class GenerateStoreLayoutRequest(BaseModel):
    """生成店铺布局请求"""
    theme: str
    areaId: str
    areaBoundary: List[Vertex]
    availableMaterials: List[MaterialInfo]


class GenerateStoreLayoutResponse(BaseModel):
    """生成店铺布局响应"""
    success: bool
    message: str
    data: Optional[StoreLayoutData] = None
