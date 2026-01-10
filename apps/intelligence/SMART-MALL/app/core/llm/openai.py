"""
OpenAI LLM 提供商

支持 GPT-4, GPT-3.5 等模型
"""

from typing import List
from app.core.llm.base import LLMBase, Message, CompletionResult
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMBase):
    """OpenAI LLM 提供商"""
    
    def __init__(self, api_key: str = None, model: str = None, base_url: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.base_url = base_url or settings.OPENAI_BASE_URL
        self._client = None
    
    def _get_client(self):
        """获取 OpenAI 客户端（延迟初始化）"""
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            except ImportError:
                raise ImportError("Please install openai: pip install openai")
        return self._client
    
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
        client = self._get_client()
        
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": m.role, "content": m.content} for m in messages],
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        choice = response.choices[0]
        return CompletionResult(
            content=choice.message.content,
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            finish_reason=choice.finish_reason
        )
    
    def get_model_name(self) -> str:
        return self.model
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            client = self._get_client()
            # 简单的模型列表请求
            await client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
