"""
配置管理模块

支持从环境变量加载配置，便于不同环境部署
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
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
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()


settings = get_settings()
