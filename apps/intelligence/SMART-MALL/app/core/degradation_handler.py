"""
降级日志回调处理器

通过 LangChain 回调机制记录 LLM 降级事件的结构化 JSON 日志。
附加到 LLM 实例后，当 LLM 调用失败触发 fallback 时自动记录降级信息。

Requirements: 4.4, 4.5, 2.5
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any

from langchain_core.callbacks import BaseCallbackHandler

logger = logging.getLogger(__name__)


class DegradationCallbackHandler(BaseCallbackHandler):
    """LLM 降级事件回调处理器

    继承 LangChain BaseCallbackHandler，在 on_llm_error 中
    记录结构化 JSON 降级日志，包含 event、reason、timestamp、impact。
    """

    def on_llm_error(self, error: BaseException, **kwargs: Any) -> None:
        """LLM 调用失败时记录结构化降级日志"""
        logger.warning(
            json.dumps(
                {
                    "event": "llm_degradation",
                    "reason": str(error),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "impact": "fallback_activated",
                },
                ensure_ascii=False,
            )
        )
