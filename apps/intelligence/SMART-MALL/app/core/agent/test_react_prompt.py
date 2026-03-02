import os

from langchain_core.messages import AIMessage, HumanMessage

os.environ["DEBUG"] = "false"

from app.core.agent.agent import SmartMallAgentFactory


def test_react_prompt_accepts_string_agent_scratchpad() -> None:
    """ReAct prompt should accept string scratchpad from create_react_agent."""
    prompt = SmartMallAgentFactory._REACT_PROMPT

    rendered = prompt.format_prompt(
        system_message="system",
        tools="tool_a: sample tool",
        tool_names="tool_a",
        input="where is store A",
        chat_history=[HumanMessage(content="hi"), AIMessage(content="hello")],
        agent_scratchpad="Thought: previous reasoning\n",
    )

    assert "previous reasoning" in rendered.to_string()
