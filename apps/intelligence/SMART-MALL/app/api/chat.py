"""
智能对话接口

支持：
- 纯文本对话
- 图片+文字对话（视觉理解）
- Function Calling
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.core.agent.mall_agent import MallAgent

router = APIRouter()
logger = logging.getLogger(__name__)

# 全局 Agent 实例
_agent: Optional[MallAgent] = None


def get_agent() -> MallAgent:
    """获取 Agent 单例"""
    global _agent
    if _agent is None:
        _agent = MallAgent()
    return _agent


# ============ 请求/响应模型 ============

class ChatRequest(BaseModel):
    """对话请求"""
    request_id: str
    user_id: str
    message: str
    image_url: Optional[str] = None  # 图片 URL（可选）
    context: Optional[Dict[str, Any]] = None  # 上下文（位置、历史等）


class ToolResult(BaseModel):
    """工具调用结果"""
    function: str
    args: Dict[str, Any]
    result: Dict[str, Any]


class ChatResponse(BaseModel):
    """对话响应"""
    request_id: str
    type: str  # text / confirmation_required / confirm / error
    content: Optional[str] = None
    action: Optional[str] = None
    args: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    tool_results: Optional[List[ToolResult]] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    timestamp: str


# ============ 接口实现 ============

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    智能对话接口
    
    支持：
    - 纯文本：用户输入文字，返回文字或执行操作
    - 图片+文字：用户上传图片并提问，进行视觉理解
    
    示例：
    - "Nike 店在哪？" → 导航到 Nike 店
    - "帮我买一双跑鞋，500以内" → 搜索 → 推荐 → 加购 → 下单
    - [图片] + "我想吃类似的菜" → 视觉理解 → 推荐餐厅
    """
    try:
        logger.info(f"[{request.request_id}] Chat: {request.message[:50]}...")
        
        agent = get_agent()
        
        result = await agent.process(
            user_input=request.message,
            image_url=request.image_url,
            context=request.context
        )
        
        return ChatResponse(
            request_id=request.request_id,
            type=result.get("type", "text"),
            content=result.get("content"),
            action=result.get("action"),
            args=result.get("args"),
            message=result.get("message"),
            tool_results=[
                ToolResult(**tr) for tr in result.get("tool_results", [])
            ] if result.get("tool_results") else None,
            model=result.get("model"),
            tokens_used=result.get("tokens_used"),
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
    except Exception as e:
        logger.error(f"[{request.request_id}] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ConfirmRequest(BaseModel):
    """确认请求"""
    request_id: str
    user_id: str
    action: str
    args: Dict[str, Any]
    confirmed: bool


@router.post("/chat/confirm", response_model=ChatResponse)
async def confirm_action(request: ConfirmRequest) -> ChatResponse:
    """
    确认操作接口
    
    当 chat 接口返回 type=confirmation_required 或 type=confirm 时，
    前端需要调用此接口确认或取消操作。
    """
    try:
        logger.info(f"[{request.request_id}] Confirm: {request.action}, confirmed={request.confirmed}")
        
        if not request.confirmed:
            return ChatResponse(
                request_id=request.request_id,
                type="text",
                content="好的，已取消操作。还有什么可以帮您的吗？",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
        
        agent = get_agent()
        
        # 执行已确认的操作
        result = await agent._execute_function(
            request.action,
            request.args,
            context=None
        )
        
        # 根据操作类型返回不同消息
        if request.action == "create_order":
            content = f"订单创建成功！请在支付页面完成支付。"
        elif request.action == "add_to_cart":
            content = f"已添加到购物车！{result.get('message', '')}"
        else:
            content = result.get("message", "操作成功")
        
        return ChatResponse(
            request_id=request.request_id,
            type="text",
            content=content,
            tool_results=[ToolResult(
                function=request.action,
                args=request.args,
                result=result
            )],
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
    except Exception as e:
        logger.error(f"[{request.request_id}] Confirm error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
