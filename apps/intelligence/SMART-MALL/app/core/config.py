"""
配置管理模块

支持从环境变量加载配置，便于不同环境部署
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 基础配置
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # 服务配置
    SERVICE_NAME: str = "smart-mall-intelligence"
    SERVICE_TOKEN: str = ""  # 服务间认证令牌
    
    # CORS 配置
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # LLM 配置
    LLM_PROVIDER: str = "qwen"  # qwen / openai / deepseek / local
    
    # 阿里云百炼 Qwen 配置（推荐）
    QWEN_API_KEY: str = ""
    QWEN_MODEL: str = "qwen3-vl-plus"  # 支持视觉+Function Calling
    QWEN_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    QWEN_VISION_MODEL: str = "qwen3-vl-plus"  # 视觉模型
    QWEN_TEXT_MODEL: str = "qwen-plus"  # 纯文本模型
    
    # OpenAI 配置
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    
    # DeepSeek 配置
    DEEPSEEK_API_KEY: str = ""
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    
    # 本地模型配置 (Ollama)
    LOCAL_MODEL_URL: str = "http://localhost:11434"
    LOCAL_MODEL_NAME: str = "llama2"
    
    # LLM 参数
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 2000
    LLM_TIMEOUT: int = 30
    
    # 向量数据库配置
    VECTOR_DB_TYPE: str = "milvus"  # milvus / qdrant
    VECTOR_DB_URL: str = "http://localhost:19530"
    VECTOR_DB_API_KEY: str = ""
    
    # Embedding 配置
    EMBEDDING_MODEL: str = "text-embedding-ada-002"
    EMBEDDING_DIMENSION: int = 1536
    
    # RAG 配置
    RAG_TOP_K: int = 5
    RAG_SCORE_THRESHOLD: float = 0.7
    
    # 缓存配置
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 分钟
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
