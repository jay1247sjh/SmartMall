"""对话摘要生成器

调用 LLM 将对话历史压缩为结构化摘要。
摘要保留：用户导购意图、已推荐商品、用户偏好、未完成任务。
实现 2 分钟防抖机制，避免频繁调用 LLM。
LLM 调用失败时保留原始消息不压缩，记录错误日志。
"""

import json
import logging
import time
from typing import Dict, List, Optional

from app.core.memory.short_term import MemoryMessage

logger = logging.getLogger(__name__)

SUMMARIZE_PROMPT = (
    "你是一个对话摘要助手。请将以下对话压缩为结构化摘要。\n"
    "必须保留以下信息：\n"
    "1. 用户导购意图（用户想买什么、去哪里）\n"
    "2. 已推荐商品（已经推荐过的商品和店铺）\n"
    "3. 用户偏好（品牌、价格、风格等偏好）\n"
    "4. 未完成任务（用户提出但尚未完成的请求）\n\n"
    "已有摘要：\n{existing}\n\n"
    "新对话内容：\n{messages}\n\n"
    "请输出更新后的结构化摘要，使用中文："
)


class Summarizer:
    """对话摘要生成器

    - maybe_summarize(): 带防抖的摘要触发
    - _do_summarize(): 实际执行 LLM 摘要
    - 失败时保留原始消息不压缩
    """

    DEBOUNCE_SECONDS = 120  # 2 分钟防抖

    def __init__(self):
        self._last_summarize_time: Dict[str, float] = {}

    async def maybe_summarize(
        self, messages: List[MemoryMessage], mid_term
    ) -> bool:
        """带防抖的摘要触发

        Args:
            messages: 需要摘要的消息列表（通常来自 short_term.get_overflow()）
            mid_term: MidTermMemory 实例，用于读取已有摘要和保存新摘要

        Returns:
            True 表示摘要成功执行，False 表示被防抖跳过或执行失败
        """
        if not messages:
            return False

        now = time.time()
        last = self._last_summarize_time.get(mid_term.user_id, 0)
        if now - last < self.DEBOUNCE_SECONDS:
            return False  # 防抖窗口内，跳过

        try:
            existing = await mid_term.load()
            summary = await self._do_summarize(messages, existing)
            await mid_term.save(summary)
            self._last_summarize_time[mid_term.user_id] = now
            return True
        except Exception as e:
            # 摘要失败不影响原始消息，保留短期记忆完整性
            logger.warning(json.dumps({
                "event": "summarize_failed",
                "user_id": mid_term.user_id,
                "reason": str(e),
            }, ensure_ascii=False))
            return False

    async def _do_summarize(
        self, messages: List[MemoryMessage], existing_summary: Optional[str] = None
    ) -> str:
        """调用 LLM 生成摘要"""
        from app.core.llm_provider import get_llm

        llm = get_llm()
        formatted = self._format_messages(messages)
        prompt = SUMMARIZE_PROMPT.format(
            existing=existing_summary or "无",
            messages=formatted,
        )
        result = await llm.ainvoke(prompt)
        content = result.content if hasattr(result, "content") else str(result)
        return content.strip()

    @staticmethod
    def _format_messages(messages: List[MemoryMessage]) -> str:
        """将消息列表格式化为文本"""
        lines = []
        for msg in messages:
            role_label = {"user": "用户", "assistant": "助手", "tool": "工具"}.get(
                msg.role, msg.role
            )
            lines.append(f"{role_label}: {msg.content}")
        return "\n".join(lines)

    def get_last_summarize_time(self, user_id: str) -> float:
        """获取指定用户最后一次摘要时间（用于测试和监控）"""
        return self._last_summarize_time.get(user_id, 0)

    def reset_debounce(self, user_id: str) -> None:
        """重置指定用户的防抖计时器（用于 session 结束时强制摘要）"""
        self._last_summarize_time.pop(user_id, None)
