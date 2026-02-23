"""
商城描述对话 API

通过多轮对话引导用户生成商城描述。
LLM 扮演商城规划顾问，逐步收集楼层、业态、品牌、设施等信息，
最终生成完整的商城描述文本。
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Literal
import logging
import json

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.llm_provider import get_llm
from app.core.errors import parse_llm_error
from app.core.config import get_settings
from app.core.prompt_loader import PromptLoader

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ 请求/响应模型 ============

class DescribeMessage(BaseModel):
    """对话消息"""
    role: Literal["user", "assistant"]
    content: str


class DescribeMallRequest(BaseModel):
    """描述商城请求"""
    messages: List[DescribeMessage] = []
    currentDescription: str = ""
    finish: bool = False


class RoundInfo(BaseModel):
    """轮次信息"""
    current: int
    max: int


class DescribeMallResponse(BaseModel):
    """描述商城响应"""
    reply: str
    description: str
    isComplete: bool
    roundInfo: RoundInfo


# ============ 辅助函数 ============

def _calculate_round(messages: List[DescribeMessage]) -> int:
    """
    从消息历史计算当前轮次。
    
    每轮 = 1条用户消息 + 1条助手消息，+1 表示当前轮。
    空消息列表 = 第1轮（开场问题）。
    """
    return (len(messages) // 2) + 1


def _build_llm_messages(
    request: DescribeMallRequest,
    current_round: int,
) -> list:
    """
    构建发送给 LLM 的消息列表。
    
    结构：
    1. System prompt（从 mall_describe.yaml 加载）
    2. 当前描述上下文（如果非空）
    3. 对话历史
    4. 控制消息（finish / warning）
    """
    settings = get_settings()
    messages = []

    # 1. System prompt
    system_prompt = PromptLoader.get_system_prompt("mall_describe")
    messages.append(SystemMessage(content=system_prompt))

    # 2. 当前描述上下文
    if request.currentDescription.strip():
        messages.append(HumanMessage(
            content=f"Current accumulated description:\n{request.currentDescription}"
        ))

    # 3. 对话历史
    for msg in request.messages:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    # 4. 控制消息
    if request.finish:
        finish_msg = PromptLoader.get_config_value(
            "mall_describe", "messages", "finish_instruction",
            default="Please provide a final comprehensive summary. Set isComplete to true."
        )
        messages.append(HumanMessage(content=finish_msg))

    if current_round >= settings.MALL_DESCRIBE_WARN_THRESHOLD:
        warn_template = PromptLoader.get_config_value(
            "mall_describe", "messages", "round_warning",
            default="Warning: approaching round limit."
        )
        messages.append(HumanMessage(content=warn_template.format(
            current_round=current_round,
            max_rounds=settings.MALL_DESCRIBE_MAX_ROUNDS,
        )))

    return messages


def _parse_llm_response(
    raw_text: str,
    current_description: str,
) -> dict:
    """
    解析 LLM 的 JSON 响应。
    
    成功时返回解析后的 dict。
    失败时使用原始文本作为 reply，保留 currentDescription。
    """
    try:
        # 尝试清理可能的 markdown 代码块包裹
        text = raw_text.strip()
        if text.startswith("```"):
            # 移除开头的 ```json 或 ```
            first_newline = text.index("\n")
            text = text[first_newline + 1:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        parsed = json.loads(text)
        return {
            "reply": parsed.get("reply", raw_text),
            "description": parsed.get("description", current_description),
            "isComplete": parsed.get("isComplete", False),
        }
    except (json.JSONDecodeError, ValueError):
        logger.warning("Failed to parse LLM JSON response, using raw text as reply")
        return {
            "reply": raw_text,
            "description": current_description,
            "isComplete": False,
        }


# ============ API 端点 ============

@router.post("/mall/describe", response_model=DescribeMallResponse)
async def describe_mall(request: DescribeMallRequest) -> DescribeMallResponse:
    """
    多轮对话生成商城描述

    通过与 LLM 的多轮对话，引导用户逐步提供商城信息，
    最终生成完整的商城描述文本。

    - 空消息列表：返回 AI 的开场引导问题
    - 有消息历史：继续对话，返回下一个问题或总结
    - finish=true：结束对话，返回最终描述
    - 超过50轮：自动结束对话
    """
    try:
        current_round = _calculate_round(request.messages)
        settings = get_settings()
        max_rounds = settings.MALL_DESCRIBE_MAX_ROUNDS

        logger.info(f"Mall describe request: round={current_round}, "
                     f"messages={len(request.messages)}, finish={request.finish}")

        # 超过轮次限制，直接返回完成
        if current_round > max_rounds:
            exceeded_msg = PromptLoader.get_config_value(
                "mall_describe", "messages", "max_rounds_exceeded",
                default="对话已达到最大轮次限制。"
            )
            return DescribeMallResponse(
                reply=exceeded_msg,
                description=request.currentDescription,
                isComplete=True,
                roundInfo=RoundInfo(current=max_rounds, max=max_rounds),
            )

        # 构建 LLM 消息
        llm_messages = _build_llm_messages(request, current_round)

        # 调用 LLM
        llm = get_llm()
        response = await llm.ainvoke(llm_messages)
        raw_text = response.content

        # 解析响应
        parsed = _parse_llm_response(raw_text, request.currentDescription)

        # finish=true 时强制 isComplete
        is_complete = parsed["isComplete"] or request.finish

        return DescribeMallResponse(
            reply=parsed["reply"],
            description=parsed["description"],
            isComplete=is_complete,
            roundInfo=RoundInfo(current=current_round, max=max_rounds),
        )

    except Exception as e:
        logger.error(f"Mall describe error: {e}")
        status_code, error_type, message = parse_llm_error(e)

        return DescribeMallResponse(
            reply=message,
            description=request.currentDescription,
            isComplete=False,
            roundInfo=RoundInfo(
                current=_calculate_round(request.messages),
                max=get_settings().MALL_DESCRIBE_MAX_ROUNDS,
            ),
        )
