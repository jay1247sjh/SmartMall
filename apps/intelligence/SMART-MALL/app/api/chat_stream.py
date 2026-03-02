"""
SSE 流式输出端点

新增 /api/chat/stream SSE 端点，使用 AsyncIteratorCallbackHandler 逐 token 推送。
与现有 /api/chat 非流式端点并存。
流式输出过程中发生错误时发送 SSE 错误事件并关闭连接。

Requirements: 18.2, 18.3, 18.4
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any, List

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from langchain_classic.callbacks import AsyncIteratorCallbackHandler
from pydantic import BaseModel

from app.core.agent.agent import SmartMallAgentFactory, is_unsafe_input, SAFE_RESPONSE
from app.core.agent.runtime_context import set_agent_context, reset_agent_context
from app.core.config import get_settings
from app.core.memory.manager import MemoryManager
from app.core.rag.orchestrator import RAGOrchestrator

router = APIRouter()
logger = logging.getLogger(__name__)


class StreamChatRequest(BaseModel):
    """流式对话请求"""
    request_id: str
    user_id: str
    message: str
    image_url: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


def _sse_event(data: dict) -> str:
    """格式化 SSE 事件"""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_tool_results(intermediate_steps: list) -> List[Dict[str, Any]]:
    """从 AgentExecutor 的 intermediate_steps 提取工具调用结果。"""
    if not intermediate_steps:
        return []
    results: List[Dict[str, Any]] = []
    for action, observation in intermediate_steps:
        tool_result = observation if isinstance(observation, dict) else {"result": str(observation)}
        args = (
            action.tool_input
            if isinstance(action.tool_input, dict)
            else {"input": str(action.tool_input)}
        )
        results.append(
            {
                "function": action.tool,
                "args": args,
                "result": tool_result,
            }
        )
    return results


def _detect_confirmation(tool_results: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """检测工具结果中是否有需要确认的操作。"""
    for item in tool_results:
        result = item.get("result")
        if isinstance(result, dict) and result.get("type") == "confirmation_required":
            return item
    return None


@router.post("/chat/stream")
async def chat_stream(request: StreamChatRequest):
    """SSE 流式输出端点

    逐 token 推送 LLM 生成内容，格式：
    - data: {"token": "..."} — 每个 token
    - data: {"done": true}   — 完成
    - data: {"error": "..."}  — 错误
    """
    # 安全输入检查
    if is_unsafe_input(request.message):
        async def safe_gen():
            yield _sse_event({"token": SAFE_RESPONSE})
            yield _sse_event({"done": True})
        return StreamingResponse(safe_gen(), media_type="text/event-stream")

    callback = AsyncIteratorCallbackHandler()

    async def event_generator():
        tokens = None
        try:
            settings = get_settings()
            memory = MemoryManager(user_id=request.user_id)
            rag_data = await RAGOrchestrator.augment(request.message, request.context)
            prompt_context = await memory.build_prompt_context(
                request.message,
                rag_context=rag_data.get("rag_context") or None,
            )
            short_count = len(await memory.get_short_term_messages())
            chat_history = [
                msg for msg in prompt_context[1:-1]
                if msg.get("role") != "system"
            ]
            system_message = prompt_context[0]["content"] if prompt_context else ""
            agent = SmartMallAgentFactory.create(streaming=True)

            tokens = set_agent_context(
                user_id=request.user_id,
                user_role=(request.context or {}).get("user_role", "USER"),
            )

            task = asyncio.create_task(
                agent.ainvoke(
                    {
                        "input": request.message,
                        "system_message": system_message,
                        "chat_history": chat_history,
                    },
                    config={"callbacks": [callback]},
                )
            )

            async for token in callback.aiter():
                yield _sse_event({"token": token})

            result = await task
            if tokens is not None:
                reset_agent_context(tokens)
                tokens = None
            output = str(result.get("output", "")).strip()
            tool_results = _extract_tool_results(result.get("intermediate_steps", []))
            confirmation = _detect_confirmation(tool_results)
            evidence = rag_data.get("evidence", []) if settings.AGENT_ENABLE_CITATIONS else []

            if confirmation:
                logger.info(
                    json.dumps(
                        {
                            "event": "stream_confirmation_required",
                            "request_id": request.request_id,
                            "user_id": request.user_id,
                            "rag_used": bool(rag_data.get("rag_used")),
                            "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                            "memory_short_count": short_count,
                        },
                        ensure_ascii=False,
                    )
                )
                yield _sse_event(
                    {
                        "confirmation_required": {
                            "action": confirmation.get("function"),
                            "args": confirmation.get("result", {}).get("args", {}),
                            "message": confirmation.get("result", {}).get("message", "此操作需要确认"),
                        }
                    }
                )
                if tool_results:
                    yield _sse_event({"tool_results": tool_results})
                yield _sse_event(
                    {
                        "meta": {
                            "rag_used": bool(rag_data.get("rag_used")),
                            "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                            "evidence": evidence,
                        }
                    }
                )
                yield _sse_event({"done": True})
                return

            if output:
                await memory.save_turn(request.message, output)
            if tool_results:
                yield _sse_event({"tool_results": tool_results})
            yield _sse_event(
                {
                    "meta": {
                        "rag_used": bool(rag_data.get("rag_used")),
                        "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                        "evidence": evidence,
                    }
                }
            )
            yield _sse_event({"done": True})
            logger.info(
                json.dumps(
                    {
                        "event": "stream_chat_completed",
                        "request_id": request.request_id,
                        "user_id": request.user_id,
                        "rag_used": bool(rag_data.get("rag_used")),
                        "retrieval_strategy": rag_data.get("retrieval_strategy", "none"),
                        "memory_short_count": short_count,
                    },
                    ensure_ascii=False,
                )
            )

        except Exception as e:
            try:
                if tokens is not None:
                    reset_agent_context(tokens)
            except Exception:
                pass
            logger.error(json.dumps({
                "event": "stream_error",
                "request_id": request.request_id,
                "reason": str(e),
            }, ensure_ascii=False))
            yield _sse_event({"error": "AI 服务暂时不可用，请稍后再试"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

