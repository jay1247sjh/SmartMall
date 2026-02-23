"""
店铺布局生成器 API

商家选择主题后，通过 LLM 生成单个区域内的 3D 对象布局
"""

from fastapi import APIRouter
import logging

from app.schemas.store_layout import (
    GenerateStoreLayoutRequest,
    GenerateStoreLayoutResponse,
)
from app.services.store_layout_service import StoreLayoutService, get_theme_presets

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/store/generate-layout", response_model=GenerateStoreLayoutResponse)
async def generate_store_layout(
    request: GenerateStoreLayoutRequest,
) -> GenerateStoreLayoutResponse:
    """
    生成店铺内部布局

    商家选择主题后，AI 根据区域边界和可用材质生成家具/设备布局。
    无降级策略，LLM 失败时返回错误提示。
    """
    try:
        logger.info(
            f"Generating store layout: theme={request.theme}, "
            f"areaId={request.areaId}, "
            f"boundary_points={len(request.areaBoundary)}, "
            f"materials={len(request.availableMaterials)}"
        )

        service = StoreLayoutService()
        response = await service.generate(
            theme=request.theme,
            area_id=request.areaId,
            area_boundary=[v.model_dump() for v in request.areaBoundary],
            available_materials=[m.model_dump() for m in request.availableMaterials],
        )

        if response.success:
            obj_count = len(response.data.objects) if response.data else 0
            logger.info(
                f"Store layout generated: areaId={request.areaId}, "
                f"objects={obj_count}"
            )
        else:
            logger.warning(
                f"Store layout generation failed: areaId={request.areaId}, "
                f"message={response.message}"
            )

        return response

    except Exception as e:
        logger.error(f"Unexpected error in store layout generation: {e}")
        return GenerateStoreLayoutResponse(
            success=False,
            message="AI 生成失败，请稍后重试或手动装修",
        )


@router.get("/store/layout-themes")
async def get_layout_themes():
    """获取可用的店铺布局主题列表"""
    themes = []
    for key, preset in get_theme_presets().items():
        themes.append({
            "id": key,
            "name": preset["name"],
            "description": preset["description"],
            "materials": preset["materials"],
        })
    return {"success": True, "data": themes}
