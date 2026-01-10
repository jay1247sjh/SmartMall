"""
Embedding 接口

生成文本的向量表示，用于 RAG 检索
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


class EmbeddingRequest(BaseModel):
    """Embedding 请求"""
    texts: List[str]
    model: Optional[str] = None


class EmbeddingResult(BaseModel):
    """单个文本的 Embedding 结果"""
    index: int
    embedding: List[float]


class EmbeddingResponse(BaseModel):
    """Embedding 响应"""
    model: str
    dimension: int
    embeddings: List[EmbeddingResult]


@router.post("/embedding/generate", response_model=EmbeddingResponse)
async def generate_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """
    生成文本的向量表示
    
    - 输入: 文本列表
    - 输出: 向量列表
    """
    try:
        logger.info(f"Generating embeddings for {len(request.texts)} texts")
        
        # TODO: 实际调用 Embedding 模型
        # 当前返回 Mock 数据（随机向量）
        
        import random
        dimension = 1536  # OpenAI ada-002 维度
        
        embeddings = []
        for i, text in enumerate(request.texts):
            # 生成伪随机向量（实际应调用 Embedding API）
            random.seed(hash(text))
            embedding = [random.uniform(-1, 1) for _ in range(dimension)]
            embeddings.append(EmbeddingResult(
                index=i,
                embedding=embedding
            ))
        
        return EmbeddingResponse(
            model="mock-embedding",
            dimension=dimension,
            embeddings=embeddings
        )
        
    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/embedding/models")
async def get_available_models():
    """获取可用的 Embedding 模型"""
    return {
        "models": [
            {
                "name": "text-embedding-ada-002",
                "provider": "openai",
                "dimension": 1536,
                "maxTokens": 8191
            },
            {
                "name": "text-embedding-3-small",
                "provider": "openai",
                "dimension": 1536,
                "maxTokens": 8191
            },
            {
                "name": "text-embedding-3-large",
                "provider": "openai",
                "dimension": 3072,
                "maxTokens": 8191
            }
        ]
    }
