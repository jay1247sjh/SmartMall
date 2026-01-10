"""
本地模型 LLM 提供商

支持 Ollama 等本地部署的模型
"""

from typing import List
from app.core.llm.base import LLMBase, Message, CompletionResult
from app.core.config import settings
import logging
import httpx

logger = logging.getLogger(__name__)


class LocalModelProvider(LLMBase):
    """本地模型 LLM 提供商（Ollama）"""
    
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or settings.LOCAL_MODEL_URL
        self.model = model or settings.LOCAL_MODEL_NAME
    
    async def complete(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ) -> CompletionResult:
        """文本补全"""
        messages = [Message(role="user", content=prompt)]
        return await self.chat(messages, temperature, max_tokens, **kwargs)
    
    async def chat(
        self,
        messages: List[Message],
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ) -> CompletionResult:
        """聊天补全"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    },
                    "stream": False
                },
                timeout=settings.LLM_TIMEOUT
            )
            response.raise_for_status()
            data = response.json()
            
            return CompletionResult(
                content=data.get("message", {}).get("content", ""),
                model=self.model,
                tokens_used=data.get("eval_count", 0),
                finish_reason="stop"
            )
    
    def get_model_name(self) -> str:
        return self.model
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags", timeout=5)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Local model health check failed: {e}")
            return False
