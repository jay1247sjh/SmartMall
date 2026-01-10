"""
阿里云百炼 Qwen LLM 提供商

支持：
- Qwen3-VL-Plus（视觉+文本，推荐）
- Qwen3-VL-Flash（视觉+文本，快速）
- Qwen-Plus（纯文本）
- Qwen-Max（纯文本，最强）

特性：
- Function Calling
- 视觉理解（图片输入）
- 流式输出
- 联网搜索
"""

from typing import List, Dict, Any, Optional
from app.core.llm.base import LLMBase, Message, CompletionResult
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)


class QwenProvider(LLMBase):
    """
    阿里云百炼 Qwen LLM 提供商
    
    使用 OpenAI 兼容接口调用
    """
    
    # 模型能力映射
    MODEL_CAPABILITIES = {
        "qwen3-vl-plus": {"vision": True, "function_calling": True},
        "qwen3-vl-flash": {"vision": True, "function_calling": True},
        "qwen-vl-plus": {"vision": True, "function_calling": False},
        "qwen-plus": {"vision": False, "function_calling": True},
        "qwen-max": {"vision": False, "function_calling": True},
        "qwen-turbo": {"vision": False, "function_calling": True},
    }
    
    def __init__(
        self,
        api_key: str = None,
        model: str = None,
        base_url: str = None
    ):
        self.api_key = api_key or settings.QWEN_API_KEY
        self.model = model or settings.QWEN_MODEL
        self.base_url = base_url or settings.QWEN_BASE_URL
        self._client = None
        self._async_client = None
    
    def _get_client(self):
        """获取同步客户端"""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            except ImportError:
                raise ImportError("Please install openai: pip install openai")
        return self._client
    
    def _get_async_client(self):
        """获取异步客户端"""
        if self._async_client is None:
            try:
                from openai import AsyncOpenAI
                self._async_client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            except ImportError:
                raise ImportError("Please install openai: pip install openai")
        return self._async_client

    
    def _supports_vision(self) -> bool:
        """检查当前模型是否支持视觉"""
        caps = self.MODEL_CAPABILITIES.get(self.model, {})
        return caps.get("vision", False)
    
    def _supports_function_calling(self) -> bool:
        """检查当前模型是否支持 Function Calling"""
        caps = self.MODEL_CAPABILITIES.get(self.model, {})
        return caps.get("function_calling", False)
    
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
        """
        聊天补全
        
        Args:
            messages: 消息列表
            temperature: 温度参数
            max_tokens: 最大 token 数
            **kwargs: 额外参数
                - tools: Function Calling 工具定义
                - enable_search: 是否启用联网搜索
        """
        client = self._get_async_client()
        
        # 构建消息
        formatted_messages = []
        for m in messages:
            if isinstance(m, Message):
                formatted_messages.append({"role": m.role, "content": m.content})
            elif isinstance(m, dict):
                formatted_messages.append(m)
        
        # 构建请求参数
        request_params = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        # Function Calling
        tools = kwargs.get("tools")
        if tools and self._supports_function_calling():
            request_params["tools"] = tools
        
        # 联网搜索
        if kwargs.get("enable_search"):
            request_params["extra_body"] = {"enable_search": True}
        
        response = await client.chat.completions.create(**request_params)
        
        choice = response.choices[0]
        
        # 处理 Function Calling 响应
        if choice.message.tool_calls:
            return CompletionResult(
                content=json.dumps({
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        }
                        for tc in choice.message.tool_calls
                    ]
                }),
                model=response.model,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                finish_reason="tool_calls"
            )
        
        return CompletionResult(
            content=choice.message.content or "",
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            finish_reason=choice.finish_reason
        )
    
    async def chat_with_vision(
        self,
        text: str,
        image_url: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ) -> CompletionResult:
        """
        视觉理解（图片+文本）
        
        Args:
            text: 用户文本输入
            image_url: 图片 URL
            temperature: 温度参数
            max_tokens: 最大 token 数
        """
        if not self._supports_vision():
            raise ValueError(f"Model {self.model} does not support vision. Use qwen3-vl-plus or qwen3-vl-flash.")
        
        client = self._get_async_client()
        
        response = await client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": image_url}},
                        {"type": "text", "text": text}
                    ]
                }
            ],
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        choice = response.choices[0]
        return CompletionResult(
            content=choice.message.content or "",
            model=response.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            finish_reason=choice.finish_reason
        )
    
    async def chat_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Function Calling
        
        Args:
            messages: 消息列表
            tools: 工具定义列表
            temperature: 温度参数
            max_tokens: 最大 token 数
            
        Returns:
            包含 tool_calls 或 content 的响应
        """
        if not self._supports_function_calling():
            raise ValueError(f"Model {self.model} does not support function calling.")
        
        client = self._get_async_client()
        
        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=tools,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        choice = response.choices[0]
        
        result = {
            "model": response.model,
            "tokens_used": response.usage.total_tokens if response.usage else 0,
            "finish_reason": choice.finish_reason
        }
        
        if choice.message.tool_calls:
            result["tool_calls"] = [
                {
                    "id": tc.id,
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in choice.message.tool_calls
            ]
        else:
            result["content"] = choice.message.content
        
        return result
    
    async def stream_chat(
        self,
        messages: List[Message],
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ):
        """
        流式聊天
        
        Yields:
            每个 chunk 的内容
        """
        client = self._get_async_client()
        
        formatted_messages = []
        for m in messages:
            if isinstance(m, Message):
                formatted_messages.append({"role": m.role, "content": m.content})
            elif isinstance(m, dict):
                formatted_messages.append(m)
        
        stream = await client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            stream_options={"include_usage": True}
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def get_model_name(self) -> str:
        return self.model
    
    async def health_check(self) -> bool:
        """健康检查"""
        try:
            client = self._get_async_client()
            # 简单的测试请求
            response = await client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "hi"}],
                max_tokens=5
            )
            return response.choices[0].message.content is not None
        except Exception as e:
            logger.error(f"Qwen health check failed: {e}")
            return False
