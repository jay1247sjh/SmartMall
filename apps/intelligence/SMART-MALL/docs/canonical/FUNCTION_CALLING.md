# Function Calling 设计文档

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：LLM Function Calling 架构设计
> 
> 本文档采用 CoT（Chain of Thought）思维链形式，记录设计决策过程。

---

## 1. 问题分析（Why）

### 1.1 思维链：为什么需要 Function Calling？

```
问题：用户说 "帮我买一双 Nike 跑鞋，500 以内的"

思考步骤：
├─ Step 1: 这是一个简单的意图识别吗？
│   └─ 不是。需要多个步骤：搜索 → 筛选 → 加购 → 下单
│
├─ Step 2: 能用结构化输出吗？
│   └─ 不合适。因为：
│       ├─ 不知道搜索结果是什么，无法一次性生成所有 Action
│       └─ 需要根据中间结果决定下一步
│
├─ Step 3: 需要什么能力？
│   └─ LLM 需要：
│       ├─ 调用外部函数（搜索、查库存、下单）
│       ├─ 获取函数返回结果
│       └─ 根据结果决定下一步
│
└─ 结论：需要 Function Calling
```

### 1.2 思维链：Function Calling vs 结构化输出

```
对比分析：

场景 A: "Nike 店在哪？"
├─ 步骤数：1 步
├─ 需要外部数据：否（店铺位置是已知的）
├─ 需要决策：否
└─ 推荐：结构化输出 ✓

场景 B: "帮我买一双 Nike 跑鞋"
├─ 步骤数：4-5 步
├─ 需要外部数据：是（搜索结果、库存、价格）
├─ 需要决策：是（选哪个商品、库存够不够）
└─ 推荐：Function Calling ✓

场景 C: 混合场景（导航 + 购物）
├─ 需要统一架构
├─ Function Calling 可以覆盖简单场景
└─ 推荐：统一使用 Function Calling ✓
```

---

## 2. 架构设计（What）

### 2.1 思维链：如何设计函数体系？

```
设计思路：

Step 1: 梳理用户可能的需求
├─ 导航类：去某店铺、去某区域、查位置
├─ 搜索类：搜商品、搜店铺、搜品牌
├─ 购物类：加购物车、下单、查订单
├─ 信息类：查营业时间、查优惠、查评价
└─ 通用类：闲聊、帮助

Step 2: 按领域划分函数
├─ navigation/  导航函数
├─ search/      搜索函数
├─ shopping/    购物函数
├─ info/        信息查询函数
└─ general/     通用函数

Step 3: 定义函数粒度
├─ 太粗：一个函数做太多事，不灵活
├─ 太细：函数太多，LLM 选择困难
└─ 原则：一个函数 = 一个原子操作
```

### 2.2 函数定义

```yaml
# 导航函数
- name: navigate_to_store
  description: 导航到指定店铺，在 3D 场景中高亮显示路径
  parameters:
    store_name: string  # 店铺名称
    highlight: boolean  # 是否高亮

- name: navigate_to_area
  description: 导航到指定区域（如美食区、服装区）
  parameters:
    area_name: string
    show_stores: boolean  # 是否显示区域内店铺

# 搜索函数
- name: search_products
  description: 搜索商品，支持关键词、价格、品牌筛选
  parameters:
    keyword: string
    max_price: number (optional)
    min_price: number (optional)
    brand: string (optional)
    category: string (optional)

- name: search_stores
  description: 搜索店铺
  parameters:
    keyword: string
    category: string (optional)

# 购物函数
- name: get_product_detail
  description: 获取商品详情（价格、库存、规格）
  parameters:
    product_id: string

- name: add_to_cart
  description: 添加商品到购物车
  parameters:
    product_id: string
    quantity: integer
    sku_id: string (optional)  # 规格 ID

- name: create_order
  description: 创建订单（需用户确认支付）
  parameters:
    cart_id: string
  requires_confirmation: true  # 标记需要用户确认

# 信息查询函数
- name: get_store_info
  description: 获取店铺信息（营业时间、联系方式、优惠）
  parameters:
    store_id: string
    info_type: enum[basic, promotions, reviews]
```


---

## 3. 执行流程（How）

### 3.1 思维链：一次完整的购物流程

