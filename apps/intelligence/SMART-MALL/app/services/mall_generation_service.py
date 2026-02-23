"""
商城布局 LLM 生成服务

通过 LangChain LCEL Chain 生成符合 MallLayoutData Schema 的商城布局数据。
LLM 失败时自动降级到现有规则生成器。
"""

import json
import re
import logging
from typing import Tuple

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.config import settings
from app.core.llm_provider import get_llm
from app.core.prompt_loader import PromptLoader
from app.api.mall_generator import MallLayoutData, rule_based_generate

logger = logging.getLogger(__name__)


class MallGenerationService:
    """商城布局 LLM 生成服务"""

    PROMPT_NAME = "mall_generation"

    async def generate(self, description: str) -> Tuple[MallLayoutData, str]:
        """
        生成商城布局。优先使用 LLM，失败时降级到规则生成器。

        Returns:
            (layout_data, generation_method)  method: "llm" | "rule_based"
        """
        if self._is_llm_available():
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
        layout = MallLayoutData.model_validate(raw_json)

        logger.info(
            f"LLM generated mall layout: {layout.name}, "
            f"{len(layout.floors)} floors"
        )
        return layout

    def _extract_json(self, content: str) -> dict:
        """
        从 LLM 响应中提取 JSON。
        处理裸 JSON、markdown 代码块、前后带文本等格式。
        """
        text = content.strip()

        # 尝试 1: markdown 代码块 ```json ... ``` 或 ``` ... ```
        code_block = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
        if code_block:
            return json.loads(code_block.group(1).strip())

        # 尝试 2: 直接解析整个文本
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

    def _fallback_generate(self, description: str) -> MallLayoutData:
        """降级到规则生成器（单一入口）"""
        return rule_based_generate(description)
