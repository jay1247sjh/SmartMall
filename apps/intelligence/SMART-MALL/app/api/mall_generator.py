"""
商城布局生成器 API

通过自然语言描述快速生成商城布局数据
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import re
import json

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ 请求/响应模型 ============

class GenerateMallRequest(BaseModel):
    """生成商城请求"""
    description: str  # 自然语言描述
    userId: Optional[str] = None  # 用户ID（可选）
    

class Vertex(BaseModel):
    """顶点"""
    x: float
    y: float


class Outline(BaseModel):
    """轮廓"""
    vertices: List[Vertex]
    isClosed: bool = True


class AreaData(BaseModel):
    """区域数据"""
    name: str
    type: str  # store, corridor, facility, entrance
    shape: Outline
    color: str
    properties: Optional[Dict[str, Any]] = None


class FloorData(BaseModel):
    """楼层数据"""
    name: str
    level: int
    height: float = 4.0
    inheritOutline: bool = True
    areas: List[AreaData]


class MallLayoutData(BaseModel):
    """商城布局数据"""
    name: str
    description: str
    outline: Outline
    floors: List[FloorData]
    settings: Dict[str, Any]


class GenerateMallResponse(BaseModel):
    """生成商城响应"""
    success: bool
    message: str
    data: Optional[MallLayoutData] = None
    parseInfo: Optional[Dict[str, Any]] = None  # 解析信息，帮助用户理解


# ============ 布局生成逻辑 ============

# 预定义的店铺类型和颜色
STORE_TYPES = {
    "服装": {"type": "store", "color": "#3b82f6", "category": "fashion"},
    "运动": {"type": "store", "color": "#22c55e", "category": "sports"},
    "餐饮": {"type": "store", "color": "#f97316", "category": "food"},
    "餐厅": {"type": "store", "color": "#f97316", "category": "food"},
    "美食": {"type": "store", "color": "#f97316", "category": "food"},
    "咖啡": {"type": "store", "color": "#a855f7", "category": "cafe"},
    "数码": {"type": "store", "color": "#06b6d4", "category": "electronics"},
    "电子": {"type": "store", "color": "#06b6d4", "category": "electronics"},
    "珠宝": {"type": "store", "color": "#eab308", "category": "jewelry"},
    "化妆品": {"type": "store", "color": "#ec4899", "category": "cosmetics"},
    "超市": {"type": "store", "color": "#84cc16", "category": "supermarket"},
    "电影院": {"type": "facility", "color": "#6366f1", "category": "entertainment"},
    "游戏厅": {"type": "facility", "color": "#8b5cf6", "category": "entertainment"},
    "卫生间": {"type": "facility", "color": "#64748b", "category": "facility"},
    "电梯": {"type": "facility", "color": "#475569", "category": "facility"},
    "入口": {"type": "entrance", "color": "#10b981", "category": "entrance"},
    "走廊": {"type": "corridor", "color": "#94a3b8", "category": "corridor"},
}

# 知名品牌映射
BRAND_CATEGORIES = {
    # 运动品牌
    "nike": "运动", "耐克": "运动",
    "adidas": "运动", "阿迪达斯": "运动",
    "puma": "运动", "彪马": "运动",
    "under armour": "运动", "安德玛": "运动",
    "lining": "运动", "李宁": "运动",
    "anta": "运动", "安踏": "运动",
    
    # 服装品牌
    "zara": "服装",
    "h&m": "服装",
    "uniqlo": "服装", "优衣库": "服装",
    "gap": "服装",
    "gucci": "服装",
    "lv": "服装", "louis vuitton": "服装",
    
    # 餐饮品牌
    "starbucks": "咖啡", "星巴克": "咖啡",
    "mcdonald": "餐饮", "麦当劳": "餐饮",
    "kfc": "餐饮", "肯德基": "餐饮",
    "pizza hut": "餐饮", "必胜客": "餐饮",
    "海底捞": "餐饮",
    "西贝": "餐饮",
    
    # 数码品牌
    "apple": "数码", "苹果": "数码",
    "huawei": "数码", "华为": "数码",
    "xiaomi": "数码", "小米": "数码",
    "samsung": "数码", "三星": "数码",
}


def parse_mall_description(description: str) -> Dict[str, Any]:
    """
    解析自然语言描述，提取商城信息
    
    支持的格式示例：
    - "创建一个3层商城，1楼有Nike、Adidas，2楼有星巴克、麦当劳，3楼是电影院"
    - "生成商城：名称=我的商城，楼层=3，1F:Nike/Adidas/Zara，2F:星巴克/肯德基，3F:电影院"
    """
    result = {
        "name": "新商城",
        "description": description,
        "floor_count": 1,
        "floors": {},
        "mall_size": {"width": 100, "height": 80},  # 默认尺寸
    }
    
    # 提取商城名称
    name_match = re.search(r'名称[=:：]([^\s,，]+)', description)
    if name_match:
        result["name"] = name_match.group(1)
    
    # 提取楼层数
    floor_match = re.search(r'(\d+)\s*层', description)
    if floor_match:
        result["floor_count"] = int(floor_match.group(1))
    
    # 提取尺寸
    size_match = re.search(r'(\d+)[xX×](\d+)', description)
    if size_match:
        result["mall_size"]["width"] = int(size_match.group(1))
        result["mall_size"]["height"] = int(size_match.group(2))
    
    # 解析每层的店铺
    # 格式1: "1楼有Nike、Adidas" 或 "1F有Nike、Adidas"
    floor_patterns = [
        r'(\d+)\s*[楼层F]\s*[有是：:]\s*([^，。\d]+)',
        r'(\d+)\s*[楼层F]\s*[:：]\s*([^，。\d]+)',
    ]
    
    for pattern in floor_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        for match in matches:
            floor_num = int(match[0])
            stores_str = match[1]
            # 分割店铺名称
            stores = re.split(r'[、/,，和与]', stores_str)
            stores = [s.strip() for s in stores if s.strip()]
            if stores:
                result["floors"][floor_num] = stores
    
    # 如果没有解析到具体楼层，尝试提取所有提到的品牌/店铺
    if not result["floors"]:
        all_stores = []
        for brand in BRAND_CATEGORIES.keys():
            if brand.lower() in description.lower():
                all_stores.append(brand)
        
        # 平均分配到各楼层
        if all_stores:
            floor_count = result["floor_count"]
            stores_per_floor = max(1, len(all_stores) // floor_count)
            for i in range(floor_count):
                start = i * stores_per_floor
                end = start + stores_per_floor if i < floor_count - 1 else len(all_stores)
                if start < len(all_stores):
                    result["floors"][i + 1] = all_stores[start:end]
    
    return result


def get_store_info(store_name: str) -> Dict[str, Any]:
    """获取店铺信息（类型、颜色等）"""
    store_lower = store_name.lower()
    
    # 检查是否是已知品牌
    for brand, category in BRAND_CATEGORIES.items():
        if brand in store_lower:
            type_info = STORE_TYPES.get(category, STORE_TYPES["服装"])
            return {
                "name": store_name,
                "type": type_info["type"],
                "color": type_info["color"],
                "category": type_info["category"],
            }
    
    # 检查是否包含类型关键词
    for keyword, type_info in STORE_TYPES.items():
        if keyword in store_name:
            return {
                "name": store_name,
                "type": type_info["type"],
                "color": type_info["color"],
                "category": type_info["category"],
            }
    
    # 默认为普通店铺
    return {
        "name": store_name,
        "type": "store",
        "color": "#3b82f6",
        "category": "general",
    }


def generate_mall_layout(parsed_info: Dict[str, Any]) -> MallLayoutData:
    """根据解析结果生成商城布局数据"""
    
    width = parsed_info["mall_size"]["width"]
    height = parsed_info["mall_size"]["height"]
    floor_count = parsed_info["floor_count"]
    
    # 生成商城轮廓（矩形）
    outline = Outline(
        vertices=[
            Vertex(x=0, y=0),
            Vertex(x=width, y=0),
            Vertex(x=width, y=height),
            Vertex(x=0, y=height),
        ],
        isClosed=True
    )
    
    floors = []
    
    for level in range(1, floor_count + 1):
        stores = parsed_info["floors"].get(level, [])
        areas = []
        
        # 计算区域布局
        # 留出走廊空间（中间 10 米宽的走廊）
        corridor_width = 10
        usable_width = (width - corridor_width) / 2
        
        # 每层的店铺数量
        store_count = len(stores) if stores else 2
        
        # 计算每个店铺的尺寸
        store_height = (height - 10) / max(store_count, 1)  # 上下各留 5 米
        store_width = usable_width - 5  # 左右各留 2.5 米
        
        # 生成走廊
        areas.append(AreaData(
            name=f"{level}F 主走廊",
            type="corridor",
            shape=Outline(
                vertices=[
                    Vertex(x=usable_width, y=5),
                    Vertex(x=usable_width + corridor_width, y=5),
                    Vertex(x=usable_width + corridor_width, y=height - 5),
                    Vertex(x=usable_width, y=height - 5),
                ],
                isClosed=True
            ),
            color="#94a3b8"
        ))
        
        # 生成店铺区域
        for i, store_name in enumerate(stores):
            store_info = get_store_info(store_name)
            
            # 左侧或右侧
            side = i % 2
            row = i // 2
            
            if side == 0:  # 左侧
                x1 = 5
                x2 = 5 + store_width
            else:  # 右侧
                x1 = usable_width + corridor_width + 5
                x2 = width - 5
            
            y1 = 5 + row * store_height
            y2 = y1 + store_height - 2  # 留 2 米间隔
            
            areas.append(AreaData(
                name=store_info["name"],
                type=store_info["type"],
                shape=Outline(
                    vertices=[
                        Vertex(x=x1, y=y1),
                        Vertex(x=x2, y=y1),
                        Vertex(x=x2, y=y2),
                        Vertex(x=x1, y=y2),
                    ],
                    isClosed=True
                ),
                color=store_info["color"],
                properties={
                    "category": store_info["category"],
                    "area": (x2 - x1) * (y2 - y1),
                }
            ))
        
        # 如果没有指定店铺，生成默认区域
        if not stores:
            areas.append(AreaData(
                name=f"{level}F 待规划区域",
                type="store",
                shape=Outline(
                    vertices=[
                        Vertex(x=5, y=5),
                        Vertex(x=usable_width - 5, y=5),
                        Vertex(x=usable_width - 5, y=height - 5),
                        Vertex(x=5, y=height - 5),
                    ],
                    isClosed=True
                ),
                color="#64748b"
            ))
        
        floors.append(FloorData(
            name=f"{level}F",
            level=level,
            height=4.0,
            inheritOutline=True,
            areas=areas
        ))
    
    return MallLayoutData(
        name=parsed_info["name"],
        description=parsed_info["description"],
        outline=outline,
        floors=floors,
        settings={
            "gridSize": 1,
            "snapToGrid": True,
            "defaultFloorHeight": 4,
            "unit": "meters",
            "display": {
                "showGrid": True,
                "showRuler": True,
                "showAreaLabels": True,
            }
        }
    )


# ============ API 端点 ============

@router.post("/mall/generate", response_model=GenerateMallResponse)
async def generate_mall_from_text(request: GenerateMallRequest) -> GenerateMallResponse:
    """
    通过自然语言描述生成商城布局
    
    示例输入：
    - "创建一个3层商城，1楼有Nike、Adidas，2楼有星巴克、麦当劳，3楼是电影院"
    - "生成100x80的商城，2层，1F:Zara/H&M/优衣库，2F:海底捞/西贝"
    """
    try:
        logger.info(f"Generating mall from description: {request.description}")
        
        # 解析描述
        parsed_info = parse_mall_description(request.description)
        logger.info(f"Parsed info: {parsed_info}")
        
        # 生成布局
        layout = generate_mall_layout(parsed_info)
        
        return GenerateMallResponse(
            success=True,
            message=f"成功生成商城布局：{layout.name}，共 {len(layout.floors)} 层",
            data=layout,
            parseInfo={
                "parsedFloorCount": parsed_info["floor_count"],
                "parsedStores": parsed_info["floors"],
                "mallSize": parsed_info["mall_size"],
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to generate mall: {e}")
        return GenerateMallResponse(
            success=False,
            message=f"生成失败：{str(e)}",
            data=None
        )


@router.get("/mall/generate/help")
async def get_generation_help():
    """获取商城生成帮助信息"""
    return {
        "description": "通过自然语言描述快速生成商城布局",
        "formats": [
            {
                "name": "简单格式",
                "example": "创建一个3层商城，1楼有Nike、Adidas，2楼有星巴克、麦当劳",
                "description": "直接描述楼层和店铺"
            },
            {
                "name": "详细格式",
                "example": "生成100x80的商城，名称=我的商城，2层，1F:Zara/H&M，2F:海底捞",
                "description": "可指定尺寸、名称等详细信息"
            }
        ],
        "supportedBrands": list(BRAND_CATEGORIES.keys()),
        "supportedTypes": list(STORE_TYPES.keys()),
    }
