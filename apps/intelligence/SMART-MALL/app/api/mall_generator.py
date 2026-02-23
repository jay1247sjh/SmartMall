"""
商城布局生成器 API

通过自然语言描述快速生成商城布局数据。
降级路径为参数化几何生成器，所有可调参数从 mall_fallback.yaml 读取。
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
import logging
import re
import yaml

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================
# Pydantic 请求/响应模型（保留不动）
# ============================================================

class GenerateMallRequest(BaseModel):
    """生成商城请求"""
    description: str
    userId: Optional[str] = None


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
    type: str
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
    parseInfo: Optional[Dict[str, Any]] = None


# ============================================================
# Config 层 — 加载 YAML，缺失即部署错误
# ============================================================

_config_cache: Optional[Dict[str, Any]] = None


def _load_fallback_config() -> Dict[str, Any]:
    """
    加载 mall_fallback.yaml 配置。
    结果缓存在模块级变量中，进程生命周期内只读一次。
    文件缺失或解析失败直接抛异常（部署错误，不兜底）。
    """
    global _config_cache
    if _config_cache is not None:
        return _config_cache

    config_path = Path(__file__).resolve().parent.parent / "prompts" / "mall_fallback.yaml"
    if not config_path.exists():
        raise FileNotFoundError(
            f"降级配置文件缺失: {config_path}。"
            "这是部署产物的一部分，请检查部署流程。"
        )

    with open(config_path, "r", encoding="utf-8") as f:
        _config_cache = yaml.safe_load(f)

    logger.info(f"Loaded fallback config: {config_path}")
    return _config_cache



# ============================================================
# Parser 层 — 纯正则解析，无品牌推断
# ============================================================

def parse_mall_description(description: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    解析自然语言描述，提取商城结构信息。
    纯正则，不做品牌/品类推断。所有默认值从 config 读取。

    支持的格式：
    - "创建一个3层商城，1楼有Nike、Adidas，2楼有星巴克、麦当劳"
    - "生成100x80的商城，名称=我的商城，2层，1F:Zara/H&M，2F:海底捞"
    - "3层商城，至少20个区域"
    """
    mall_defaults = config["mall_defaults"]

    result: Dict[str, Any] = {
        "name": mall_defaults["name"],
        "description": description,
        "floor_count": mall_defaults["floor_count"],
        "floors": {},
        "mall_size": {
            "width": mall_defaults["width"],
            "height": mall_defaults["height"],
        },
        "min_areas": 0,  # 0 表示未指定
    }

    # 提取商城名称
    name_match = re.search(r'名称[=:：]([^\s,，]+)', description)
    if name_match:
        result["name"] = name_match.group(1)

    # 提取楼层数
    floor_match = re.search(r'(\d+)\s*层', description)
    if floor_match:
        result["floor_count"] = int(floor_match.group(1))

    # 提取尺寸 (如 "100x80")
    size_match = re.search(r'(\d+)[xX×](\d+)', description)
    if size_match:
        result["mall_size"]["width"] = int(size_match.group(1))
        result["mall_size"]["height"] = int(size_match.group(2))

    # 提取最小区域数 (如 "至少20个区域")
    min_areas_match = re.search(r'至少\s*(\d+)\s*个?\s*区域', description)
    if min_areas_match:
        result["min_areas"] = int(min_areas_match.group(1))

    # 解析每层的店铺名称
    floor_patterns = [
        r'(\d+)\s*[楼层F]\s*[有是：:]\s*([^，。\d]+)',
        r'(\d+)\s*[楼层F]\s*[:：]\s*([^，。\d]+)',
    ]
    for pattern in floor_patterns:
        matches = re.findall(pattern, description, re.IGNORECASE)
        for match in matches:
            floor_num = int(match[0])
            stores_str = match[1]
            stores = re.split(r'[、/,，和与]', stores_str)
            stores = [s.strip() for s in stores if s.strip()]
            if stores:
                result["floors"][floor_num] = stores

    return result


# ============================================================
# Engine 层 — 确定性几何生成
# ============================================================

def _build_outline(width: float, height: float) -> Outline:
    """构建居中矩形轮廓"""
    ox, oy = -width / 2, -height / 2
    return Outline(
        vertices=[
            Vertex(x=ox, y=oy),
            Vertex(x=ox + width, y=oy),
            Vertex(x=ox + width, y=oy + height),
            Vertex(x=ox, y=oy + height),
        ],
        isClosed=True,
    )


