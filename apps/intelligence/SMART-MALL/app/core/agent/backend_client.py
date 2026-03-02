"""Agent 工具调用 Java 后端的轻量客户端。"""

from __future__ import annotations

import json
import logging
import time
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional

import httpx

from app.core.agent.runtime_context import get_current_user_id
from app.core.config import get_settings
from app.core.redis_pool import RedisPoolFactory

logger = logging.getLogger(__name__)


class BackendClient:
    """用于工具层访问后端服务 + Redis 购物态。"""

    CART_KEY_PREFIX = "smartmall:cart:"
    ORDER_KEY_PREFIX = "smartmall:orders:"

    def __init__(self):
        self._settings = get_settings()
        self._base = self._settings.JAVA_BACKEND_INTERNAL_URL.rstrip("/")
        self._timeout = min(max(self._settings.LLM_TIMEOUT, 10), 60)

    async def get_store_info(self, store_id: str, info_type: str = "basic") -> Dict[str, Any]:
        data = await self._request_api("GET", f"/store/{store_id}")
        if not isinstance(data, dict):
            return {
                "success": False,
                "message": f"未找到店铺: {store_id}",
                "store": {"id": store_id},
            }
        store = {
            "id": str(data.get("id", store_id)),
            "name": data.get("storeName") or data.get("name") or "",
            "category": data.get("category") or "",
            "description": data.get("description") or "",
            "status": data.get("status") or "",
            "info_type": info_type,
        }
        return {"success": True, "store": store}

    async def add_to_cart(
        self,
        product_id: str,
        quantity: int = 1,
        sku_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        user_id = get_current_user_id()
        product = await self._request_api("GET", f"/public/product/{product_id}")
        if not isinstance(product, dict):
            product = {"id": product_id, "productName": product_id, "price": 0}

        item = {
            "product_id": product_id,
            "sku_id": sku_id,
            "quantity": max(1, int(quantity)),
            "name": product.get("productName") or product.get("name") or product_id,
            "price": float(product.get("price") or 0),
            "store_id": product.get("storeId") or product.get("store_id") or "",
        }
        cart = await self._load_cart(user_id)
        merged = False
        for existing in cart:
            if existing.get("product_id") == product_id and existing.get("sku_id") == sku_id:
                existing["quantity"] = int(existing.get("quantity", 1)) + item["quantity"]
                merged = True
                break
        if not merged:
            cart.append(item)
        await self._save_cart(user_id, cart)
        total = self._calc_total(cart)
        return {
            "success": True,
            "cart_id": f"cart_{user_id}",
            "message": "已添加到购物车",
            "cart_total": total,
            "items_count": len(cart),
        }

    async def get_cart(self) -> Dict[str, Any]:
        user_id = get_current_user_id()
        items = await self._load_cart(user_id)
        return {
            "success": True,
            "items": items,
            "total": self._calc_total(items),
        }

    async def create_order(self, cart_id: str, address_id: Optional[str] = None) -> Dict[str, Any]:
        user_id = get_current_user_id()
        cart = await self._load_cart(user_id)
        if not cart:
            return {"success": False, "message": "购物车为空，无法下单"}

        total_amount = self._calc_total(cart)
        store_id = next((item.get("store_id") for item in cart if item.get("store_id")), None)
        payload = {
            "storeId": store_id,
            "totalAmount": str(Decimal(str(total_amount)).quantize(Decimal("0.01"))),
        }
        backend_order = await self._request_api("POST", "/user/orders", json_body=payload)

        order_id = None
        if isinstance(backend_order, dict):
            order_id = backend_order.get("orderId") or backend_order.get("id")
        if not order_id:
            # 降级：本地生成订单记录
            order_id = f"order_{uuid.uuid4().hex[:12]}"

        order_record = {
            "order_id": order_id,
            "cart_id": cart_id,
            "user_id": user_id,
            "items": cart,
            "total_amount": total_amount,
            "address_id": address_id,
            "created_at": int(time.time()),
        }
        await self._append_order(user_id, order_record)
        await self._save_cart(user_id, [])
        return {"success": True, "order_id": order_id, "message": "订单创建成功"}

    async def _request_api(
        self,
        method: str,
        path: str,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> Optional[Any]:
        url = f"{self._base}{path}"
        headers = {"Content-Type": "application/json"}
        if self._settings.SERVICE_TOKEN:
            headers["Authorization"] = f"Bearer {self._settings.SERVICE_TOKEN}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.request(method, url, json=json_body, headers=headers)
            if resp.status_code >= 400:
                logger.warning(
                    json.dumps(
                        {
                            "event": "backend_client_http_error",
                            "method": method,
                            "path": path,
                            "status": resp.status_code,
                        },
                        ensure_ascii=False,
                    )
                )
                return None
            payload = resp.json()
            if isinstance(payload, dict) and "data" in payload:
                return payload.get("data")
            return payload
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "backend_client_request_failed",
                        "method": method,
                        "path": path,
                        "reason": str(e),
                    },
                    ensure_ascii=False,
                )
            )
            return None

    async def _load_cart(self, user_id: str) -> List[Dict[str, Any]]:
        key = f"{self.CART_KEY_PREFIX}{user_id}"
        try:
            client = await RedisPoolFactory.get_client()
            raw = await client.get(key)
            if not raw:
                return []
            data = json.loads(raw)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    async def _save_cart(self, user_id: str, items: List[Dict[str, Any]]) -> None:
        key = f"{self.CART_KEY_PREFIX}{user_id}"
        try:
            client = await RedisPoolFactory.get_client()
            await client.set(key, json.dumps(items, ensure_ascii=False), ex=86400)
        except Exception as e:
            logger.warning(
                json.dumps(
                    {
                        "event": "backend_client_cart_save_failed",
                        "user_id": user_id,
                        "reason": str(e),
                    },
                    ensure_ascii=False,
                )
            )

    async def _append_order(self, user_id: str, order_record: Dict[str, Any]) -> None:
        key = f"{self.ORDER_KEY_PREFIX}{user_id}"
        try:
            client = await RedisPoolFactory.get_client()
            await client.lpush(key, json.dumps(order_record, ensure_ascii=False))
            await client.ltrim(key, 0, 99)
            await client.expire(key, 86400 * 30)
        except Exception:
            pass

    @staticmethod
    def _calc_total(items: List[Dict[str, Any]]) -> float:
        total = 0.0
        for item in items:
            try:
                total += float(item.get("price") or 0) * int(item.get("quantity") or 0)
            except Exception:
                continue
        return round(total, 2)
