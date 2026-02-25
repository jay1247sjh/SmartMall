"""
LangChain @tool 格式的工具定义 + SafetyLevelToolWrapper

将旧 MALL_TOOLS（OpenAI function calling dict）迁移为 LangChain @tool 装饰器格式，
并通过 SafetyLevelToolWrapper 按安全级别包装：
- safe     → 直接执行
- confirm  → 中断，返回确认请求
- critical → 中断，返回确认请求
"""

import json
import logging
from typing import Any, Dict, List, Optional

from langchain_core.tools import BaseTool, tool

logger = logging.getLogger(__name__)


# ============ 安全级别映射（从旧 OPERATION_LEVELS 迁移） ============

SAFETY_LEVELS: Dict[str, str] = {
    "navigate_to_store": "safe",
    "navigate_to_area": "safe",
    "search_products": "safe",
    "search_stores": "safe",
    "search_by_image": "safe",
    "get_product_detail": "safe",
    "get_store_info": "safe",
    "get_cart": "safe",
    "recommend_products": "safe",
    "recommend_restaurants": "safe",
    "add_to_cart": "confirm",
    "create_order": "critical",
}


# ============ @tool 定义 ============


@tool
async def navigate_to_store(store_name: str, highlight: bool = True) -> dict:
    """导航到指定店铺，在 3D 场景中高亮显示路径。当用户询问某个店铺在哪里、怎么去某个店铺时使用。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        result = await rag.navigate_to_store(store_name)
        return result or {"success": False, "message": f"未找到店铺: {store_name}"}
    except Exception as e:
        logger.warning(f"RAG navigate failed: {e}")
        return {
            "success": True,
            "store": {"name": store_name, "floor": 2, "area": "A区"},
            "message": f"{store_name} 店位于 2 楼 A 区",
        }


@tool
async def navigate_to_area(area_name: str, show_stores: bool = True) -> dict:
    """导航到指定区域，如美食区、服装区、电影院等。当用户询问某个区域在哪里时使用。"""
    return {
        "success": True,
        "area": {"name": area_name},
        "message": f"正在为您导航到{area_name}",
    }


@tool
async def search_products(
    keyword: str,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    category: Optional[str] = None,
) -> dict:
    """搜索商品，支持关键词、价格范围、品牌、分类筛选。当用户想找某类商品时使用。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        results = await rag.search_products(
            query=keyword, category=category, brand=brand,
            min_price=min_price, max_price=max_price, top_k=5,
        )
        if results:
            return {"success": True, "products": [r.to_dict() for r in results], "total": len(results)}
        return {"success": True, "products": [], "total": 0, "message": f"未找到相关商品: {keyword}"}
    except Exception as e:
        logger.warning(f"RAG search_products failed: {e}")
        return {"success": True, "products": [], "total": 0, "message": f"搜索暂时不可用"}


@tool
async def search_stores(keyword: str, category: Optional[str] = None) -> dict:
    """搜索店铺，支持关键词和分类筛选。当用户想找某类店铺时使用。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        results = await rag.search_stores(query=keyword, category=category, top_k=5)
        if results:
            return {"success": True, "stores": [r.to_dict() for r in results], "total": len(results)}
        return {"success": True, "stores": [], "total": 0, "message": f"未找到相关店铺: {keyword}"}
    except Exception as e:
        logger.warning(f"RAG search_stores failed: {e}")
        return {"success": True, "stores": [], "total": 0, "message": "搜索暂时不可用"}


@tool
async def search_by_image(image_description: str, search_type: str = "product") -> dict:
    """根据图片搜索相似商品或美食。当用户上传图片并询问类似商品时使用。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        if search_type == "product":
            results = await rag.search_products(query=image_description, top_k=5)
            items = [r.to_dict() for r in results] if results else []
        else:
            cat = "餐饮" if search_type == "food" else None
            results = await rag.search_stores(query=image_description, category=cat, top_k=5)
            items = [r.to_dict() for r in results] if results else []
        return {"success": True, "message": "根据图片为您推荐", "results": items}
    except Exception as e:
        logger.warning(f"RAG search_by_image failed: {e}")
        return {"success": True, "results": [], "message": "图片搜索暂时不可用"}


