"""
LLM 工厂

支持多种模型提供商的动态切换
"""

from typing import Dict, Type
from app.core.llm.base import LLMBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class LLMFactory:
    """
    LLM 工厂
    
    支持：
    - OpenAI (GPT-4, GPT-3.5)
    - DeepSeek
    - 本地模型 (Ollama)
    """
    
    _providers: Dict[str, Type[LLMBase]] = {}
    _instances: Dict[str, LLMBase] = {}
    
    @classmethod
    def register(cls, name: str, provider: Type[LLMBase]):
        """注册 LLM 提供商"""
        cls._providers[name] = provider
        logger.info(f"Registered LLM provider: {name}")
    
    @classmethod
    def create(cls, provider: str = None, **kwargs) -> LLMBase:
        """
        创建 LLM 实例
        
        Args:
            provider: 提供商名称，默认使用配置
            **kwargs: 额外参数
            
        Returns:
            LLM 实例
        """
        provider = provider or settings.LLM_PROVIDER
        
        # 单例模式
        cache_key = f"{provider}_{hash(frozenset(kwargs.items()))}"
        if cache_key in cls._instances:
            return cls._instances[cache_key]
        
        if provider not in cls._providers:
            raise ValueError(f"Unknown LLM provider: {provider}. Available: {list(cls._providers.keys())}")
        
        instance = cls._providers[provider](**kwargs)
        cls._instances[cache_key] = instance
        
        logger.info(f"Created LLM instance: {provider}")
        return instance
    
    @classmethod
    def get_available_providers(cls) -> list:
        """获取可用的提供商列表"""
        return list(cls._providers.keys())


# 延迟导入，避免循环依赖
def _register_providers():
    """注册所有提供商"""
    try:
        from app.core.llm.qwen import QwenProvider
        LLMFactory.register("qwen", QwenProvider)
    except ImportError:
        logger.warning("Qwen provider not available")
    
    try:
        from app.core.llm.openai import OpenAIProvider
        LLMFactory.register("openai", OpenAIProvider)
    except ImportError:
        logger.warning("OpenAI provider not available")
    
    try:
        from app.core.llm.deepseek import DeepSeekProvider
        LLMFactory.register("deepseek", DeepSeekProvider)
    except ImportError:
        logger.warning("DeepSeek provider not available")
    
    try:
        from app.core.llm.local import LocalModelProvider
        LLMFactory.register("local", LocalModelProvider)
    except ImportError:
        logger.warning("Local model provider not available")


# 模块加载时注册提供商
_register_providers()
