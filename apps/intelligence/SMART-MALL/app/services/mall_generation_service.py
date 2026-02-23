"""
商城布局 LLM 生成服务

通过 LangChain LCEL Chain 生成符合 MallLayoutData Schema 的商城布局数据。
LLM 完全自主决定布局，后端只做格式校验和重叠检测。
LLM 失败时自动降级到现有规则生成器。
"""

import logging
from typing import List, Tuple

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm_provider import get_llm
from app.core.llm_utils import extract_json, is_llm_available
from app.core.prompt_loader import PromptLoader
from app.api.mall_generator import MallLayoutData, AreaData, rule_based_generate

logger = logging.getLogger(__name__)


# ============================================================
# 几何工具 — 重叠检测（SAT 分离轴定理简化版：AABB）
# ============================================================

def _get_aabb(area: AreaData) -> Tuple[float, float, float, float]:
    """获取区域的轴对齐包围盒 (min_x, min_y, max_x, max_y)"""
    xs = [v.x for v in area.shape.vertices]
    ys = [v.y for v in area.shape.vertices]
    return min(xs), min(ys), max(xs), max(ys)


def _aabb_overlap(a: Tuple[float, float, float, float],
                  b: Tuple[float, float, float, float],
                  tolerance: float = 0.1) -> bool:
    """检查两个 AABB 是否重叠（允许 tolerance 的边缘接触）"""
    return (a[0] < b[2] - tolerance and a[2] > b[0] + tolerance and
            a[1] < b[3] - tolerance and a[3] > b[1] + tolerance)


def check_floor_overlaps(areas: List[AreaData]) -> List[str]:
    """
    检查同一楼层内区域是否重叠。
    返回重叠描述列表，空列表表示无重叠。
    """
    overlaps = []
    for i in range(len(areas)):
        for j in range(i + 1, len(areas)):
            if _aabb_overlap(_get_aabb(areas[i]), _get_aabb(areas[j])):
                overlaps.append(f"'{areas[i].name}' 与 '{areas[j].name}' 重叠")
    return overlaps


class MallGenerationService:
    """商城布局 LLM 生成服务"""

    PROMPT_NAME = "mall_generation"

    async def generate(self, description: str) -> Tuple[MallLayoutData, str]:
        """
        生成商城布局。优先使用 LLM，失败时降级到规则生成器。

        Returns:
            (layout_data, generation_method)  method: "llm" | "rule_based"
        """
        if is_llm_available():
            try:
                layout = await self._generate_with_llm(description)
                return layout, "llm"
            except Exception as e:
                logger.warning(f"LLM generation failed, falling back to rule-based: {e}")

        # 降级到规则生成器
        return self._fallback_generate(description), "rule_based"

    async def _generate_with_llm(self, description: str) -> MallLayoutData:
        """通过 LangChain LCEL Chain 生成布局"""
        # 加载 Prompt
        system_prompt = PromptLoader.get_system_prompt(self.PROMPT_NAME)
        user_prompt = PromptLoader.format_user_prompt(
            self.PROMPT_NAME, description=description
        )
        params = PromptLoader.get_parameters(self.PROMPT_NAME)

        # 构造 LCEL Chain，使用 prompt YAML 中的参数覆盖默认值
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{user_input}"),
        ])
        llm = get_llm()
        if params:
            llm = llm.bind(
                temperature=params.get("temperature"),
                max_tokens=params.get("max_tokens"),
                top_p=params.get("top_p"),
            )
        chain = prompt | llm | StrOutputParser()

        # 调用 Chain
        result = await chain.ainvoke({"user_input": user_prompt})

        # 提取并校验 JSON（格式校验）
        raw_json = extract_json(result)
        layout = MallLayoutData.model_validate(raw_json)

        # 重叠检测
        for floor in layout.floors:
            overlaps = check_floor_overlaps(floor.areas)
            if overlaps:
                overlap_detail = "; ".join(overlaps)
                logger.warning(f"Floor {floor.name} has overlapping areas: {overlap_detail}")
                raise ValueError(f"楼层 {floor.name} 存在区域重叠: {overlap_detail}")

        logger.info(
            f"LLM generated mall layout: {layout.name}, "
            f"{len(layout.floors)} floors"
        )
        return layout

    def _fallback_generate(self, description: str) -> MallLayoutData:
        """降级到规则生成器（单一入口）"""
        return rule_based_generate(description)
