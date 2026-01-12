"""
Milvus 集合 Schema 定义

定义店铺、商品、位置等集合的数据结构
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field, asdict
from pymilvus import CollectionSchema, FieldSchema, DataType
from datetime import datetime
import time

from app.core.config import settings


# ============ Embedding 维度 ============
EMBEDDING_DIM = settings.EMBEDDING_DIMENSION


# ============ 店铺集合 Schema ============

STORES_FIELDS = [
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
    FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2048),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=64),
    FieldSchema(name="floor", dtype=DataType.INT64),
    FieldSchema(name="area", dtype=DataType.VARCHAR, max_length=32),
    FieldSchema(name="position_x", dtype=DataType.FLOAT),
    FieldSchema(name="position_y", dtype=DataType.FLOAT),
    FieldSchema(name="position_z", dtype=DataType.FLOAT),
    FieldSchema(name="business_hours", dtype=DataType.VARCHAR, max_length=128),
    FieldSchema(name="rating", dtype=DataType.FLOAT),
    FieldSchema(name="tags", dtype=DataType.VARCHAR, max_length=512),  # JSON 字符串
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
    FieldSchema(name="updated_at", dtype=DataType.INT64),
]

STORES_SCHEMA = CollectionSchema(
    fields=STORES_FIELDS,
    description="商城店铺信息",
    enable_dynamic_field=False
)


# ============ 商品集合 Schema ============

PRODUCTS_FIELDS = [
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
    FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2048),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=64),
    FieldSchema(name="brand", dtype=DataType.VARCHAR, max_length=128),
    FieldSchema(name="price", dtype=DataType.FLOAT),
    FieldSchema(name="store_id", dtype=DataType.VARCHAR, max_length=64),
    FieldSchema(name="store_name", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="image_url", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(name="rating", dtype=DataType.FLOAT),
    FieldSchema(name="stock", dtype=DataType.INT64),
    FieldSchema(name="tags", dtype=DataType.VARCHAR, max_length=512),  # JSON 字符串
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
    FieldSchema(name="updated_at", dtype=DataType.INT64),
]

PRODUCTS_SCHEMA = CollectionSchema(
    fields=PRODUCTS_FIELDS,
    description="商品信息",
    enable_dynamic_field=False
)


# ============ 位置集合 Schema ============

LOCATIONS_FIELDS = [
    FieldSchema(name="id", dtype=DataType.VARCHAR, max_length=64, is_primary=True),
    FieldSchema(name="name", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="type", dtype=DataType.VARCHAR, max_length=32),  # area/facility/entrance/elevator
    FieldSchema(name="floor", dtype=DataType.INT64),
    FieldSchema(name="position_x", dtype=DataType.FLOAT),
    FieldSchema(name="position_y", dtype=DataType.FLOAT),
    FieldSchema(name="position_z", dtype=DataType.FLOAT),
    FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=1024),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
    FieldSchema(name="updated_at", dtype=DataType.INT64),
]

LOCATIONS_SCHEMA = CollectionSchema(
    fields=LOCATIONS_FIELDS,
    description="位置信息（区域、设施、入口等）",
    enable_dynamic_field=False
)


# ============ 数据类定义 ============

@dataclass
class Position:
    """3D 位置坐标"""
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    
    def to_dict(self) -> Dict[str, float]:
        return {"x": self.x, "y": self.y, "z": self.z}


@dataclass
class StoreDocument:
    """店铺文档"""
    id: str
    name: str
    description: str = ""
    category: str = ""
    floor: int = 1
    area: str = ""
    position: Position = field(default_factory=Position)
    business_hours: str = "09:00-22:00"
    rating: float = 0.0
    tags: List[str] = field(default_factory=list)
    embedding: List[float] = field(default_factory=list)
    updated_at: int = field(default_factory=lambda: int(time.time()))
    
    def to_text(self) -> str:
        """转换为用于生成 Embedding 的文本"""
        parts = [
            f"店铺名称：{self.name}",
            f"分类：{self.category}" if self.category else "",
            f"位置：{self.floor}楼{self.area}区" if self.area else f"位置：{self.floor}楼",
            f"描述：{self.description}" if self.description else "",
            f"标签：{', '.join(self.tags)}" if self.tags else "",
        ]
        return " ".join(filter(None, parts))
    
    def to_milvus_dict(self) -> Dict[str, Any]:
        """转换为 Milvus 插入格式"""
        import json
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "floor": self.floor,
            "area": self.area,
            "position_x": self.position.x,
            "position_y": self.position.y,
            "position_z": self.position.z,
            "business_hours": self.business_hours,
            "rating": self.rating,
            "tags": json.dumps(self.tags, ensure_ascii=False),
            "embedding": self.embedding,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_milvus_dict(cls, data: Dict[str, Any]) -> "StoreDocument":
        """从 Milvus 数据创建"""
        import json
        tags = data.get("tags", "[]")
        if isinstance(tags, str):
            tags = json.loads(tags) if tags else []
        
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            category=data.get("category", ""),
            floor=data.get("floor", 1),
            area=data.get("area", ""),
            position=Position(
                x=data.get("position_x", 0),
                y=data.get("position_y", 0),
                z=data.get("position_z", 0)
            ),
            business_hours=data.get("business_hours", ""),
            rating=data.get("rating", 0),
            tags=tags,
            embedding=data.get("embedding", []),
            updated_at=data.get("updated_at", 0),
        )


@dataclass
class ProductDocument:
    """商品文档"""
    id: str
    name: str
    description: str = ""
    category: str = ""
    brand: str = ""
    price: float = 0.0
    store_id: str = ""
    store_name: str = ""
    image_url: str = ""
    rating: float = 0.0
    stock: int = 0
    tags: List[str] = field(default_factory=list)
    embedding: List[float] = field(default_factory=list)
    updated_at: int = field(default_factory=lambda: int(time.time()))
    
    def to_text(self) -> str:
        """转换为用于生成 Embedding 的文本"""
        parts = [
            f"商品名称：{self.name}",
            f"品牌：{self.brand}" if self.brand else "",
            f"分类：{self.category}" if self.category else "",
            f"价格：{self.price}元" if self.price > 0 else "",
            f"店铺：{self.store_name}" if self.store_name else "",
            f"描述：{self.description}" if self.description else "",
            f"标签：{', '.join(self.tags)}" if self.tags else "",
        ]
        return " ".join(filter(None, parts))
    
    def to_milvus_dict(self) -> Dict[str, Any]:
        """转换为 Milvus 插入格式"""
        import json
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "brand": self.brand,
            "price": self.price,
            "store_id": self.store_id,
            "store_name": self.store_name,
            "image_url": self.image_url,
            "rating": self.rating,
            "stock": self.stock,
            "tags": json.dumps(self.tags, ensure_ascii=False),
            "embedding": self.embedding,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_milvus_dict(cls, data: Dict[str, Any]) -> "ProductDocument":
        """从 Milvus 数据创建"""
        import json
        tags = data.get("tags", "[]")
        if isinstance(tags, str):
            tags = json.loads(tags) if tags else []
        
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            category=data.get("category", ""),
            brand=data.get("brand", ""),
            price=data.get("price", 0),
            store_id=data.get("store_id", ""),
            store_name=data.get("store_name", ""),
            image_url=data.get("image_url", ""),
            rating=data.get("rating", 0),
            stock=data.get("stock", 0),
            tags=tags,
            embedding=data.get("embedding", []),
            updated_at=data.get("updated_at", 0),
        )


@dataclass
class LocationDocument:
    """位置文档"""
    id: str
    name: str
    type: str = "area"  # area/facility/entrance/elevator
    floor: int = 1
    position: Position = field(default_factory=Position)
    description: str = ""
    embedding: List[float] = field(default_factory=list)
    updated_at: int = field(default_factory=lambda: int(time.time()))
    
    def to_text(self) -> str:
        """转换为用于生成 Embedding 的文本"""
        type_names = {
            "area": "区域",
            "facility": "设施",
            "entrance": "入口",
            "elevator": "电梯",
        }
        type_name = type_names.get(self.type, self.type)
        parts = [
            f"{type_name}名称：{self.name}",
            f"位置：{self.floor}楼",
            f"描述：{self.description}" if self.description else "",
        ]
        return " ".join(filter(None, parts))
    
    def to_milvus_dict(self) -> Dict[str, Any]:
        """转换为 Milvus 插入格式"""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "floor": self.floor,
            "position_x": self.position.x,
            "position_y": self.position.y,
            "position_z": self.position.z,
            "description": self.description,
            "embedding": self.embedding,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_milvus_dict(cls, data: Dict[str, Any]) -> "LocationDocument":
        """从 Milvus 数据创建"""
        return cls(
            id=data["id"],
            name=data["name"],
            type=data.get("type", "area"),
            floor=data.get("floor", 1),
            position=Position(
                x=data.get("position_x", 0),
                y=data.get("position_y", 0),
                z=data.get("position_z", 0)
            ),
            description=data.get("description", ""),
            embedding=data.get("embedding", []),
            updated_at=data.get("updated_at", 0),
        )