```
用户输入: "帮我买一双 Nike 跑鞋，500 以内的"

┌─────────────────────────────────────────────────────────────────┐
│ Round 1: 理解意图，开始搜索                                       │
├─────────────────────────────────────────────────────────────────┤
│ LLM 思考:                                                        │
│   ├─ 用户想买 Nike 跑鞋                                          │
│   ├─ 预算 500 以内                                               │
│   └─ 第一步应该搜索商品                                          │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "function": "search_products",                               │
│     "arguments": {                                               │
│       "keyword": "Nike 跑鞋",                                    │
│       "max_price": 500                                           │
│     }                                                            │
│   }                                                              │
│                                                                  │
│ 系统执行: 调用商品搜索 API                                        │
│ 返回结果: [商品A: ¥399, 商品B: ¥459, 商品C: ¥489]                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Round 2: 分析结果，选择商品                                       │
├─────────────────────────────────────────────────────────────────┤
│ LLM 思考:                                                        │
│   ├─ 搜到 3 个商品，都在预算内                                    │
│   ├─ 商品A 评分最高(4.8)，价格最低                                │
│   └─ 需要确认库存再推荐                                          │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "function": "get_product_detail",                            │
│     "arguments": { "product_id": "product_a_001" }               │
│   }                                                              │
│                                                                  │
│ 系统执行: 查询商品详情                                            │
│ 返回结果: { stock: 15, sizes: [40,41,42,43], rating: 4.8 }       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Round 3: 推荐商品，询问用户                                       │
├─────────────────────────────────────────────────────────────────┤
│ LLM 思考:                                                        │
│   ├─ 商品A 库存充足，评分高                                       │
│   ├─ 但不知道用户鞋码                                            │
│   └─ 应该推荐并询问尺码                                          │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "response": "找到一款很合适的：Nike Air Zoom 跑鞋，          │
│                  ¥399，评分 4.8。有 40-43 码，请问您穿多大？",    │
│     "suggestions": ["40码", "41码", "42码", "43码"]              │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Round 4: 用户选择尺码                                            │
├─────────────────────────────────────────────────────────────────┤
│ 用户输入: "42码"                                                 │
│                                                                  │
│ LLM 思考:                                                        │
│   ├─ 用户选了 42 码                                              │
│   └─ 可以加入购物车了                                            │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "function": "add_to_cart",                                   │
│     "arguments": {                                               │
│       "product_id": "product_a_001",                             │
│       "quantity": 1,                                             │
│       "sku_id": "size_42"                                        │
│     }                                                            │
│   }                                                              │
│                                                                  │
│ 系统执行: 添加到购物车                                            │
│ 返回结果: { cart_id: "cart_xxx", total: 399 }                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Round 5: 创建订单（需确认）                                       │
├─────────────────────────────────────────────────────────────────┤
│ LLM 思考:                                                        │
│   ├─ 商品已加入购物车                                            │
│   └─ 询问用户是否下单                                            │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "response": "已加入购物车！Nike Air Zoom 42码，¥399。        │
│                  需要现在下单吗？",                               │
│     "suggestions": ["立即下单", "继续逛逛", "查看购物车"]         │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Round 6: 用户确认下单                                            │
├─────────────────────────────────────────────────────────────────┤
│ 用户输入: "下单"                                                 │
│                                                                  │
│ LLM 输出:                                                        │
│   {                                                              │
│     "function": "create_order",                                  │
│     "arguments": { "cart_id": "cart_xxx" }                       │
│   }                                                              │
│                                                                  │
│ 系统执行: 创建订单                                                │
│ 返回结果: {                                                      │
│   status: "PENDING_CONFIRMATION",                                │
│   order_id: "order_xxx",                                         │
│   message: "订单已创建，请确认支付"                               │
│ }                                                                │
│                                                                  │
│ 前端动作: 弹出支付确认框                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 安全控制（Safety）

### 4.1 思维链：哪些操作需要保护？

```
风险分析：

高风险操作（需用户确认）:
├─ create_order      创建订单 → 涉及金钱
├─ cancel_order      取消订单 → 不可逆
├─ delete_account    删除账户 → 不可逆
└─ modify_address    修改地址 → 影响配送

中风险操作（需二次确认）:
├─ add_to_cart       加购物车 → 可撤销，但提示确认
└─ clear_cart        清空购物车 → 可能误操作

低风险操作（直接执行）:
├─ search_*          搜索类 → 只读
├─ get_*             查询类 → 只读
└─ navigate_*        导航类 → 只读
```

### 4.2 安全控制实现

```python
# 操作分级
class OperationLevel:
    SAFE = "safe"           # 直接执行
    CONFIRM = "confirm"     # 需确认
    CRITICAL = "critical"   # 需强确认（输入密码/验证码）

OPERATION_LEVELS = {
    # 安全操作
    "search_products": OperationLevel.SAFE,
    "search_stores": OperationLevel.SAFE,
    "get_product_detail": OperationLevel.SAFE,
    "get_store_info": OperationLevel.SAFE,
    "navigate_to_store": OperationLevel.SAFE,
    "navigate_to_area": OperationLevel.SAFE,
    
    # 需确认操作
    "add_to_cart": OperationLevel.CONFIRM,
    "clear_cart": OperationLevel.CONFIRM,
    
    # 关键操作
    "create_order": OperationLevel.CRITICAL,
    "cancel_order": OperationLevel.CRITICAL,
}

async def execute_function(func_name: str, args: dict, user_confirmed: bool = False):
    level = OPERATION_LEVELS.get(func_name, OperationLevel.SAFE)
    
    if level == OperationLevel.CRITICAL and not user_confirmed:
        return {
            "status": "PENDING_CONFIRMATION",
            "action": func_name,
            "message": "此操作需要您确认",
            "confirm_type": "payment"  # 前端显示支付确认框
        }
    
    if level == OperationLevel.CONFIRM and not user_confirmed:
        return {
            "status": "PENDING_CONFIRMATION",
            "action": func_name,
            "message": "确认执行此操作？",
            "confirm_type": "simple"  # 前端显示简单确认框
        }
    
    # 执行函数
    return await FUNCTION_REGISTRY[func_name](**args)
