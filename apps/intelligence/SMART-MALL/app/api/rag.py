"""
RAG API 路由

提供：
- 店铺语义搜索
- 商品语义搜索
- 数据同步触发
- 健康检查
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
import logging

from app.schemas.rag import (
    StoreSearchRequest,
    StoreSearchResponse,
    StoreSearchItem,
    StorePosition,
    ProductSearchRequest,
    ProductSearchResponse,
    ProductSearchItem,
    SyncRequest,
    SyncResponse,
    SyncResultItem,
    HealthCheckResponse,
    NavigateRequest,
    NavigateResponse,
)
from app.core.rag.service import RAGService, get_rag_service
from app.core.rag.sync import DataSyncService, get_sync_service
from app.core.rag.seed_data import (
    get_seed_stores,
    get_seed_products,
    get_seed_locations,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["RAG"])


def get_rag() -> RAGService:
    """获取 RAG 服务依赖"""
    return get_rag_service()


def get_sync() -> DataSyncService:
    """获取同步服务依赖"""
    return get_sync_service()


@router.post("/search/stores", response_model=StoreSearchResponse)
async def search_stores(
    request: StoreSearchRequest,
    rag_service: RAGService = Depends(get_rag)
):
    """
    店铺语义搜索
    
    根据自然语言查询搜索相关店铺
    """
    try:
        results = await rag_service.search_stores(
            query=request.query,
            category=request.category,
            floor=request.floor,
            top_k=request.top_k,
            score_threshold=request.score_threshold
        )
        
        items = [
            StoreSearchItem(
                id=r.id,
                name=r.name,
                category=r.category,
                description=r.description,
                floor=r.floor,
                area=r.area,
                position=StorePosition(
                    x=r.position_x,
                    y=r.position_y,
                    z=r.position_z
                ),
                score=r.score
            )
            for r in results
        ]
        
        return StoreSearchResponse(
            success=True,
            query=request.query,
            total=len(items),
            results=items
        )
        
    except Exception as e:
        logger.error(f"Store search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search/products", response_model=ProductSearchResponse)
async def search_products(
    request: ProductSearchRequest,
    rag_service: RAGService = Depends(get_rag)
):
    """
    商品语义搜索
    
    根据自然语言查询搜索相关商品，支持价格、品牌过滤
    """
    try:
        results = await rag_service.search_products(
            query=request.query,
            category=request.category,
            brand=request.brand,
            min_price=request.min_price,
            max_price=request.max_price,
            top_k=request.top_k,
            score_threshold=request.score_threshold
        )
        
        items = [
            ProductSearchItem(
                id=r.id,
                name=r.name,
                brand=r.brand,
                category=r.category,
                description=r.description,
                price=r.price,
                store_id=r.store_id,
                store_name=r.store_name,
                score=r.score
            )
            for r in results
        ]
        
        return ProductSearchResponse(
            success=True,
            query=request.query,
            total=len(items),
            results=items
        )
        
    except Exception as e:
        logger.error(f"Product search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/trigger", response_model=SyncResponse)
async def trigger_sync(
    request: SyncRequest,
    sync_service: DataSyncService = Depends(get_sync)
):
    """
    触发数据同步
    
    将示例数据同步到 Milvus 向量数据库
    """
    try:
        collections = request.collections or ["stores", "products", "locations"]
        
        stores = get_seed_stores() if "stores" in collections else []
        products = get_seed_products() if "products" in collections else []
        locations = get_seed_locations() if "locations" in collections else []
        
        results = await sync_service.full_sync_all(stores, products, locations)
        
        items = [
            SyncResultItem(
                collection=r.collection,
                total=r.total,
                inserted=r.inserted,
                updated=r.updated,
                failed=r.failed,
                duration_ms=r.duration_ms,
                timestamp=r.timestamp.isoformat()
            )
            for r in results
        ]
        
        return SyncResponse(
            success=True,
            results=items,
            message=f"同步完成，共处理 {sum(r.total for r in results)} 条数据"
        )
        
    except Exception as e:
        logger.error(f"Sync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    rag_service: RAGService = Depends(get_rag)
):
    """
    RAG 服务健康检查
    
    检查 Milvus 连接、Embedding 服务、集合状态
    """
    try:
        status = await rag_service.health_check()
        
        overall = status["milvus"] and status["embedding"]
        
        return HealthCheckResponse(
            status="healthy" if overall else "unhealthy",
            milvus=status["milvus"],
            embedding=status["embedding"],
            collections=status["collections"]
        )
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthCheckResponse(
            status="unhealthy",
            milvus=False,
            embedding=False,
            collections={}
        )


@router.post("/navigate", response_model=NavigateResponse)
async def navigate_to_store(
    request: NavigateRequest,
    rag_service: RAGService = Depends(get_rag)
):
    """
    导航到店铺
    
    根据店铺名称查找位置信息
    """
    try:
        result = await rag_service.navigate_to_store(request.store_name)
        
        if not result:
            return NavigateResponse(
                success=False,
                store=None,
                message=f"未找到店铺: {request.store_name}"
            )
        
        store_data = result["store"]
        store = StoreSearchItem(
            id=store_data["id"],
            name=store_data["name"],
            category=store_data["category"],
            description=store_data["description"],
            floor=store_data["floor"],
            area=store_data["area"],
            position=StorePosition(
                x=store_data["position"]["x"],
                y=store_data["position"]["y"],
                z=store_data["position"]["z"]
            ),
            score=store_data["score"]
        )
        
        return NavigateResponse(
            success=True,
            store=store,
            message=result["message"]
        )
        
    except Exception as e:
        logger.error(f"Navigate error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
