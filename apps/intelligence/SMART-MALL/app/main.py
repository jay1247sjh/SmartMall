
"""
Smart Mall Intelligence Service - FastAPI 入口

职责：
- 大模型调用（LLM）
- Prompt 工程
- Agent / Tool-Call 对话
- RAG 检索
- Embedding 生成

架构原则：
- Python 失败不导致 Java 失败
- AI 能力可版本化、可替换
- 支持 OpenAI / DeepSeek / 自建模型切换
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
import secrets
import time
from typing import List

from app.api.health import router as health_router
from app.api.embedding import router as embedding_router
from app.api.chat import router as chat_router
from app.api.chat_stream import router as chat_stream_router
from app.api.rag import router as rag_router
from app.api.mall_generator import router as mall_generator_router
from app.api.mall_describe import router as mall_describe_router
from app.api.floors import router as floors_router
from app.api.sync import router as sync_router, metrics_router
from app.core.config import settings
from app.core.redis_pool import RedisPoolFactory
from app.core.sync.event_bus import EventBus
from app.core.rag.service import init_rag_service
from app.core.memory.session_scanner import SessionScanner

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
    logger.info("Environment: %s", settings.ENVIRONMENT)
    logger.info("LLM Provider: %s", settings.LLM_PROVIDER)

    scanner_task = None
    degraded_services: List[str] = []

    # 1. 初始化 Redis 连接池
    try:
        await RedisPoolFactory.get_pool()
        logger.info("Redis connection pool initialized")
    except Exception as e:
        logger.warning("Redis connection pool init failed (non-critical): %s", e)
        degraded_services.append("redis")

    # 2. 初始化 EventBus Consumer Group
    # EventBus 使用 RedisPoolFactory 共享连接，无需独立关闭
    try:
        event_bus = EventBus()
        await event_bus.initialize()
        logger.info("EventBus consumer group initialized")
    except Exception as e:
        logger.warning("EventBus init failed (non-critical): %s", e)
        degraded_services.append("event_bus")

    # 3. 初始化 RAG 服务（可选，失败不影响启动）
    try:
        await init_rag_service()
        logger.info("RAG Service initialized")
    except Exception as e:
        logger.warning("RAG Service initialization failed (non-critical): %s", e)
        degraded_services.append("rag")

    # 4. 启动 Session Scanner 后台任务
    try:
        scanner = SessionScanner()
        scanner_task = asyncio.create_task(scanner.start())
        logger.info("Session Scanner started")
    except Exception as e:
        logger.warning("Session Scanner start failed (non-critical): %s", e)
        degraded_services.append("session_scanner")

    # 聚合报告降级服务
    if degraded_services:
        logger.warning(
            "Service started in degraded mode. Failed components: %s",
            ", ".join(degraded_services),
        )
    app.state.degraded_services = degraded_services

    yield

    # 清理阶段
    logger.info("Intelligence Service shutting down...")

    # 取消 Session Scanner 任务
    if scanner_task is not None:
        scanner_task.cancel()
        try:
            await scanner_task
        except asyncio.CancelledError:
            pass
        logger.info("Session Scanner stopped")

    # 关闭 Redis 连接池（同时释放 EventBus 依赖的连接）
    try:
        await RedisPoolFactory.close()
        logger.info("Redis connection pool closed")
    except Exception as e:
        logger.warning("Redis pool close failed: %s", e)


app = FastAPI(
    title="Smart Mall Intelligence Service",
    description="智能商城导购系统 - 智能服务",
    version=settings.CONFIG_VERSION,
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
    request_id = request.headers.get("X-Request-ID", f"req_{secrets.token_hex(6)}")
    start_time = time.time()

    try:
        response = await call_next(request)
    except Exception:
        process_time = time.time() - start_time
        logger.error(
            "[%s] %s %s - unhandled exception - %.3fs",
            request_id, request.method, request.url.path, process_time,
        )
        raise

    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)

    logger.info(
        "[%s] %s %s - %s - %.3fs",
        request_id, request.method, request.url.path, response.status_code, process_time,
    )

    return response


# 注册路由
app.include_router(health_router, tags=["Health"])
app.include_router(embedding_router, prefix="/api", tags=["Embedding"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])
app.include_router(chat_stream_router, prefix="/api", tags=["Chat Stream"])
app.include_router(rag_router, prefix="/api", tags=["RAG"])
app.include_router(mall_generator_router, prefix="/api", tags=["Mall Generator"])
app.include_router(mall_describe_router, prefix="/api", tags=["Mall Describe"])
app.include_router(floors_router, prefix="/api", tags=["Floors"])
app.include_router(sync_router, tags=["Sync"])
app.include_router(metrics_router, tags=["Metrics"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "Smart Mall Intelligence Service",
        "version": settings.CONFIG_VERSION,
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