```

---

## 5. 错误处理（Error Handling）

### 5.1 思维链：可能出现什么错误？

```
错误分类：

函数执行错误:
├─ 商品不存在 → 提示用户，建议搜索其他
├─ 库存不足 → 提示用户，推荐类似商品
├─ 价格变动 → 提示用户新价格，询问是否继续
└─ 网络超时 → 重试或降级

LLM 错误:
├─ 调用不存在的函数 → 忽略，返回友好提示
├─ 参数格式错误 → 尝试修复或重新生成
└─ 无限循环调用 → 设置最大轮次限制
```

### 5.2 错误处理实现

```python
MAX_ROUNDS = 10  # 最大对话轮次

async def process_with_functions(user_input: str, context: dict):
    messages = build_messages(user_input, context)
    round_count = 0
    
    while round_count < MAX_ROUNDS:
        round_count += 1
        
        # 调用 LLM
        response = await llm.chat(messages, tools=TOOLS)
        
        # 检查是否有函数调用
        if not response.tool_calls:
            # 没有函数调用，返回文本响应
            return {"type": "text", "content": response.content}
        
        # 执行函数
        for tool_call in response.tool_calls:
            func_name = tool_call.function.name
            
            # 检查函数是否存在
            if func_name not in FUNCTION_REGISTRY:
                messages.append({
                    "role": "tool",
                    "content": f"错误：函数 {func_name} 不存在",
                    "tool_call_id": tool_call.id
                })
                continue
            
            try:
                # 解析参数
                args = json.loads(tool_call.function.arguments)
                
                # 执行函数
                result = await execute_function(func_name, args)
                
                # 检查是否需要用户确认
                if result.get("status") == "PENDING_CONFIRMATION":
                    return {
                        "type": "confirmation",
                        "action": func_name,
                        "args": args,
                        "message": result["message"]
                    }
                
                # 将结果加入消息
                messages.append({
                    "role": "tool",
                    "content": json.dumps(result, ensure_ascii=False),
                    "tool_call_id": tool_call.id
                })
                
            except Exception as e:
                messages.append({
                    "role": "tool",
                    "content": f"执行错误：{str(e)}",
                    "tool_call_id": tool_call.id
                })
    
    # 超过最大轮次
    return {
        "type": "error",
        "message": "抱歉，处理时间过长，请重新描述您的需求"
    }
```

---

## 6. 与现有架构集成

### 6.1 思维链：如何与 Java 后端集成？

```
当前架构：
├─ 前端 → Java 后端 → 数据库
└─ 前端 → 智能服务 → LLM

问题：Function Calling 需要调用业务 API（搜索、下单）

方案对比：
├─ 方案 A: 智能服务直接调用数据库
│   └─ ❌ 违反架构原则，绕过 Java 的权限校验
│
├─ 方案 B: 智能服务调用 Java API
│   └─ ✓ 保持架构一致，复用 Java 的业务逻辑
│
└─ 方案 C: 前端编排（智能服务只返回 Action）
    └─ ✓ 智能服务无状态，但前端复杂度增加

推荐：方案 B（智能服务调用 Java API）
```

### 6.2 集成架构

```
┌─────────────────────────────────────────────────────────────────┐
│                           前端                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  用户输入 "帮我买 Nike 跑鞋"                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                        智能服务 (Python)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. 调用 LLM，获取 function call                         │    │
│  │  2. 调用 Java API 执行函数                               │    │
│  │  3. 将结果返回 LLM，继续对话                             │    │
│  │  4. 返回最终结果给前端                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
├─────────────────────────────────────────────────────────────────┤
│                        Java 后端                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /api/products/search     商品搜索                       │    │
│  │  /api/products/{id}       商品详情                       │    │
│  │  /api/cart/add            加购物车                       │    │
│  │  /api/orders/create       创建订单                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│                          数据库                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 附录 A：完整函数列表

| 函数名 | 描述 | 安全级别 |
|--------|------|----------|
| `navigate_to_store` | 导航到店铺 | SAFE |
| `navigate_to_area` | 导航到区域 | SAFE |
| `search_products` | 搜索商品 | SAFE |
| `search_stores` | 搜索店铺 | SAFE |
| `get_product_detail` | 获取商品详情 | SAFE |
| `get_store_info` | 获取店铺信息 | SAFE |
| `add_to_cart` | 加入购物车 | CONFIRM |
| `remove_from_cart` | 移出购物车 | CONFIRM |
| `clear_cart` | 清空购物车 | CONFIRM |
| `create_order` | 创建订单 | CRITICAL |
| `cancel_order` | 取消订单 | CRITICAL |
| `get_order_status` | 查询订单状态 | SAFE |

---

## 附录 B：版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-01-10 | 初始版本，采用 CoT 形式编写 |
