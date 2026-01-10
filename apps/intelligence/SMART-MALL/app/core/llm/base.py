"""
LLM 基类

定义统一的 LLM 接口，支持多种模型提供商
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class Message(BaseModel):
    """聊天消息"""
    role: str  # system / user / assistant
    content: str


class CompletionResult(BaseModel):
    """补全结果"""
    content: str
    model: str
    tokens_used: int
    finish_reason: str


class LLMBase(ABC):
    """
    LLM 基类
    
    所有 LLM 提供商实现此接口，确保可替换性
    """
    
    @abstractmethod
    async def complete(
        self,
        prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 2000,
        **kwargs
    ) -> CompletionResult:
        """
        文本补全
        
        Args:
            prompt: 输入提示
            temperature: 温度参数
            max_tokens: 最大 token 数
            
        Returns:
            补全结果
        """
        pass
    
    @abstractmethod
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
            
        Returns:
            补全结果
        """
        pass
    
    @abstractmethod
    def get_model_name(self) -> str:
        """获取模型名称"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """健康检查"""
        pass
