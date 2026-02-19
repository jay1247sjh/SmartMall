"""短期记忆：内存中存储最近 N 轮对话

使用 deque(maxlen=max_rounds*2) 实现固定容量的 FIFO 队列。
每轮对话包含 user + assistant 两条消息，因此容量为 max_rounds * 2。
"""

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, List, Literal, Optional


@dataclass
class MemoryMessage:
    """记忆消息，保留角色、内容和时间戳"""
    role: Literal["user", "assistant", "tool"]
    content: str
    timestamp: float = field(default_factory=time.time)


class ShortTermMemory:
    """短期记忆：内存中存储最近 N 轮对话

    - add_message(): 添加消息，超出容量时自动淘汰最早的消息
    - get_messages(): 获取当前所有消息
    - get_overflow(): 获取因容量限制被淘汰的消息（用于摘要生成）
    """

    def __init__(self, max_rounds: int = 10):
        self.max_rounds = max_rounds
        self._capacity = max_rounds * 2
        self._messages: Deque[MemoryMessage] = deque(maxlen=self._capacity)
        self._overflow: List[MemoryMessage] = []

    def add_message(self, message: MemoryMessage) -> None:
        """添加消息到短期记忆

        当消息数达到容量上限时，最早的消息会被自动移出。
        被移出的消息暂存到 _overflow 中，供 Summarizer 使用。
        """
        if len(self._messages) == self._capacity:
            evicted = self._messages[0]
            self._overflow.append(evicted)
        self._messages.append(message)

    def get_messages(self) -> List[MemoryMessage]:
        """获取当前短期记忆中的所有消息"""
        return list(self._messages)

    def get_overflow(self) -> List[MemoryMessage]:
        """获取并清空被淘汰的消息（用于摘要生成）

        调用后 overflow 缓冲区被清空，避免重复摘要。
        """
        overflow = self._overflow.copy()
        self._overflow.clear()
        return overflow

    def clear(self) -> None:
        """清空短期记忆和溢出缓冲区"""
        self._messages.clear()
        self._overflow.clear()

    @property
    def message_count(self) -> int:
        """当前消息数量"""
        return len(self._messages)

    @property
    def capacity(self) -> int:
        """最大消息容量"""
        return self._capacity
