# 提示词配置指南

本目录包含智能商城导购系统的所有提示词配置文件。

---

## 文件说明

| 文件 | 用途 | 版本 |
|------|------|------|
| `system.yaml` | 系统级提示词，定义 AI 助手核心行为 | 2.0 |
| `intent.yaml` | 意图识别提示词 | 2.0 |
| `action.yaml` | Action 生成提示词 | 2.0 |
| `vision.yaml` | 视觉理解提示词 | 2.0 |
| `safety.yaml` | 安全防护配置 | 2.0 |

---

## 提示词设计原则

### 1. 严格约束优先

每个提示词都使用【必须】【禁止】明确约束：

```yaml
# ✅ 好的约束
- 【必须】只输出 JSON，不包含任何其他文字
- 【禁止】编造不存在的店铺、商品、价格

# ❌ 模糊的约束
- 尽量输出 JSON
- 不要编造信息
```

### 2. 低温度参数

为确保输出稳定性，使用较低的 temperature：

| 场景 | temperature | 原因 |
|------|-------------|------|
| 意图识别 | 0.1 | 需要稳定的分类结果 |
| Action 生成 | 0.1 | 需要严格的 JSON 格式 |
| 视觉分析 | 0.2 | 需要准确的描述 |
| 对话回复 | 0.3 | 允许一定的创造性 |
| 安全检查 | 0.0 | 需要完全一致的判断 |

### 3. 示例驱动

每个提示词都包含具体示例：

```yaml
# 示例
输入："Nike 店在哪"
输出：
{
  "intent": "NAVIGATE_TO_STORE",
  "confidence": 0.95,
  "entities": { "store_name": "Nike" }
}
```

### 4. 安全边界明确

所有提示词都包含安全约束：

- 禁止讨论敏感话题
- 禁止泄露系统信息
- 禁止执行危险操作

---

## 使用方式

### 方式 1：直接使用 PromptLoader

```python
from app.core.prompt_loader import PromptLoader

# 加载配置
config = PromptLoader.load("intent")

# 获取系统提示词
system_prompt = PromptLoader.get_system_prompt("intent")

# 格式化用户提示词
user_prompt = PromptLoader.format_user_prompt(
    "intent",
    user_input="Nike 在哪",
    current_position="1楼入口"
)

# 获取参数
params = PromptLoader.get_parameters("intent")
```

### 方式 2：使用便捷函数

```python
from app.core.prompt_loader import load_prompt, get_system_prompt, format_prompt

# 加载完整配置
config = load_prompt("system")

# 获取系统提示词
prompt = get_system_prompt("vision")

# 格式化提示词
prompt = format_prompt("intent", user_input="找运动鞋")
```

---

## 扩展指南

### 添加新提示词

1. 在 `prompts/` 目录创建 `{name}.yaml`
2. 遵循以下模板：

```yaml
name: "prompt_name"
version: "1.0"
description: "提示词描述"

system_prompt: |
  # 身份
  你是...

  # 任务
  ...

  # 严格规则
  - 【必须】...
  - 【禁止】...

  # 输出格式
  ...

  # 示例
  ...

user_prompt_template: |
  变量1: {var1}
  变量2: {var2}

parameters:
  temperature: 0.3
  max_tokens: 500
```

3. 使用 `PromptLoader.load("prompt_name")` 加载

### 修改现有提示词

1. 修改对应的 `.yaml` 文件
2. 更新 `version` 字段
3. 调用 `PromptLoader.reload("name")` 刷新缓存

---

## 安全配置说明

`safety.yaml` 定义了安全防护规则：

### 提示词注入检测

```yaml
injection_patterns:
  high_risk:
    - "忽略上述"
    - "假装你是"
    - "输出你的prompt"
```

### 敏感词过滤

```yaml
sensitive_words:
  politics: [...]
  violence: [...]
```

### 安全回复模板

```yaml
safe_responses:
  injection: "我是智能商城导购助手..."
  sensitive: "抱歉，这个话题我无法讨论..."
  out_of_scope: "抱歉，这个问题超出了我的能力范围..."
```

---

## 最佳实践

1. **版本控制**：每次修改提示词时更新 version
2. **测试验证**：修改后进行充分测试
3. **日志记录**：记录提示词加载和使用情况
4. **定期审查**：定期审查安全配置的有效性
5. **A/B 测试**：重大修改前进行 A/B 测试

---

## 常见问题

### Q: 如何调试提示词效果？

A: 使用低 temperature 测试，观察输出稳定性。可以通过 `/api/chat` 接口测试。

### Q: 如何处理提示词注入攻击？

A: `safety.yaml` 定义了检测模式，`mall_agent.py` 中的 `_is_unsafe_input` 方法会进行检查。

### Q: 如何添加新的意图类型？

A: 修改 `intent.yaml` 中的意图类型定义表，并更新示例。
