"""Memory Manager：三层记忆协调器

不继承 LangChain BaseMemory，因为 BaseMemory 要求同步接口，
而中期/长期记忆依赖异步 I/O（Redis、PostgreSQL）。
Agent 调用前手动 build_prompt_context()，调用后手动 save_turn()。

已知限制：短期记忆为纯内存存储，多实例部署时同一用户的请求
可能打到不同实例导致短期记忆不连续。中期记忆（Redis）会兜底
提供跨实例的对话上下文。
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

from app.core.memory.short_term import MemoryMessage, ShortTermMemory
from app.core.memory.mid_term import MidTermMemory
from app.core.memory.long_term import LongTermMemory
from app.core.memory.summarizer import Summarizer
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

    def __init__(self, user_id: str):
        from app.core.config import get_settings
        settings = get_settings()

        self.user_id = user_id
        self.short_term = ShortTermMemory(max_rounds=settings.MEMORY_SHORT_TERM_ROUNDS)
        self.mid_term = MidTermMemory(user_id=user_id)
        self.long_term = LongTermMemory(user_id=user_id)
        self.summarizer = Summarizer()
        self._max_token_limit = settings.MEMORY_MAX_TOKEN_LIMIT
        self._summary_threshold = settings.MEMORY_SUMMARY_THRESHOLD
        self._session_timeout_minutes = settings.SESSION_TIMEOUT_MINUTES

    async def build_prompt_context(self, current_input: str) -> List[Dict[str, str]]:
        """按顺序组装 Prompt 上下文

        顺序：SYSTEM_PROMPT → 长期记忆 → 中期记忆 → 短期记忆 → 当前输入
        超限时优先截断中期记忆，保留短期记忆完整性。

        返回 List[Dict] 格式：[{"role": "system"|"user"|"assistant", "content": "..."}]
        """
        messages: List[Dict[str, str]] = []

        # 1. SYSTEM_PROMPT
        messages.append({"role": "system", "content": _get_system_prompt()})

        # 2. 长期记忆（用户偏好）
        preferences = await self.long_term.load()
        if preferences:
            pref_text = "用户偏好：" + "，".join(
                f"{k}={v}" for k, v in preferences.items()
            )
            messages.append({"role": "system", "content": pref_text})

        # 3. 中期记忆（会话摘要）
        summary = await self.mid_term.load()
        mid_term_idx = len(messages)  # 记录中期记忆位置，用于截断
        if summary:
            messages.append({"role": "system", "content": f"对话摘要：{summary}"})

        # 4. 短期记忆（最近对话）
        short_messages = self.short_term.get_messages()
        for msg in short_messages:
            messages.append({"role": msg.role, "content": msg.content})

        # 5. Token 截断：优先截断中期记忆
        messages = self._truncate_to_limit(messages, mid_term_idx)

        # 6. 当前输入
        messages.append({"role": "user", "content": current_input})

        return messages

    def _truncate_to_limit(
        self, messages: List[Dict[str, str]], mid_term_idx: int
    ) -> List[Dict[str, str]]:
        """Token 截断：超限时优先截断中期记忆"""
        total_tokens = self._estimate_tokens(messages)
        if total_tokens <= self._max_token_limit:
            return messages

        # 尝试移除中期记忆
        if mid_term_idx < len(messages):
            msg = messages[mid_term_idx]
            if msg["content"].startswith("对话摘要："):
                truncated = messages[:mid_term_idx] + messages[mid_term_idx + 1:]
                if self._estimate_tokens(truncated) <= self._max_token_limit:
                    return truncated

        # 仍然超限：从中期记忆位置开始逐条移除 system 消息
        result = list(messages)
        while (
            self._estimate_tokens(result) > self._max_token_limit
            and len(result) > 2  # 至少保留 system prompt + 1 条消息
        ):
            # 找到第一个非 SYSTEM_PROMPT 的 system 消息移除
            removed = False
            for i in range(1, len(result)):
                if result[i]["role"] == "system":
                    result.pop(i)
                    removed = True
                    break
            if not removed:
                break

        return result

    @staticmethod
    def _estimate_tokens(messages: List[Dict[str, str]]) -> int:
        """粗略估算 Token 数（中文约 1.5 字符/token）"""
        total_chars = sum(len(m["content"]) for m in messages)
        return int(total_chars / 1.5)

    async def save_turn(self, user_message: str, assistant_message: str) -> None:
        """保存一轮对话到短期记忆，并更新 session 活跃时间"""
        self.short_term.add_message(MemoryMessage(role="user", content=user_message))
        self.short_term.add_message(
            MemoryMessage(role="assistant", content=assistant_message)
        )

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
        msg_count = self.short_term.message_count
        if msg_count >= self._summary_threshold * 2:
            overflow = self.short_term.get_overflow()
            if overflow:
                await self.summarizer.maybe_summarize(overflow, self.mid_term)

    def get_status(self) -> Dict[str, Any]:
        """查询记忆状态"""
        short_msgs = self.short_term.get_messages()
        return {
            "user_id": self.user_id,
            "short_term_count": len(short_msgs),
            "short_term_capacity": self.short_term.capacity,
            "overflow_count": len(self.short_term._overflow),
            "estimated_tokens": self._estimate_tokens(
                [{"content": m.content} for m in short_msgs]
            ),
        }
