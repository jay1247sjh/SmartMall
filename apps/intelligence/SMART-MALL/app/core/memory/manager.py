"""Memory Manager：三层记忆协调器（短期记忆持久化版）。

不继承 LangChain BaseMemory，因为 BaseMemory 要求同步接口，
而中期/长期记忆依赖异步 I/O（Redis、PostgreSQL）。
Agent 调用前手动 build_prompt_context()，调用后手动 save_turn()。
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.core.memory.short_term import MemoryMessage, ShortTermMemory
from app.core.memory.mid_term import MidTermMemory
from app.core.memory.long_term import LongTermMemory
from app.core.memory.summarizer import Summarizer
from app.core.memory.short_term_store import ShortTermStore
from app.core.prompt_loader import PromptLoader

logger = logging.getLogger(__name__)


def _get_system_prompt() -> str:
    """从 system.yaml 加载系统提示词"""
    return PromptLoader.get_system_prompt("system")


class MemoryManager:
    """三层记忆管理器，协调短期/中期/长期记忆

    - build_prompt_context(): 组装 Prompt 上下文
    - save_turn(): 保存一轮对话
    - get_status(): 查询记忆状态
    """

    SESSION_ACTIVE_KEY_PREFIX = "smartmall:session:active:"

    class _InProcessShortTermAdapter:
        """AGENT_MEMORY_PERSISTENT_ENABLED 关闭时的进程内短期记忆适配器。"""

        _stores: Dict[str, ShortTermMemory] = {}

        def __init__(self, user_id: str, max_rounds: int):
            if user_id not in self._stores:
                self._stores[user_id] = ShortTermMemory(max_rounds=max_rounds)
            self._memory = self._stores[user_id]

        @property
        def capacity(self) -> int:
            return self._memory.capacity

        async def load_messages(self) -> List[MemoryMessage]:
            return self._memory.get_messages()

        async def append_messages(self, messages: List[MemoryMessage]) -> None:
            for message in messages:
                self._memory.add_message(message)

    def __init__(self, user_id: str):
        from app.core.config import get_settings
        settings = get_settings()

        self.user_id = user_id
        if settings.AGENT_MEMORY_PERSISTENT_ENABLED:
            self.short_term = ShortTermStore(
                user_id=user_id,
                max_rounds=settings.MEMORY_SHORT_TERM_ROUNDS,
                session_timeout_minutes=settings.SESSION_TIMEOUT_MINUTES,
            )
        else:
            self.short_term = self._InProcessShortTermAdapter(
                user_id=user_id,
                max_rounds=settings.MEMORY_SHORT_TERM_ROUNDS,
            )
        self.mid_term = MidTermMemory(user_id=user_id)
        self.long_term = LongTermMemory(user_id=user_id)
        self.summarizer = Summarizer()
        self._max_token_limit = settings.MEMORY_MAX_TOKEN_LIMIT
        self._summary_threshold = settings.MEMORY_SUMMARY_THRESHOLD
        self._session_timeout_minutes = settings.SESSION_TIMEOUT_MINUTES

    async def build_prompt_context(
        self,
        current_input: str,
        rag_context: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """按顺序组装 Prompt 上下文

        顺序：SYSTEM_PROMPT(聚合) → 短期记忆 → 当前输入。
        SYSTEM_PROMPT 聚合内容：基础系统词 + 长期偏好 + 中期摘要 + RAG 上下文。

        返回 List[Dict] 格式：[{"role": "system"|"user"|"assistant", "content": "..."}]
        """
        messages: List[Dict[str, str]] = []

        system_parts: List[str] = [_get_system_prompt()]

        # 长期记忆（用户偏好）
        preferences = await self.long_term.load()
        if preferences:
            pref_text = "用户偏好：" + "，".join(
                f"{k}={v}" for k, v in preferences.items()
            )
            system_parts.append(pref_text)

        # 中期记忆（会话摘要）
        summary = await self.mid_term.load()
        if summary:
            system_parts.append(f"对话摘要：{summary}")

        # RAG 上下文（可选）
        if rag_context:
            system_parts.append(f"检索证据：\n{rag_context}")

        # 聚合系统提示
        messages.append({"role": "system", "content": "\n\n".join(system_parts)})

        # 短期记忆（最近对话）
        short_messages = await self.short_term.load_messages()
        for msg in short_messages:
            messages.append({"role": msg.role, "content": msg.content})

        # Token 截断：仅保留首条 system，删除最早历史消息
        messages = self._truncate_to_limit(messages)

        # 当前输入
        messages.append({"role": "user", "content": current_input})

        return messages

    def _truncate_to_limit(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Token 截断：超限时优先裁剪最早历史消息，保留首条 system。"""
        total_tokens = self._estimate_tokens(messages)
        if total_tokens <= self._max_token_limit:
            return messages

        # 仍然超限：从第一条历史消息开始逐条移除
        result = list(messages)
        while (
            self._estimate_tokens(result) > self._max_token_limit
            and len(result) > 2  # 至少保留 system prompt + 1 条消息
        ):
            result.pop(1)
        return result

    @staticmethod
    def _estimate_tokens(messages: List[Dict[str, str]]) -> int:
        """粗略估算 Token 数（中文约 1.5 字符/token）"""
        total_chars = sum(len(m["content"]) for m in messages)
        return int(total_chars / 1.5)

    async def save_turn(self, user_message: str, assistant_message: str) -> None:
        """保存一轮对话到短期记忆，并更新 session 活跃时间"""
        before = await self.short_term.load_messages()
        pending = [
            MemoryMessage(role="user", content=user_message),
            MemoryMessage(role="assistant", content=assistant_message),
        ]
        await self.short_term.append_messages(pending)

        # 更新 session 最后活跃时间
        try:
            from app.core.redis_pool import RedisPoolFactory
            client = await RedisPoolFactory.get_client()
            await client.set(
                f"{self.SESSION_ACTIVE_KEY_PREFIX}{self.user_id}",
                str(time.time()),
                ex=self._session_timeout_minutes * 60 + 300,
            )
        except Exception as e:
            logger.warning(json.dumps({
                "event": "session_active_update_failed",
                "user_id": self.user_id,
                "reason": str(e),
            }, ensure_ascii=False))

        # 检查是否需要触发摘要
        projected = before + pending
        overflow_count = max(len(projected) - self.short_term.capacity, 0)
        if overflow_count > 0 and len(projected) >= self._summary_threshold * 2:
            overflow = projected[:overflow_count]
            await self.summarizer.maybe_summarize(overflow, self.mid_term)

    async def get_short_term_messages(self) -> List[MemoryMessage]:
        """获取当前短期记忆消息。"""
        return await self.short_term.load_messages()

    async def get_status(self) -> Dict[str, Any]:
        """查询记忆状态"""
        short_msgs = await self.short_term.load_messages()
        return {
            "user_id": self.user_id,
            "short_term_count": len(short_msgs),
            "short_term_capacity": self.short_term.capacity,
            "estimated_tokens": self._estimate_tokens(
                [{"content": m.content} for m in short_msgs]
            ),
        }
