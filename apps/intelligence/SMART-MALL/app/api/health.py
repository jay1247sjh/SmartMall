"""
健康检查接口
"""

from fastapi import APIRouter
from datetime import datetime

from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/ready")
async def readiness_check():
    """就绪检查"""
    # TODO: 检查依赖服务（LLM、向量数据库等）
    return {
        "status": "ready",
        "checks": {
            "llm": "ok",
            "vector_db": "ok"
        }
    }


@router.get("/health/live")
async def liveness_check():
    """存活检查"""
    return {"status": "alive"}
