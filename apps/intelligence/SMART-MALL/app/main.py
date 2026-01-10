"""
Smart Mall Intelligence Service - FastAPI 入口

职责：
- 大模型调用（LLM）
- Prompt 工程
- Agent / Skills
- RAG 检索
- Embedding 生成
- 意图理解

架构原则：
- Python 失败不导致 Java 失败
- AI 能力可版本化、可替换
- 支持 OpenAI / DeepSeek / 自建模型切换
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time

from app.api.health import router as health_router
from app.api.intent import router as intent_router
from app.api.embedding import router as embedding_router
from app.api.chat import router as chat_router
from app.core.config import settings

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("Intelligence Service starting...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")
    yield
    logger.info("Intelligence Service shutting down...")


app = FastAPI(
    title="Smart Mall Intelligence Service",
    description="智能商城导购系统 - 智能服务",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """添加请求追踪 ID"""
    request_id = request.headers.get("X-Request-ID", f"req_{int(time.time() * 1000)}")
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    logger.info(f"[{request_id}] {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    return response


# 注册路由
app.include_router(health_router, tags=["Health"])
app.include_router(intent_router, prefix="/api", tags=["Intent"])
app.include_router(embedding_router, prefix="/api", tags=["Embedding"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "Smart Mall Intelligence Service",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
