"""
店铺布局 LLM 生成服务

通过 LLM 生成符合 StoreLayoutData Schema 的店铺内部布局数据。
与 MallGenerationService 不同，店铺布局没有规则生成器可降级，
LLM 失败时直接返回错误提示。
"""

import json
import re
import logging
from typing import List, Dict, Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import settings
from app.core.llm_provider import get_llm
from app.core.prompt_loader import PromptLoader
from app.schemas.store_layout import (
    StoreLayoutData,
    StoreObject,
    GenerateStoreLayoutResponse,
)

logger = logging.getLogger(__name__)


# ============================================================
# 主题预设配置（从 YAML 加载）
# ============================================================

def _load_theme_presets() -> Dict[str, Dict[str, Any]]:
    """从 store_themes.yaml 加载主题预设"""
    config = PromptLoader.load("store_themes")
    return config.get("themes", {})


def get_theme_presets() -> Dict[str, Dict[str, Any]]:
    """获取主题预设（供外部模块使用）"""
    return _load_theme_presets()


class StoreLayoutService:
    """店铺布局 LLM 生成服务"""

    PROMPT_NAME = "store_layout"

    async def generate(
        self,
        theme: str,
        area_id: str,
        area_boundary: List[Dict[str, float]],
        available_materials: List[Dict[str, Any]],
    ) -> GenerateStoreLayoutResponse:
        """
        生成店铺布局。无降级策略，LLM 失败时返回错误响应。

        Args:
            theme: 主题标识（如 "japanese_cafe"）或主题名称
            area_id: 区域 ID
            area_boundary: 区域边界顶点 [{x, y}, ...]
            available_materials: 可用材质列表

        Returns:
            GenerateStoreLayoutResponse
        """
        if not self._is_llm_available():
            return GenerateStoreLayoutResponse(
                success=False,
                message="AI 服务未配置，请联系管理员",
            )

        try:
            layout = await self._generate_with_llm(
                theme, area_id, area_boundary, available_materials
            )

            # 边界校验
            out_of_bounds = self._validate_boundary(layout.objects, area_boundary)
            if out_of_bounds:
                names = ", ".join(out_of_bounds)
                return GenerateStoreLayoutResponse(
                    success=False,
                    message=f"以下对象超出区域边界：{names}，建议重试或手动调整",
                )

            return GenerateStoreLayoutResponse(
                success=True,
                message=f"成功生成{self._get_theme_display_name(theme)}布局",
                data=layout,
            )

        except json.JSONDecodeError as e:
            logger.warning(f"LLM returned invalid JSON: {e}")
            return GenerateStoreLayoutResponse(
                success=False,
                message="AI 生成的布局数据格式异常，请重试",
            )
        except ValueError as e:
            logger.warning(f"Layout validation failed: {e}")
            return GenerateStoreLayoutResponse(
                success=False,
                message=f"布局数据校验失败：{e}",
            )
        except TimeoutError:
            logger.warning("LLM call timed out for store layout generation")
            return GenerateStoreLayoutResponse(
                success=False,
                message="AI 服务响应超时，请稍后重试",
            )
        except Exception as e:
            logger.error(f"Unexpected error in store layout generation: {e}")
            return GenerateStoreLayoutResponse(
                success=False,
                message="AI 生成失败，请稍后重试或手动装修",
            )

    async def _generate_with_llm(
        self,
        theme: str,
        area_id: str,
        area_boundary: List[Dict[str, float]],
        available_materials: List[Dict[str, Any]],
    ) -> StoreLayoutData:
        """通过 LangChain LCEL Chain 生成布局"""
        # 获取主题信息
        theme_presets = _load_theme_presets()
        theme_info = theme_presets.get(theme, {})
        theme_name = theme_info.get("name", theme)
        style_hints = theme_info.get("style_hints", "")

        # 加载 Prompt
        system_prompt = PromptLoader.get_system_prompt(self.PROMPT_NAME)
        user_prompt = PromptLoader.format_user_prompt(
            self.PROMPT_NAME,
            theme_name=theme_name,
            style_hints=style_hints,
            area_id=area_id,
            area_boundary=json.dumps(area_boundary, ensure_ascii=False),
            available_materials=json.dumps(available_materials, ensure_ascii=False),
        )

        # 构造 LCEL Chain
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{user_input}"),
        ])
        chain = prompt | get_llm() | StrOutputParser()

        # 调用 Chain
        result = await chain.ainvoke({"user_input": user_prompt})

        # 提取并校验 JSON
        raw_json = self._extract_json(result)
        layout = StoreLayoutData.model_validate(raw_json)

        logger.info(
            f"LLM generated store layout: theme={theme_name}, "
            f"{len(layout.objects)} objects"
        )
        return layout

    # ============================================================
    # 边界校验
    # ============================================================

    def _validate_boundary(
        self, objects: List[StoreObject], boundary: List[Dict[str, float]]
    ) -> List[str]:
        """
        校验所有对象是否在区域边界内。

        Args:
            objects: 对象列表
            boundary: 区域边界顶点 [{x, y}, ...]

        Returns:
            越界对象名称列表（空列表表示全部在边界内）
        """
        out_of_bounds: List[str] = []
        for obj in objects:
            if not self._point_in_polygon(obj.position.x, obj.position.z, boundary):
                out_of_bounds.append(
                    f"{obj.name}({obj.position.x:.1f}, {obj.position.z:.1f})"
                )
        return out_of_bounds

    def _point_in_polygon(
        self, x: float, y: float, polygon: List[Dict[str, float]]
    ) -> bool:
        """
        射线法（Ray Casting）判断点是否在多边形内。

        从目标点向右发射水平射线，统计与多边形边的交点数。
        奇数个交点 → 在内部，偶数个交点 → 在外部。

        Args:
            x: 点的 x 坐标
            y: 点的 y 坐标（对应 3D 空间的 z 轴）
            polygon: 多边形顶点列表 [{x, y}, ...]

        Returns:
            True 表示点在多边形内
        """
        n = len(polygon)
        if n < 3:
            return False

        inside = False
        j = n - 1
        for i in range(n):
            xi, yi = polygon[i]["x"], polygon[i]["y"]
            xj, yj = polygon[j]["x"], polygon[j]["y"]

            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i

        return inside

    # ============================================================
    # 工具方法
    # ============================================================

    def _extract_json(self, content: str) -> dict:
        """
        从 LLM 响应中提取 JSON。
        复用 MallGenerationService 的逻辑。
        """
        text = content.strip()

        # 尝试 1: markdown 代码块
        code_block = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if code_block:
            return json.loads(code_block.group(1).strip())

        # 尝试 2: 直接解析
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 尝试 3: 提取第一个 { ... } 块
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            return json.loads(brace_match.group(0))

        raise ValueError("Failed to extract valid JSON from LLM response")

    def _is_llm_available(self) -> bool:
        """检查 LLM 是否可用（OpenRouter 或 Qwen API Key 已配置）"""
        return bool(
            (settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip())
            or (settings.QWEN_API_KEY and settings.QWEN_API_KEY.strip())
        )

    def _get_theme_display_name(self, theme: str) -> str:
        """获取主题显示名称"""
        presets = _load_theme_presets()
        preset = presets.get(theme)
        return preset["name"] if preset else theme
