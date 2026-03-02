"""Agent 运行时上下文（基于 contextvars）。"""

from __future__ import annotations

from contextvars import ContextVar, Token
from typing import Optional

_CURRENT_USER_ID: ContextVar[Optional[str]] = ContextVar("smartmall_current_user_id", default=None)
_CURRENT_USER_ROLE: ContextVar[Optional[str]] = ContextVar("smartmall_current_user_role", default=None)


def set_agent_context(user_id: Optional[str], user_role: Optional[str]) -> tuple[Token, Token]:
    t1 = _CURRENT_USER_ID.set(user_id)
    t2 = _CURRENT_USER_ROLE.set(user_role)
    return t1, t2


def reset_agent_context(tokens: tuple[Token, Token]) -> None:
    t1, t2 = tokens
    _CURRENT_USER_ID.reset(t1)
    _CURRENT_USER_ROLE.reset(t2)


def get_current_user_id(default: str = "anonymous") -> str:
    return _CURRENT_USER_ID.get() or default


def get_current_user_role(default: str = "USER") -> str:
    return _CURRENT_USER_ROLE.get() or default
