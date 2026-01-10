"""
意图理解接口

处理自然语言输入，返回结构化 Action
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ 请求/响应模型 ============

class Position(BaseModel):
    """3D 位置"""
    x: float
    y: float
    z: float


class Context(BaseModel):
    """请求上下文"""
    userId: str
    role: str = "USER"
    mallId: Optional[str] = None
    currentPosition: Optional[Position] = None
    sessionId: Optional[str] = None


class Input(BaseModel):
    """用户输入"""
    type: str = "NATURAL_LANGUAGE"
    text: str
    locale: str = "zh-CN"


class AIRequest(BaseModel):
    """AI 请求"""
    requestId: str
    version: str = "1.0"
    timestamp: Optional[str] = None
    context: Context
    input: Input


class ActionTarget(BaseModel):
    """Action 目标"""
    type: str
    id: str


class Action(BaseModel):
    """AI 生成的 Action"""
    action: str
    target: Optional[ActionTarget] = None
    params: Optional[Dict[str, Any]] = None


class ResponseContent(BaseModel):
    """响应内容"""
    text: str
    suggestions: Optional[List[str]] = None


class AIResult(BaseModel):
    """AI 处理结果"""
    intent: str
    confidence: float
    actions: List[Action]
    response: ResponseContent


class Metadata(BaseModel):
    """元数据"""
    modelUsed: str
    tokensUsed: int
    latencyMs: int


class ErrorInfo(BaseModel):
    """错误信息"""
    code: str
    message: str
    retryable: bool = True
    fallbackAvailable: bool = True


class FallbackInfo(BaseModel):
    """降级信息"""
    type: str
    suggestion: str


class AIResponse(BaseModel):
    """AI 响应"""
    requestId: str
    version: str = "1.0"
    timestamp: str
    status: str  # SUCCESS / ERROR / DEGRADED
    result: Optional[AIResult] = None
    error: Optional[ErrorInfo] = None
    fallback: Optional[FallbackInfo] = None
    metadata: Optional[Metadata] = None


# ============ 接口实现 ============

@router.post("/intent/process", response_model=AIResponse)
async def process_natural_language(request: AIRequest) -> AIResponse:
    """
    处理自然语言输入，返回结构化 Action
    
    - 输入: 用户自然语言 + 上下文
    - 输出: 意图 + Action 列表 + 自然语言响应
    """
    import time
    start_time = time.time()
    
    try:
        logger.info(f"[{request.requestId}] Processing: {request.input.text}")
        
        # TODO: 实际调用 LLM 进行意图理解
        # 当前返回 Mock 数据用于开发测试
        
        # 简单的关键词匹配（Mock 实现）
        text = request.input.text.lower()
        
        if "nike" in text or "耐克" in text:
            intent = "NAVIGATE_TO_STORE"
            actions = [
                Action(
                    action="NAVIGATE_TO_STORE",
                    target=ActionTarget(type="STORE", id="store_nike_001"),
                    params={"highlight": True}
                )
            ]
            response_text = "Nike 店位于 2 楼 A 区，我来为您导航。"
            suggestions = ["查看店铺详情", "搜索其他品牌"]
            confidence = 0.95
            
        elif "餐厅" in text or "吃" in text or "美食" in text:
            intent = "NAVIGATE_TO_AREA"
            actions = [
                Action(
                    action="NAVIGATE_TO_AREA",
                    target=ActionTarget(type="AREA", id="area_food_001"),
                    params={"showStores": True}
                )
            ]
            response_text = "美食区位于 3 楼，有多家餐厅可供选择。"
            suggestions = ["查看餐厅列表", "推荐热门餐厅"]
            confidence = 0.88
            
        elif "搜索" in text or "找" in text:
            intent = "PRODUCT_SEARCH"
            actions = [
                Action(
                    action="SEARCH_PRODUCTS",
                    params={"keyword": text}
                )
            ]
            response_text = "正在为您搜索相关商品..."
            suggestions = ["筛选价格", "筛选品牌"]
            confidence = 0.82
            
        else:
            intent = "GENERAL_QUESTION"
            actions = []
            response_text = "抱歉，我没有完全理解您的问题。您可以尝试询问店铺位置、商品搜索等。"
            suggestions = ["Nike 店在哪", "推荐餐厅", "搜索商品"]
            confidence = 0.5
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return AIResponse(
            requestId=request.requestId,
            timestamp=datetime.utcnow().isoformat() + "Z",
            status="SUCCESS",
            result=AIResult(
                intent=intent,
                confidence=confidence,
                actions=actions,
                response=ResponseContent(
                    text=response_text,
                    suggestions=suggestions
                )
            ),
            metadata=Metadata(
                modelUsed="mock",
                tokensUsed=0,
                latencyMs=latency_ms
            )
        )
        
    except Exception as e:
        logger.error(f"[{request.requestId}] Error: {str(e)}")
        return AIResponse(
            requestId=request.requestId,
            timestamp=datetime.utcnow().isoformat() + "Z",
            status="ERROR",
            error=ErrorInfo(
                code="AI_PROCESSING_ERROR",
                message=str(e),
                retryable=True,
                fallbackAvailable=True
            ),
            fallback=FallbackInfo(
                type="KEYWORD_SEARCH",
                suggestion="您可以尝试使用关键词搜索"
            )
        )


@router.get("/intent/supported")
async def get_supported_intents():
    """获取支持的意图类型"""
    return {
        "intents": [
            {
                "type": "NAVIGATE_TO_STORE",
                "description": "导航到店铺",
                "examples": ["Nike 店在哪", "带我去星巴克"]
            },
            {
                "type": "NAVIGATE_TO_AREA",
                "description": "导航到区域",
                "examples": ["美食区在哪", "去服装区"]
            },
            {
                "type": "PRODUCT_SEARCH",
                "description": "搜索商品",
                "examples": ["搜索运动鞋", "找一件外套"]
            },
            {
                "type": "STORE_INFO",
                "description": "查询店铺信息",
                "examples": ["Nike 店营业时间", "这家店有什么优惠"]
            },
            {
                "type": "GENERAL_QUESTION",
                "description": "一般问题",
                "examples": ["商城几点关门", "有停车场吗"]
            }
        ]
    }