@tool
async def get_product_detail(product_id: str) -> dict:
    """获取商品详情，包括价格、库存、规格、评价等。当用户想了解某个商品的详细信息时使用。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()

    try:
        products = await rag.search_products(query=product_id, top_k=8)
        target = next((p for p in products if p.id == product_id), None)
        if target is None and products:
            target = products[0]

        review_docs = await rag.search_reviews(
            query=target.name if target else product_id,
            product_id=product_id,
            top_k=20,
        )

        ratings = []
        highlights = []
        for doc in review_docs[:5]:
            rating = doc.metadata.get("rating")
            if rating is not None:
                try:
                    ratings.append(float(rating))
                except (TypeError, ValueError):
                    pass

            content = doc.metadata.get("content") or doc.page_content
            if content:
                highlights.append(str(content)[:80])

        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

        if target is None:
            return {
                "success": False,
                "message": f"未找到商品: {product_id}",
                "product": {
                    "id": product_id,
                    "rating": avg_rating,
                    "review_count": len(review_docs),
                    "review_highlights": highlights[:3],
                },
            }

        return {
            "success": True,
            "product": {
                "id": target.id,
                "name": target.name,
                "brand": target.brand,
                "category": target.category,
                "price": target.price,
                "store_id": target.store_id,
                "store_name": target.store_name,
                "score": target.score,
                "rating": avg_rating,
                "review_count": len(review_docs),
                "review_highlights": highlights[:3],
            },
        }
    except Exception as e:
        logger.warning(f"RAG get_product_detail failed: {e}")
        return {
            "success": True,
            "product": {"id": product_id},
            "message": "商品详情暂时不可用",
        }


@tool
async def get_store_info(store_id: str, info_type: str = "basic") -> dict:
    """获取店铺信息，包括营业时间、联系方式、优惠活动等。"""
    return {"success": True, "store": {"id": store_id, "info_type": info_type}}


@tool
async def add_to_cart(product_id: str, quantity: int = 1, sku_id: Optional[str] = None) -> dict:
    """添加商品到购物车。当用户明确表示要购买某商品时使用。"""
    return {"success": True, "cart_id": "cart_001", "message": "已添加到购物车", "cart_total": 399}


@tool
async def get_cart() -> dict:
    """获取购物车内容。当用户询问购物车有什么时使用。"""
    return {"success": True, "items": [], "total": 0}


@tool
async def create_order(cart_id: str, address_id: Optional[str] = None) -> dict:
    """创建订单。此操作需要用户确认支付。当用户明确表示要下单、结算时使用。"""
    return {"success": True, "order_id": "order_001", "message": "订单创建成功"}


@tool
async def recommend_products(
    category: Optional[str] = None,
    style: Optional[str] = None,
    price_range: Optional[str] = None,
) -> dict:
    """推荐商品。根据用户偏好、历史记录或当前上下文推荐商品。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        query_parts = ["推荐"]
        if category:
            query_parts.append(category)
        if style:
            query_parts.append(style)
        if price_range:
            query_parts.append(price_range)

        results = await rag.search_products(query=" ".join(query_parts), top_k=5)
        if not results:
            return {"success": True, "products": [], "message": "暂无推荐"}

        products = []
        for r in results:
            review_docs = await rag.search_reviews(query=r.name, product_id=r.id, top_k=5)
            ratings = []
            evidence = []
            for doc in review_docs[:3]:
                rating = doc.metadata.get("rating")
                if rating is not None:
                    try:
                        ratings.append(float(rating))
                    except (TypeError, ValueError):
                        pass
                content = doc.metadata.get("content") or doc.page_content
                if content:
                    evidence.append(str(content)[:80])

            item = r.to_dict()
            item["review_count"] = len(review_docs)
            item["review_rating"] = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
            item["review_evidence"] = evidence[:2]
            products.append(item)

        return {
            "success": True,
            "products": products,
            "message": "推荐结果已结合真实用户评价",
        }
    except Exception:
        return {"success": True, "products": [], "message": "推荐服务暂时不可用"}


@tool
async def recommend_restaurants(
    cuisine: Optional[str] = None,
    style: Optional[str] = None,
    price_level: Optional[str] = None,
) -> dict:
    """推荐餐厅。根据用户口味偏好推荐商城内的餐厅。"""
    from app.core.rag.service import get_rag_service
    rag = get_rag_service()
    try:
        query_parts = ["餐厅", "美食"]
        if cuisine:
            query_parts.append(cuisine)
        if style:
            query_parts.append(style)
        results = await rag.search_stores(query=" ".join(query_parts), category="餐饮", top_k=5)
        if results:
            restaurants = [
                {"id": r.id, "name": r.name, "cuisine": r.category,
                 "floor": r.floor, "area": r.area, "score": r.score}
                for r in results
            ]
            return {"success": True, "restaurants": restaurants}
        return {"success": True, "restaurants": [], "message": "未找到相关餐厅"}
    except Exception:
        return {"success": True, "restaurants": [], "message": "推荐服务暂时不可用"}


# ============ 所有原始工具列表 ============

ALL_TOOLS: List[BaseTool] = [
    navigate_to_store,
    navigate_to_area,
    search_products,
    search_stores,
    search_by_image,
    get_product_detail,
    get_store_info,
    add_to_cart,
    get_cart,
    create_order,
    recommend_products,
    recommend_restaurants,
]


# ============ SafetyLevelToolWrapper ============


class SafetyLevelToolWrapper:
    """工具安全级别包装器

    safe     → 直接执行
    confirm  → 中断 AgentExecutor，返回确认请求 dict
    critical → 中断 AgentExecutor，返回确认请求 dict
    """

    @classmethod
    def wrap(cls, t: BaseTool) -> BaseTool:
        level = SAFETY_LEVELS.get(t.name, "safe")
        if level == "safe":
            return t

        # 替换 _arun 为返回确认请求的守卫函数
        original_arun = t._arun

        async def guarded_run(*args: Any, **kwargs: Any) -> dict:
            return {
                "type": "confirmation_required",
                "action": t.name,
                "args": kwargs,
                "safety_level": level,
                "message": f"此操作需要确认：{t.description}",
            }

        t._arun = guarded_run  # type: ignore[assignment]
        return t

    @classmethod
    def get_level(cls, tool_name: str) -> str:
        return SAFETY_LEVELS.get(tool_name, "safe")


def get_wrapped_tools(has_image: bool = True) -> List[BaseTool]:
    """获取经过安全级别包装的工具列表"""
    tools = list(ALL_TOOLS)
    if not has_image:
        tools = [t for t in tools if t.name != "search_by_image"]
    return [SafetyLevelToolWrapper.wrap(t) for t in tools]
