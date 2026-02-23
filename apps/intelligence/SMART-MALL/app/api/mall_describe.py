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
    max: int = 50


class DescribeMallResponse(BaseModel):
    """描述商城响应"""
    reply: str
    description: str
    isComplete: bool
    roundInfo: RoundInfo


# ============ 系统提示词 ============

SYSTEM_PROMPT = """You are a professional mall planning consultant. Your job is to guide the user through a structured conversation to gather information about their mall, then generate a comprehensive mall description.

## Your Behavior

1. **Ask structured questions** about the following topics (one or two at a time):
   - Mall name and overall size/scale
   - Number of floors and floor themes
   - Business types per floor (retail, food, entertainment, etc.)
   - Specific brands or stores the user wants
   - Facilities: elevators, escalators, restrooms, entrances, parking
   - Any special features or requirements

2. **Language detection**: Detect the language the user is writing in and ALWAYS respond in the SAME language. If the user writes in Chinese, respond in Chinese. If in English, respond in English. Match the user's language exactly.

3. **Progressive description building**: After each round, update the mall description with all information gathered so far. The description should become more detailed as the conversation progresses.

4. **Context summarization**: Periodically summarize the information you've gathered to keep the conversation focused and avoid redundancy. This helps maintain coherence across many rounds.

5. **Completion**: When you have gathered enough information OR the user indicates they want to finish, set isComplete to true and provide a final comprehensive summary.

## Output Format

You MUST always respond with a valid JSON object containing exactly these fields:
```json
{
  "reply": "Your conversational response to the user (question, summary, etc.)",
  "description": "The current accumulated mall description based on all information gathered so far",
  "isComplete": false
}
```

- `reply`: Your message to the user — ask questions, acknowledge info, or provide summaries
- `description`: The full mall description updated with any new information from this round. If no new info, keep the previous description unchanged.
- `isComplete`: Set to `true` only when the conversation should end (enough info gathered or user wants to finish)

IMPORTANT: Return ONLY the JSON object, no markdown code fences, no extra text."""


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
    1. System prompt
    2. 当前描述上下文（如果非空）
    3. 对话历史
    4. 控制消息（finish / warning）
    """
    messages = []

    # 1. System prompt
    messages.append(SystemMessage(content=SYSTEM_PROMPT))

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
        messages.append(HumanMessage(
            content=(
                "The user wants to finish the conversation now. "
                "Please provide a final comprehensive summary and a complete mall description. "
                "Set isComplete to true in your response."
            )
        ))

    if current_round >= 45:
        messages.append(HumanMessage(
            content=(
                f"Warning: This is round {current_round} out of 50. "
                "The conversation is approaching its limit. "
                "Please warn the user about the approaching limit and try to wrap up "
                "the description with the information gathered so far."
            )
        ))

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

        logger.info(f"Mall describe request: round={current_round}, "
                     f"messages={len(request.messages)}, finish={request.finish}")

        # 超过轮次限制，直接返回完成
        if current_round > 50:
            return DescribeMallResponse(
                reply="对话已达到最大轮次限制。以下是根据已收集信息生成的商城描述。",
                description=request.currentDescription,
                isComplete=True,
                roundInfo=RoundInfo(current=50, max=50),
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
            roundInfo=RoundInfo(current=current_round, max=50),
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
                max=50,
            ),
        )
