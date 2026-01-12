"""
意图理解接口

使用 LLM 进行自然语言意图识别，返回结构化 Action
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import json
import time

from app.core.llm.factory import LLMFactory
from app.core.llm.qwen import QwenProvider
from app.core.prompt_loader import PromptLoader

router = APIRouter()
logger = logging.getLogger(__name__)

# LLM 单例
_llm: Optional[QwenProvider] = None


def get_llm() -> QwenProvider:
    """获取 LLM 单例"""
    global _llm
    if _llm is None:
        _llm = LLMFactory.create("qwen")
    return _llm


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
    currentPage: Optional[str] = None


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
    status: str
    result: Optional[AIResult] = None
    error: Optional[ErrorInfo] = None
    fallback: Optional[FallbackInfo] = None
    metadata: Optional[Metadata] = None


# ============ 意图识别 ============

async def recognize_intent(
    text: str,
    role: str,
    current_page: Optional[str] = None
) -> Dict[str, Any]:
    """
    使用 LLM 识别意图
    
    Args:
        text: 用户输入文本
        role: 用户角色
        current_page: 当前页面路径
        
    Returns:
        意图识别结果
    """
    llm = get_llm()
    
    # 从 YAML 加载 prompt 配置
    system_prompt = PromptLoader.get_system_prompt("intent")
    user_prompt = PromptLoader.format_user_prompt(
        "intent",
        user_input=text,
        user_role=role,
        current_page=current_page or "未知"
    )
    params = PromptLoader.get_parameters("intent")
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    response = await llm.chat(
        messages=messages,
        temperature=params.get("temperature", 0.1),
        max_tokens=params.get("max_tokens", 500)
    )
    
    # 解析 JSON 响应
    content = response.content.strip()
    
    # 处理可能的 markdown 代码块
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1])
    
    try:
        result = json.loads(content)
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response: {content}")
        raise ValueError(f"Invalid JSON response: {e}")


# ============ 接口实现 ============

@router.post("/intent/process", response_model=AIResponse)
async def process_natural_language(request: AIRequest) -> AIResponse:
    """
    处理自然语言输入，返回结构化 Action
    """
    start_time = time.time()
    
    try:
        logger.info(f"[{request.requestId}] Processing: {request.input.text}")
        
        # 使用 LLM 识别意图
        result = await recognize_intent(
            text=request.input.text,
            role=request.context.role,
            current_page=request.context.currentPage
        )
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        # 构建 Action 列表
        actions = []
        if result.get("action"):
            action_data = result["action"]
            target = None
            if action_data.get("target"):
                target = ActionTarget(
                    type=action_data["target"].get("type", ""),
                    id=action_data["target"].get("id", "")
                )
            actions.append(Action(
                action=action_data.get("type", result["intent"]),
                target=target,
                params=action_data.get("params")
            ))
        
        return AIResponse(
            requestId=request.requestId,
            timestamp=datetime.utcnow().isoformat() + "Z",
            status="SUCCESS",
            result=AIResult(
                intent=result["intent"],
                confidence=result.get("confidence", 0.9),
                actions=actions,
                response=ResponseContent(
                    text=result["response"]["text"],
                    suggestions=result["response"].get("suggestions", [])
                )
            ),
            metadata=Metadata(
                modelUsed="qwen",
                tokensUsed=0,
                latencyMs=latency_ms
            )
        )
        
    except Exception as e:
        logger.error(f"[{request.requestId}] Error: {str(e)}")
        latency_ms = int((time.time() - start_time) * 1000)
        
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
            ),
            metadata=Metadata(
                modelUsed="qwen",
                tokensUsed=0,
                latencyMs=latency_ms
            )
        )


@router.get("/intent/supported")
async def get_supported_intents():
    """获取支持的意图类型"""
    return {
        "intents": [
            {
                "type": "NAVIGATE_TO_PAGE",
                "description": "导航到管理页面",
                "examples": ["打开商品管理", "去控制台", "进入商城建模"]
            },
            {
                "type": "STORE_QUERY",
                "description": "查询店铺位置",
                "examples": ["Nike 店在哪", "带我去星巴克"]
            },
            {
                "type": "AREA_QUERY",
                "description": "查询区域",
                "examples": ["美食区在哪", "去服装区"]
            },
            {
                "type": "PRODUCT_SEARCH",
                "description": "搜索商品",
                "examples": ["搜索运动鞋", "找一件外套"]
            },
            {
                "type": "GENERATE_MALL",
                "description": "生成商城布局",
                "examples": ["创建一个3层商城", "生成商城布局"]
            },
            {
                "type": "GENERAL_QUESTION",
                "description": "一般问题",
                "examples": ["商城几点关门", "有停车场吗"]
            }
        ],
        "model": "qwen"
    }