def _generate_floor_areas(
    level: int,
    stores: List[str],
    width: float,
    height: float,
    config: Dict[str, Any],
    target_area_count: int = 0,
) -> List[AreaData]:
    """
    为单个楼层生成区域列表。
    采用"中走廊 + 两侧店铺"布局策略。
    所有几何参数从 config 读取。
    """
    layout = config["layout"]
    defaults = config["defaults"]

    margin = layout["margin"]
    store_gap = layout["store_gap"]
    corridor_width = layout["corridor_width"]
    min_store_height = layout["min_store_height"]

    color = defaults["color"]
    corridor_color = defaults["corridor_color"]
    store_type = defaults["store_type"]
    corridor_type = defaults["corridor_type"]
    placeholder_type = defaults["placeholder_type"]

    ox, oy = -width / 2, -height / 2
    usable_width = (width - corridor_width) / 2

    areas: List[AreaData] = []

    # 1. 走廊
    areas.append(AreaData(
        name=f"{level}F 主走廊",
        type=corridor_type,
        shape=Outline(
            vertices=[
                Vertex(x=ox + usable_width, y=oy + margin),
                Vertex(x=ox + usable_width + corridor_width, y=oy + margin),
                Vertex(x=ox + usable_width + corridor_width, y=oy + height - margin),
                Vertex(x=ox + usable_width, y=oy + height - margin),
            ],
            isClosed=True,
        ),
        color=corridor_color,
    ))

    # 2. 确定区域列表
    if stores:
        area_names = stores
    elif target_area_count > 0:
        area_names = [f"{level}F-区域{i+1}" for i in range(target_area_count)]
    else:
        min_per_floor = defaults.get("min_areas_per_floor", 2)
        area_names = [f"{level}F 待规划区域{i+1}" for i in range(min_per_floor)]

    area_count = len(area_names)

    # 3. 计算每个区域的几何尺寸
    usable_height = height - 2 * margin
    store_width = usable_width - margin  # 店铺宽度（走廊到边缘之间）

    # 左右两列，每列容纳 ceil(area_count / 2) 个
    rows = (area_count + 1) // 2
    raw_store_height = (usable_height - store_gap * max(rows - 1, 0)) / max(rows, 1)
    store_height = max(raw_store_height, min_store_height)

    # 4. 生成区域
    for i, area_name in enumerate(area_names):
        side = i % 2   # 0=左, 1=右
        row = i // 2

        if side == 0:
            x1 = ox + margin
            x2 = x1 + store_width
        else:
            x1 = ox + usable_width + corridor_width
            x2 = x1 + store_width

        y1 = oy + margin + row * (store_height + store_gap)
        y2 = y1 + store_height

        is_placeholder = not stores
        areas.append(AreaData(
            name=area_name,
            type=placeholder_type if is_placeholder else store_type,
            shape=Outline(
                vertices=[
                    Vertex(x=x1, y=y1),
                    Vertex(x=x2, y=y1),
                    Vertex(x=x2, y=y2),
                    Vertex(x=x1, y=y2),
                ],
                isClosed=True,
            ),
            color=color,
            properties={"area": round((x2 - x1) * (y2 - y1), 2)},
        ))

    return areas


def generate_mall_layout(
    parsed_info: Dict[str, Any],
    config: Dict[str, Any],
) -> MallLayoutData:
    """根据解析结果 + 配置生成商城布局数据"""
    width = parsed_info["mall_size"]["width"]
    height = parsed_info["mall_size"]["height"]
    floor_count = parsed_info["floor_count"]
    min_areas = parsed_info.get("min_areas", 0)

    # 每层目标区域数（向上取整分配）
    per_floor_target = 0
    if min_areas > 0:
        per_floor_target = -(-min_areas // floor_count)  # ceil division

    outline = _build_outline(width, height)

    defaults = config["defaults"]
    floor_height = defaults.get("floor_height", 4.0)

    floors: List[FloorData] = []
    for level in range(1, floor_count + 1):
        stores = parsed_info["floors"].get(level, [])
        target = per_floor_target if not stores else 0

        areas = _generate_floor_areas(
            level=level,
            stores=stores,
            width=width,
            height=height,
            config=config,
            target_area_count=target,
        )

        floors.append(FloorData(
            name=f"{level}F",
            level=level,
            height=floor_height,
            inheritOutline=True,
            areas=areas,
        ))

    return MallLayoutData(
        name=parsed_info["name"],
        description=parsed_info["description"],
        outline=outline,
        floors=floors,
        settings=config.get("settings", {}),
    )



# ============================================================
# 对外入口 — 降级路径单一入口
# ============================================================

def rule_based_generate(description: str) -> MallLayoutData:
    """
    降级路径单一入口。
    加载配置 → 解析描述 → 生成布局。
    """
    config = _load_fallback_config()
    parsed = parse_mall_description(description, config)
    return generate_mall_layout(parsed, config)


def get_help_content() -> Dict[str, Any]:
    """从 YAML 配置读取 help 文案"""
    config = _load_fallback_config()
    return config.get("help", {})


# ============================================================
# API 端点（保留不动）
# ============================================================

@router.post("/mall/generate", response_model=GenerateMallResponse)
async def generate_mall_from_text(request: GenerateMallRequest) -> GenerateMallResponse:
    """
    通过自然语言描述生成商城布局。
    优先使用 LLM，失败时自动降级到规则生成器。
    """
    try:
        logger.info(f"Generating mall from description: {request.description}")

        from app.services.mall_generation_service import MallGenerationService

        service = MallGenerationService()
        layout, method = await service.generate(request.description)

        logger.info(
            f"Mall generated: {layout.name}, "
            f"{len(layout.floors)} floors, method={method}"
        )

        return GenerateMallResponse(
            success=True,
            message=f"成功生成商城布局：{layout.name}，共 {len(layout.floors)} 层",
            data=layout,
            parseInfo={
                "generationMethod": method,
                "floorCount": len(layout.floors),
            },
        )

    except Exception as e:
        logger.error(f"Failed to generate mall: {e}")
        return GenerateMallResponse(
            success=False,
            message=f"生成失败：{str(e)}",
            data=None,
            parseInfo={"generationMethod": "error"},
        )


@router.get("/mall/generate/help")
async def get_generation_help():
    """获取商城生成帮助信息（从 YAML 配置读取）"""
    return get_help_content()
