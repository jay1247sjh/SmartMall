"""
枚举定义

与 TypeScript 和 Java 版本保持一致
"""

from enum import Enum
from typing import Dict


class UserRole(str, Enum):
    """用户角色枚举"""
    ADMIN = "ADMIN"
    MERCHANT = "MERCHANT"
    USER = "USER"


class UserStatus(str, Enum):
    """用户状态枚举"""
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    FROZEN = "FROZEN"
    DELETED = "DELETED"


class OnlineStatus(str, Enum):
    """用户在线状态枚举"""
    ONLINE = "ONLINE"
    DISCONNECTED = "DISCONNECTED"
    OFFLINE = "OFFLINE"


class AreaType(str, Enum):
    """区域类型枚举"""
    RETAIL = "retail"
    FOOD = "food"
    SERVICE = "service"
    ANCHOR = "anchor"
    COMMON = "common"
    CORRIDOR = "corridor"
    ELEVATOR = "elevator"
    ESCALATOR = "escalator"
    STAIRS = "stairs"
    RESTROOM = "restroom"
    STORAGE = "storage"
    OFFICE = "office"
    PARKING = "parking"
    OTHER = "other"


class AreaStatus(str, Enum):
    """区域状态枚举"""
    AVAILABLE = "AVAILABLE"
    LOCKED = "LOCKED"
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    OCCUPIED = "OCCUPIED"


class StoreStatus(str, Enum):
    """店铺状态枚举"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    CLOSED = "CLOSED"


class ProductStatus(str, Enum):
    """商品状态枚举"""
    ON_SALE = "ON_SALE"
    OFF_SALE = "OFF_SALE"
    SOLD_OUT = "SOLD_OUT"


# 显示名称映射
USER_ROLE_NAMES: Dict[UserRole, str] = {
    UserRole.ADMIN: "管理员",
    UserRole.MERCHANT: "商家",
    UserRole.USER: "普通用户",
}

AREA_TYPE_NAMES: Dict[AreaType, str] = {
    AreaType.RETAIL: "零售店铺",
    AreaType.FOOD: "餐饮",
    AreaType.SERVICE: "服务",
    AreaType.ANCHOR: "主力店",
    AreaType.COMMON: "公共区域",
    AreaType.CORRIDOR: "走廊",
    AreaType.ELEVATOR: "电梯",
    AreaType.ESCALATOR: "扶梯",
    AreaType.STAIRS: "楼梯",
    AreaType.RESTROOM: "洗手间",
    AreaType.STORAGE: "仓储",
    AreaType.OFFICE: "办公",
    AreaType.PARKING: "停车",
    AreaType.OTHER: "其他",
}

AREA_TYPE_COLORS: Dict[AreaType, str] = {
    AreaType.RETAIL: "#3b82f6",
    AreaType.FOOD: "#f97316",
    AreaType.SERVICE: "#8b5cf6",
    AreaType.ANCHOR: "#ef4444",
    AreaType.COMMON: "#6b7280",
    AreaType.CORRIDOR: "#9ca3af",
    AreaType.ELEVATOR: "#10b981",
    AreaType.ESCALATOR: "#14b8a6",
    AreaType.STAIRS: "#06b6d4",
    AreaType.RESTROOM: "#ec4899",
    AreaType.STORAGE: "#78716c",
    AreaType.OFFICE: "#6366f1",
    AreaType.PARKING: "#84cc16",
    AreaType.OTHER: "#a3a3a3",
}

STORE_STATUS_NAMES: Dict[StoreStatus, str] = {
    StoreStatus.PENDING: "待审批",
    StoreStatus.ACTIVE: "营业中",
    StoreStatus.INACTIVE: "暂停营业",
    StoreStatus.CLOSED: "已关闭",
}

PRODUCT_STATUS_NAMES: Dict[ProductStatus, str] = {
    ProductStatus.ON_SALE: "在售",
    ProductStatus.OFF_SALE: "下架",
    ProductStatus.SOLD_OUT: "售罄",
}


def is_shop_area_type(area_type: AreaType) -> bool:
    """判断区域类型是否为店铺类型"""
    return area_type in [AreaType.RETAIL, AreaType.FOOD, AreaType.SERVICE, AreaType.ANCHOR]
