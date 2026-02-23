"""
LCEL 意图路由：输入 → 意图分类 → 路由到对应处理链

使用 RunnableBranch 实现意图分类与路由：
- chat     → 闲聊/问答链
- search   → 搜索链（商品/店铺）
- navigate → 导航链
- recommend→ 推荐链

意图分类使用 get_llm() + 分类 Prompt。

Requirements: 18.1
"""

import json
import logging
from typing import Any, Dict

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableBranch, RunnableLambda, RunnablePassthrough

from app.core.llm_provider import get_llm

logger = logging.getLogger(__name__)

# 有效意图类型
VALID_INTENTS = {"chat", "search", "navigate", "recommend"}
DEFAULT_INTENT = "chat"

# 意图分类 Prompt
CLASSIFY_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "你是一个意图分类器。根据用户输入，判断其意图类别。\n"
     "只输出以下四个类别之一，不要输出任何其他内容：\n"
     "- chat: 闲聊、问候、一般问答、评价咨询\n"
     "- search: 搜索商品、查找店铺、查询商品信息\n"
     "- navigate: 导航到某个店铺或区域、问路\n"
     "- recommend: 推荐商品、推荐餐厅、求推荐\n"),
    ("human", "{input}"),
])


def _parse_intent(raw: str) -> str:
    """从 LLM 输出中解析意图，容错处理"""
    cleaned = raw.strip().lower()
    for intent in VALID_INTENTS:
        if intent in cleaned:
            return intent
    logger.warning(json.dumps({
        "event": "intent_parse_fallback",
        "raw": raw,
        "fallback": DEFAULT_INTENT,
    }, ensure_ascii=False))
    return DEFAULT_INTENT


async def classify_intent(data: Dict[str, Any]) -> Dict[str, Any]:
    """对用户输入进行意图分类"""
    user_input = data.get("input", "")
    try:
        chain = CLASSIFY_PROMPT | get_llm() | StrOutputParser()
        raw = await chain.ainvoke({"input": user_input})
        intent = _parse_intent(raw)
    except Exception as e:
        logger.error(json.dumps({
            "event": "intent_classify_error",
            "reason": str(e),
        }, ensure_ascii=False))
        intent = DEFAULT_INTENT
    return {**data, "intent": intent}


# ============ 各意图处理链 ============


async def _handle_chat(data: Dict[str, Any]) -> Dict[str, Any]:
    """闲聊/问答链：直接使用 LLM 回复"""
    return {**data, "chain": "chat"}


async def _handle_search(data: Dict[str, Any]) -> Dict[str, Any]:
    """搜索链：路由到搜索工具"""
    return {**data, "chain": "search"}


async def _handle_navigate(data: Dict[str, Any]) -> Dict[str, Any]:
    """导航链：路由到导航工具"""
    return {**data, "chain": "navigate"}


async def _handle_recommend(data: Dict[str, Any]) -> Dict[str, Any]:
    """推荐链：路由到推荐工具"""
    return {**data, "chain": "recommend"}


# ============ LCEL 意图路由链 ============


def create_intent_chain():
    """创建 LCEL 意图路由链

    流程：输入 → 意图分类 → RunnableBranch 路由到对应链

    Returns:
        可调用的 LCEL 链
    """
    return (
        RunnableLambda(classify_intent)
        | RunnableBranch(
            (lambda x: x.get("intent") == "search", RunnableLambda(_handle_search)),
            (lambda x: x.get("intent") == "navigate", RunnableLambda(_handle_navigate)),
            (lambda x: x.get("intent") == "recommend", RunnableLambda(_handle_recommend)),
            RunnableLambda(_handle_chat),  # default
        )
    )


# 模块级便捷方法
def get_intent_chain():
    """获取意图路由链实例"""
    return create_intent_chain()
