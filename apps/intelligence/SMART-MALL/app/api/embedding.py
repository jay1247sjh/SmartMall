"""
Embedding 接口

使用 LangChain Embedding 提供商（Ollama bge-m3 + Qwen fallback）生成文本向量表示。
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from app.core.embedding_provider import get_embeddings, get_current_provider_name

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

    使用 LangChain Embedding 提供商：
    - 主：Ollama bge-m3（本地，1024 维）
    - 备：Qwen Embedding（远程）
    """
    try:
        logger.info(f"Generating embeddings for {len(request.texts)} texts")

        embeddings_provider = get_embeddings()
        vectors = await embeddings_provider.aembed_documents(request.texts)

        provider_name = get_current_provider_name()
        dimension = len(vectors[0]) if vectors else 0

        results = [
            EmbeddingResult(index=i, embedding=vec)
            for i, vec in enumerate(vectors)
        ]

        return EmbeddingResponse(
            model=provider_name,
            dimension=dimension,
            embeddings=results
        )

    except Exception as e:
        logger.error(f"Embedding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Embedding 生成失败: {str(e)}")


@router.get("/embedding/models")
async def get_available_models():
    """获取可用的 Embedding 模型"""
    current = get_current_provider_name()
    return {
        "current": current,
        "models": [
            {
                "name": "bge-m3:latest",
                "provider": "ollama",
                "dimension": 1024,
                "description": "本地 Ollama bge-m3 模型（主）"
            },
            {
                "name": "qwen-embedding",
                "provider": "qwen",
                "dimension": 1024,
                "description": "Qwen Embedding（备用）"
            },
        ]
    }
