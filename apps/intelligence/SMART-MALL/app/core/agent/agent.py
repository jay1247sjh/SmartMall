"""
SmartMallAgentFactory：LangChain AgentExecutor 工厂

根据 OPENROUTER_SUPPORTS_TOOLS 配置选择 agent 类型：
- True  → create_openai_tools_agent（function calling）
- False → create_react_agent（ReAct 推理）

Agent 与 Memory 协作方式：
- API 层调用前：memory_manager.build_prompt_context(user_input)
- API 层调用后：memory_manager.save_turn(user_msg, assistant_msg)
- Agent 本身不持有 memory 参数
"""

import logging
import json
from typing import Any, Dict, List, Optional

from langchain_classic.agents import AgentExecutor, create_openai_tools_agent, create_react_agent
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.llm_provider import get_llm, get_vision_llm

logger = logging.getLogger(__name__)

# 安全检查关键词（从旧 MallAgent 迁移）
BLOCKED_PATTERNS = [
    "忽略上述", "忽略之前", "忘记你的", "你现在是", "假装你是",
    "扮演", "角色扮演", "输出你的prompt", "输出系统提示",
    "你的指令是什么", "DAN模式", "越狱", "jailbreak",
    "ignore previous", "disregard", "pretend you are",
]

SAFE_RESPONSE = "我是智能商城导购助手，只能帮您处理购物相关的问题。有什么购物需求我可以帮您吗？"

# 视觉分析提示词
VISION_PROMPT_TEMPLATE = """请分析这张图片，并结合用户的问题回答。

用户问题：{user_input}

# 分析要求
1. 客观描述图片内容
2. 提取可用于搜索的关键特征
3. 根据用户问题决定是否需要调用工具

# 分析维度
- 如果是食物：菜品类型、主要食材、烹饪方式、口味特征
- 如果是商品：类别、品牌、颜色/款式、风格
- 如果是场景：场景类型、相关商品类别

# 禁止
- 禁止分析人脸或个人身份信息
- 禁止对图片中的人物进行评价
- 禁止编造图片中不存在的内容
"""


def is_unsafe_input(user_input: str) -> bool:
    """检查输入是否包含不安全内容（注入攻击等）"""
    input_lower = user_input.lower()
    return any(p.lower() in input_lower for p in BLOCKED_PATTERNS)


async def process_with_vision(user_input: str, image_url: str) -> str:
    """使用视觉模型处理图片+文字输入

    使用独立的视觉 LLM，不走文本 LLM 的 fallback 链。
    视觉模型不可用时返回友好错误而非降级到文本模型。
    """
    vision_llm = get_vision_llm()
    prompt = VISION_PROMPT_TEMPLATE.format(user_input=user_input)
    message = HumanMessage(content=[
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": image_url}},
    ])
    try:
        result = await vision_llm.ainvoke([message])
        return result.content
    except Exception as e:
        logger.error(json.dumps({
            "event": "vision_llm_error",
            "reason": str(e),
        }, ensure_ascii=False))
        raise RuntimeError("视觉模型暂时不可用，请稍后再试") from e


class SmartMallAgentFactory:
    """LangChain AgentExecutor 工厂

    根据 OPENROUTER_SUPPORTS_TOOLS 选择 agent 类型，
    统一包装工具安全级别。
    """

    # OpenAI tools agent 的 prompt 模板
    _TOOLS_PROMPT = ChatPromptTemplate.from_messages([
        ("system", "{system_message}"),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    # ReAct agent 的 prompt 模板
    _REACT_PROMPT = ChatPromptTemplate.from_messages([
        ("system", "{system_message}\n\n"
         "你可以使用以下工具：\n{tools}\n\n"
         "使用以下格式：\n"
         "Thought: 思考下一步该做什么\n"
         "Action: 工具名称\n"
         "Action Input: 工具输入参数（JSON）\n"
         "Observation: 工具返回结果\n"
         "... (可重复多次)\n"
         "Thought: 我已经得到了最终答案\n"
         "Final Answer: 最终回复\n\n"
         "工具名称列表：{tool_names}"),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])

    @classmethod
    def create(cls, streaming: bool = False) -> AgentExecutor:
        """创建 AgentExecutor 实例

        Args:
            streaming: 是否启用流式输出

        Returns:
            配置好的 AgentExecutor
        """
        from app.core.config import get_settings
        from app.core.agent.tools_langchain import get_wrapped_tools

        settings = get_settings()
        llm = get_llm(streaming=streaming)
        tools = get_wrapped_tools()

        if settings.OPENROUTER_SUPPORTS_TOOLS:
            agent = create_openai_tools_agent(llm, tools, cls._TOOLS_PROMPT)
        else:
            agent = create_react_agent(llm, tools, cls._REACT_PROMPT)

        return AgentExecutor(
            agent=agent,
            tools=tools,
            max_iterations=10,
            handle_parsing_errors=True,
            return_intermediate_steps=True,
        )
