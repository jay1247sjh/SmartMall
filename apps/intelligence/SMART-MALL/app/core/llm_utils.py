"""
LLM 公共工具函数

提取自 MallGenerationService 和 StoreLayoutService 的共用逻辑。
"""

import json
import re
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def extract_json(content: str) -> dict:
    """
    从 LLM 响应中提取 JSON。
    处理裸 JSON、markdown 代码块、前后带文本等格式。

    Args:
        content: LLM 原始响应文本

    Returns:
        解析后的 dict

    Raises:
        ValueError: 无法提取有效 JSON
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


def is_llm_available() -> bool:
    """
    检查 LLM 是否可用（OpenRouter 或 Qwen API Key 已配置）。
    """
    return bool(
        (settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip())
        or (settings.QWEN_API_KEY and settings.QWEN_API_KEY.strip())
    )
