"""
配置管理模块

支持从环境变量加载配置，便于不同环境部署
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator, ValidationInfo
from typing import List, Optional
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


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
    
    # ============ Milvus 向量数据库配置 ============
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 19530
    MILVUS_USER: str = ""
    MILVUS_PASSWORD: str = ""
    MILVUS_DB_NAME: str = "smartmall"
    # 集合名称
    MILVUS_COLLECTION_STORES: str = "stores"
    MILVUS_COLLECTION_PRODUCTS: str = "products"
    MILVUS_COLLECTION_LOCATIONS: str = "locations"
    
    # ============ Embedding 配置 ============
    EMBEDDING_PROVIDER: str = "qwen"  # qwen / openai / local
    EMBEDDING_MODEL: str = "text-embedding-v3"  # 通用 Embedding 模型配置
    # 通义千问 Embedding（推荐，中文效果好）
    QWEN_EMBEDDING_MODEL: str = "text-embedding-v3"
    # OpenAI Embedding
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    # 本地 Embedding（BGE-M3 / M3E）
    LOCAL_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    # Embedding 维度（根据模型调整）
    EMBEDDING_DIMENSION: int = 1024  # BGE-M3: 1024, text-embedding-v3: 1024
    # 文本分块配置
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    
    # ============ RAG 配置 ============
    RAG_TOP_K: int = 5  # 检索返回数量
    RAG_SCORE_THRESHOLD: float = 0.6  # 相似度阈值
    RAG_RERANK_ENABLED: bool = False  # 是否启用重排序
    RAG_CACHE_ENABLED: bool = True  # 是否启用缓存
    RAG_CACHE_TTL: int = 300  # 缓存过期时间（秒）
    
    # ============ 数据同步配置 ============
    SYNC_BATCH_SIZE: int = 100  # 批量同步大小
    SYNC_INTERVAL_MINUTES: int = 5  # 增量同步间隔（分钟）
    
    # ============ PostgreSQL 配置（数据源） ============
    PG_HOST: str = "localhost"
    PG_PORT: int = 5433
    PG_USER: str = "smartmall"
    PG_PASSWORD: str = "smartmall123"
    PG_DATABASE: str = "smartmall"
    
    # 缓存配置
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 300  # 5 分钟
    
    # 兼容旧配置
    VECTOR_DB_TYPE: str = "milvus"
    VECTOR_DB_URL: str = "http://localhost:19530"
    VECTOR_DB_API_KEY: str = ""
    
    # 配置元信息
    CONFIG_VERSION: str = "1.0.0"
    CONFIG_LOADED_FROM: str = ""  # 记录配置来源
    
    # ============ 字段验证器 ============
    
    @field_validator("MILVUS_PORT", "PG_PORT")
    @classmethod
    def validate_port(cls, v: int, info: ValidationInfo) -> int:
        """验证端口号范围"""
        if not (1 <= v <= 65535):
            raise ValueError(f"{info.field_name} must be between 1 and 65535, got {v}")
        return v
    
    @field_validator("LLM_TEMPERATURE")
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        """验证温度参数范围"""
        if not (0.0 <= v <= 2.0):
            raise ValueError(f"LLM_TEMPERATURE must be between 0.0 and 2.0, got {v}")
        return v
    
    @field_validator("RAG_SCORE_THRESHOLD")
    @classmethod
    def validate_score_threshold(cls, v: float) -> float:
        """验证相似度阈值范围"""
        if not (0.0 <= v <= 1.0):
            raise ValueError(f"RAG_SCORE_THRESHOLD must be between 0.0 and 1.0, got {v}")
        return v
    
    @field_validator("LLM_PROVIDER")
    @classmethod
    def validate_llm_provider(cls, v: str) -> str:
        """验证 LLM 提供商"""
        valid_providers = ["qwen", "openai", "deepseek", "local"]
        if v.lower() not in valid_providers:
            raise ValueError(f"LLM_PROVIDER must be one of {valid_providers}, got {v}")
        return v.lower()
    
    @field_validator("EMBEDDING_PROVIDER")
    @classmethod
    def validate_embedding_provider(cls, v: str) -> str:
        """验证 Embedding 提供商"""
        valid_providers = ["qwen", "openai", "local"]
        if v.lower() not in valid_providers:
            raise ValueError(f"EMBEDDING_PROVIDER must be one of {valid_providers}, got {v}")
        return v.lower()
    
    # ============ 模型验证器 ============
    
    @model_validator(mode="after")
    def validate_llm_config(self) -> "Settings":
        """验证 LLM 配置的完整性"""
        provider = self.LLM_PROVIDER.lower()
        
        if provider == "qwen" and not self.QWEN_API_KEY:
            logger.warning("QWEN_API_KEY is not set. LLM features will not work.")
        elif provider == "openai" and not self.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is not set. LLM features will not work.")
        elif provider == "deepseek" and not self.DEEPSEEK_API_KEY:
            logger.warning("DEEPSEEK_API_KEY is not set. LLM features will not work.")
        
        return self
    
    @model_validator(mode="after")
    def validate_embedding_config(self) -> "Settings":
        """验证 Embedding 配置的完整性"""
        provider = self.EMBEDDING_PROVIDER.lower()
        
        if provider == "qwen" and not self.QWEN_API_KEY:
            logger.warning("QWEN_API_KEY is not set. Embedding features will not work.")
        elif provider == "openai" and not self.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY is not set. Embedding features will not work.")
        
        return self
    
    def model_post_init(self, __context) -> None:
        """配置加载后的初始化"""
        import os
        
        # 记录配置来源
        if os.path.exists(".env.local"):
            self.CONFIG_LOADED_FROM = ".env.local + .env"
        else:
            self.CONFIG_LOADED_FROM = ".env"
        
        # 打印配置摘要（隐藏敏感信息）
        self._log_config_summary()
    
    def _log_config_summary(self) -> None:
        """打印配置摘要（隐藏敏感信息）"""
        logger.info("=" * 60)
        logger.info("Configuration Loaded")
        logger.info("=" * 60)
        logger.info(f"Environment: {self.ENVIRONMENT}")
        logger.info(f"Config Source: {self.CONFIG_LOADED_FROM}")
        logger.info(f"Config Version: {self.CONFIG_VERSION}")
        logger.info(f"Service Name: {self.SERVICE_NAME}")
        logger.info(f"Debug Mode: {self.DEBUG}")
        logger.info("-" * 60)
        logger.info(f"LLM Provider: {self.LLM_PROVIDER}")
        logger.info(f"LLM Model: {self._get_llm_model()}")
        logger.info(f"LLM Temperature: {self.LLM_TEMPERATURE}")
        logger.info(f"LLM Max Tokens: {self.LLM_MAX_TOKENS}")
        logger.info("-" * 60)
        logger.info(f"Embedding Provider: {self.EMBEDDING_PROVIDER}")
        logger.info(f"Embedding Model: {self._get_embedding_model()}")
        logger.info(f"Embedding Dimension: {self.EMBEDDING_DIMENSION}")
        logger.info("-" * 60)
        logger.info(f"Milvus: {self.MILVUS_HOST}:{self.MILVUS_PORT}/{self.MILVUS_DB_NAME}")
        logger.info(f"PostgreSQL: {self.PG_HOST}:{self.PG_PORT}/{self.PG_DATABASE}")
        logger.info(f"Redis: {self.REDIS_URL}")
        logger.info("-" * 60)
        logger.info(f"RAG Top-K: {self.RAG_TOP_K}")
        logger.info(f"RAG Score Threshold: {self.RAG_SCORE_THRESHOLD}")
        logger.info(f"RAG Cache Enabled: {self.RAG_CACHE_ENABLED}")
        logger.info("=" * 60)
    
    def _get_llm_model(self) -> str:
        """获取当前 LLM 模型名称"""
        provider = self.LLM_PROVIDER.lower()
        if provider == "qwen":
            return self.QWEN_MODEL
        elif provider == "openai":
            return self.OPENAI_MODEL
        elif provider == "deepseek":
            return self.DEEPSEEK_MODEL
        elif provider == "local":
            return self.LOCAL_MODEL_NAME
        return "unknown"
    
    def _get_embedding_model(self) -> str:
        """获取当前 Embedding 模型名称"""
        provider = self.EMBEDDING_PROVIDER.lower()
        if provider == "qwen":
            return self.QWEN_EMBEDDING_MODEL
        elif provider == "openai":
            return self.OPENAI_EMBEDDING_MODEL
        elif provider == "local":
            return self.LOCAL_EMBEDDING_MODEL
        return "unknown"
    
    @property
    def milvus_uri(self) -> str:
        """获取 Milvus 连接 URI"""
        return f"http://{self.MILVUS_HOST}:{self.MILVUS_PORT}"
    
    @property
    def pg_dsn(self) -> str:
        """获取 PostgreSQL 连接字符串"""
        return f"postgresql://{self.PG_USER}:{self.PG_PASSWORD}@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DATABASE}"
    
    @property
    def pg_async_dsn(self) -> str:
        """获取 PostgreSQL 异步连接字符串"""
        return f"postgresql+asyncpg://{self.PG_USER}:{self.PG_PASSWORD}@{self.PG_HOST}:{self.PG_PORT}/{self.PG_DATABASE}"
    
    class Config:
        env_file = [".env", ".env.local"]  # 优先级：.env.local > .env（后面的覆盖前面的）
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # 忽略未定义的环境变量


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


def reload_settings() -> Settings:
    """重载配置（清除缓存）"""
    get_settings.cache_clear()
    return get_settings()


def get_hot_reloadable_config() -> dict:
    """获取可热重载的配置项"""
    settings = get_settings()
    return {
        "llm": {
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS,
            "timeout": settings.LLM_TIMEOUT,
        },
        "rag": {
            "top_k": settings.RAG_TOP_K,
            "score_threshold": settings.RAG_SCORE_THRESHOLD,
            "rerank_enabled": settings.RAG_RERANK_ENABLED,
            "cache_enabled": settings.RAG_CACHE_ENABLED,
            "cache_ttl": settings.RAG_CACHE_TTL,
        },
        "sync": {
            "batch_size": settings.SYNC_BATCH_SIZE,
            "interval_minutes": settings.SYNC_INTERVAL_MINUTES,
        }
    }


settings = get_settings()
