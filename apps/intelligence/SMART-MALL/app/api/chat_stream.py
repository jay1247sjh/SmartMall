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
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_classic.callbacks import AsyncIteratorCallbackHandler
from pydantic import BaseModel

from app.core.agent.agent import SmartMallAgentFactory, is_unsafe_input, SAFE_RESPONSE
from app.core.prompt_loader import PromptLoader

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
        try:
            agent = SmartMallAgentFactory.create(streaming=True)

            task = asyncio.create_task(
                agent.ainvoke(
                    {
                        "input": request.message,
                        "system_message": PromptLoader.get_system_prompt("system"),
                        "chat_history": [],
                    },
                    config={"callbacks": [callback]},
                )
            )

            async for token in callback.aiter():
                yield _sse_event({"token": token})

            await task
            yield _sse_event({"done": True})

        except Exception as e:
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
