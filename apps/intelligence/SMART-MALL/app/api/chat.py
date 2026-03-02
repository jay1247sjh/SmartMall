"""
智能对话接口

支持：
- 纯文本对话（通过 LangChain AgentExecutor）
- 图片+文字对话（视觉理解，通过 get_vision_llm）
- Function Calling（通过 @tool 工具集）

重构后使用 SmartMallAgentFactory + MemoryManager 替代旧 MallAgent，
保持响应结构不变（request_id, type, content, action, args, message,
tool_results, model, tokens_used, timestamp）。

Requirements: 18.5
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import json
import logging

from app.core.agent.agent import (
    SmartMallAgentFactory,
    is_unsafe_input,
    process_with_vision,
    SAFE_RESPONSE,
)
from app.core.memory.manager import MemoryManager
from app.core.rag.orchestrator import RAGOrchestrator
from app.core.agent.runtime_context import set_agent_context, reset_agent_context
from app.core.errors import parse_llm_error
from app.core.config import get_settings
from app.core.prompt_loader import PromptLoader

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ 请求/响应模型（保持不变） ============

class ChatRequest(BaseModel):
    """对话请求"""
    request_id: str
    user_id: str
    message: str
    image_url: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ToolResult(BaseModel):
    """工具调用结果"""
    function: str
    args: Dict[str, Any]
    result: Dict[str, Any]


class EvidenceItem(BaseModel):
    """RAG 证据项"""
    id: str
    source_type: str
    source_collection: str
    score: float
    snippet: str


class ChatResponse(BaseModel):
    """对话响应"""
    request_id: str
    type: str  # text / confirmation_required / confirm / error
    content: Optional[str] = None
    action: Optional[str] = None
    args: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    tool_results: Optional[List[ToolResult]] = None
    rag_used: Optional[bool] = None
    retrieval_strategy: Optional[str] = None
    evidence: Optional[List[EvidenceItem]] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    timestamp: str


# ============ 辅助函数 ============

def _extract_tool_results(intermediate_steps: list) -> Optional[List[ToolResult]]:
    """从 AgentExecutor 的 intermediate_steps 提取工具调用结果"""
    if not intermediate_steps:
        return None
    results = []
    for action, observation in intermediate_steps:
        tool_result = observation if isinstance(observation, dict) else {"result": str(observation)}
        args = action.tool_input if isinstance(action.tool_input, dict) else {"input": str(action.tool_input)}
        results.append(ToolResult(
            function=action.tool,
            args=args,
            result=tool_result,
        ))
    return results or None


def _detect_confirmation(tool_results: Optional[List[ToolResult]]) -> Optional[ToolResult]:
    """检测工具结果中是否有需要确认的操作"""
    if not tool_results:
        return None
    for tr in tool_results:
        if isinstance(tr.result, dict) and tr.result.get("type") == "confirmation_required":
            return tr
    return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


# ============ 接口实现 ============

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """智能对话接口

    使用 SmartMallAgentFactory + MemoryManager。
    保持响应结构与旧版完全一致。
    """
    try:
        logger.info(f"[{request.request_id}] Chat: {request.message[:50]}...")

        # 安全输入检查
        if is_unsafe_input(request.message):
            return ChatResponse(
                request_id=request.request_id,
                type="text",
                content=SAFE_RESPONSE,
                timestamp=_now_iso(),
            )

        # 图片+文字 → 视觉模型
        if request.image_url:
            vision_result = await process_with_vision(request.message, request.image_url)
            return ChatResponse(
                request_id=request.request_id,
                type="text",
                content=vision_result,
                timestamp=_now_iso(),
            )

        # 构建记忆上下文
        memory = MemoryManager(user_id=request.user_id)
        rag_data = await RAGOrchestrator.augment(request.message, request.context)
        prompt_context = await memory.build_prompt_context(
            request.message,
            rag_context=rag_data.get("rag_context") or None,
        )
        short_count = len(await memory.get_short_term_messages())

        # 提取 chat_history（system prompt 之后、当前输入之前的消息）
        chat_history = []
        for msg in prompt_context[1:-1]:  # 跳过第一条 system 和最后一条 user
            if msg["role"] != "system":
                chat_history.append(msg)

        system_message = prompt_context[0]["content"] if prompt_context else ""

        # 调用 AgentExecutor
        settings = get_settings()
        agent = SmartMallAgentFactory.create(streaming=False)
        tokens = set_agent_context(
            user_id=request.user_id,
            user_role=(request.context or {}).get("user_role", "USER"),
        )
        try:
            result = await agent.ainvoke({
                "input": request.message,
                "system_message": system_message,
                "chat_history": chat_history,
            })
        finally:
            reset_agent_context(tokens)

        output = result.get("output", "")
        steps = result.get("intermediate_steps", [])
        tool_results = _extract_tool_results(steps)
        evidence_items = (
            [EvidenceItem(**item) for item in rag_data.get("evidence", [])]
            if settings.AGENT_ENABLE_CITATIONS
            else []
        )

        # 检测确认请求
        confirmation = _detect_confirmation(tool_results)
        if confirmation:
            logger.info(json.dumps({
                "event": "chat_confirmation_required",
                "request_id": request.request_id,
                "user_id": request.user_id,
                "rag_used": bool(rag_data.get("rag_used")),
                "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                "memory_short_count": short_count,
            }, ensure_ascii=False))
            return ChatResponse(
                request_id=request.request_id,
                type="confirmation_required",
                action=confirmation.function,
                args=confirmation.result.get("args", {}),
                message=confirmation.result.get("message", "此操作需要确认"),
                tool_results=tool_results,
                rag_used=bool(rag_data.get("rag_used")),
                retrieval_strategy=rag_data.get("retrieval_strategy", "none"),
                evidence=evidence_items,
                model=settings.OPENROUTER_MODEL,
                timestamp=_now_iso(),
            )

        # 保存对话到记忆
        await memory.save_turn(request.message, output)

        logger.info(json.dumps({
            "event": "chat_completed",
            "request_id": request.request_id,
            "user_id": request.user_id,
            "rag_used": bool(rag_data.get("rag_used")),
            "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
            "memory_short_count": short_count,
        }, ensure_ascii=False))

        return ChatResponse(
            request_id=request.request_id,
            type="text",
            content=output,
            tool_results=tool_results,
            rag_used=bool(rag_data.get("rag_used")),
            retrieval_strategy=rag_data.get("retrieval_strategy", "none"),
            evidence=evidence_items,
            model=settings.OPENROUTER_MODEL,
            timestamp=_now_iso(),
        )

    except Exception as e:
        logger.error(f"[{request.request_id}] Error: {str(e)}")
        status_code, error_type, user_message = parse_llm_error(e)
        return ChatResponse(
            request_id=request.request_id,
            type="error",
            content=user_message,
            message=error_type,
            rag_used=False,
            retrieval_strategy="error",
            timestamp=_now_iso(),
        )


class ConfirmRequest(BaseModel):
    """确认请求"""
    request_id: str
    user_id: str
    action: str
    args: Dict[str, Any]
    confirmed: bool


@router.post("/chat/confirm", response_model=ChatResponse)
async def confirm_action(request: ConfirmRequest) -> ChatResponse:
    """确认操作接口

    当 chat 接口返回 type=confirmation_required 时，
    前端调用此接口确认或取消操作。
    """
    try:
        logger.info(f"[{request.request_id}] Confirm: {request.action}, confirmed={request.confirmed}")

        if not request.confirmed:
            cancelled_msg = PromptLoader.get_config_value(
                "chat_messages", "confirm", "cancelled",
                default="好的，已取消操作。还有什么可以帮您的吗？"
            )
            return ChatResponse(
                request_id=request.request_id,
                type="text",
                content=cancelled_msg,
                rag_used=False,
                retrieval_strategy="confirm_cancel",
                timestamp=_now_iso(),
            )

        # 直接调用对应的 LangChain tool
        from app.core.agent.tools_langchain import ALL_TOOLS
        target_tool = next((t for t in ALL_TOOLS if t.name == request.action), None)
        if not target_tool:
            unknown_msg = PromptLoader.get_config_value(
                "chat_messages", "confirm", "unknown_action",
                default="未知操作: {action}"
            ).format(action=request.action)
            return ChatResponse(
                request_id=request.request_id,
                type="error",
                content=unknown_msg,
                rag_used=False,
                retrieval_strategy="confirm_unknown_action",
                timestamp=_now_iso(),
            )

        tokens = set_agent_context(
            user_id=request.user_id,
            user_role="USER",
        )
        try:
            result = await target_tool.ainvoke(request.args)
        finally:
            reset_agent_context(tokens)
        result_dict = result if isinstance(result, dict) else {"result": str(result)}

        # 从 YAML 加载 action 成功消息
        action_messages = PromptLoader.get_config_value(
            "chat_messages", "confirm", "action_success", default={}
        )
        if request.action in action_messages:
            content = action_messages[request.action].format(
                message=result_dict.get("message", "")
            )
        else:
            content = result_dict.get(
                "message",
                action_messages.get("default", "操作成功"),
            )

        return ChatResponse(
            request_id=request.request_id,
            type="text",
            content=content,
            tool_results=[ToolResult(
                function=request.action,
                args=request.args,
                result=result_dict,
            )],
            rag_used=False,
            retrieval_strategy="confirm_execute",
            timestamp=_now_iso(),
        )

    except Exception as e:
        logger.error(f"[{request.request_id}] Confirm error: {str(e)}")
        status_code, error_type, user_message = parse_llm_error(e)
        return ChatResponse(
            request_id=request.request_id,
            type="error",
            content=user_message,
            message=error_type,
            rag_used=False,
            retrieval_strategy="confirm_error",
            timestamp=_now_iso(),
        )

