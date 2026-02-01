---
inclusion: always
---

# RAG 数据隔离约束

## 三类数据严格隔离

### 数据分类

| 集合名称 | 数据类型 | 用途 | 特征 |
|---------|---------|------|------|
| world_facts | 世界事实 | Action 决策 | 客观、稳定、无主观评价 |
| reviews | 用户评论 | 回答主观问题 | 主观、多元、有情感倾向 |
| rules | 规则指南 | 约束 Agent 行为 | 明确、可执行、近指令式 |

### 核心原则

> **事实要稳，评论要散，规则要硬，用途要分**

## World Facts（世界事实）

### 数据特征
- ✅ 客观事实，无主观评价
- ✅ 实体级粒度（一个实体一条记录）
- ✅ 文本表述稳定
- ✅ 包含空间位置、所属关系等结构化信息

### 存储内容
- 商城实体（Mall、Floor、Area、Store、Product）
- 店铺位置、类别、营业时间
- 商品名称、价格、库存

### 元数据结构
```json
{
  "entityType": "store",
  "entityId": "store-001",
  "mallId": "mall-001",
  "floorId": "floor-001",
  "areaId": "area-A1",
  "category": "服装",
  "position": { "x": 10, "y": 0, "z": 10 }
}
```

### 使用场景
- ✅ 导航决策："Nike 店在哪？"
- ✅ 位置查询："二楼有哪些店？"
- ✅ 商品查找："哪里有红色连衣裙？"

### 约束
- ❌ 不包含用户评价
- ❌ 不包含主观描述
- ✅ 实体变更时同步更新

## Reviews（用户评论）

### 数据特征
- ✅ 主观评价，有情感倾向
- ✅ 评论级粒度（一条评论一条记录）
- ✅ 允许观点冲突
- ✅ 包含评分、时间等信息

### 存储内容
- 用户对店铺的评价
- 用户对商品的评价
- 服务体验、环境评价

### 元数据结构
```json
{
  "reviewId": "review-001",
  "storeId": "store-001",
  "productId": "product-001",
  "rating": 4.5,
  "sentiment": "positive",
  "aspects": ["服务", "环境"],
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### 使用场景
- ✅ 体验问题："这家店好不好？"
- ✅ 推荐问题："值不值得买？"
- ✅ 对比问题："哪家店评价更好？"

### 约束
- ❌ 不用于 Action 决策
- ❌ 不作为单一结论
- ✅ 返回多元观点
- ✅ 明确标注数据来源

## Rules（规则指南）

### 数据特征
- ✅ 明确、可执行
- ✅ 近指令式表述
- ✅ 有优先级（CRITICAL / HIGH / NORMAL）
- ✅ 有作用域（global / mall / area）

### 存储内容
- 导航约束："未开放区域禁止导航"
- 编辑约束："不可超出授权区域边界"
- 安全规则："禁止删除其他商家的对象"

### 元数据结构
```json
{
  "ruleType": "navigation",
  "scope": "mall",
  "scopeId": "mall-001",
  "priority": "CRITICAL",
  "isActive": true
}
```

### 使用场景
- ✅ Agent 决策前校验
- ✅ 行为约束检查
- ✅ 安全边界保护

### 约束
- ✅ CRITICAL 优先级规则必须强制遵守
- ✅ 规则冲突时，高优先级优先
- ❌ 不可被 Agent 忽略

## 用途隔离约束

### 导航决策

```python
# ✅ 正确：只用 world_facts + rules
async def handle_navigation(query: str):
    facts = await rag.search_world_facts(query)
    rules = await rag.search_rules(query, rule_type="navigation")
    
    # 检查规则约束
    if has_critical_rule_violation(rules):
        return handle_rule_constraint(rules[0])
    
    # 基于事实生成 Action
    return generate_navigation_action(facts)

# ❌ 错误：使用 reviews 做决策
async def handle_navigation(query: str):
    reviews = await rag.search_reviews(query)  # ❌
    return generate_action_from_reviews(reviews)  # ❌
```

### 评价问题

```python
# ✅ 正确：只用 reviews
async def handle_evaluation(query: str):
    reviews = await rag.search_reviews(query)
    return {
        "type": "evaluation_response",
        "sources": reviews,
        "disclaimer": "以上信息来自用户评价，仅供参考"
    }

# ❌ 错误：用 world_facts 回答主观问题
async def handle_evaluation(query: str):
    facts = await rag.search_world_facts(query)  # ❌
    return generate_subjective_answer(facts)  # ❌
```

### 综合回答

```python
# ✅ 正确：多路检索，明确标注来源
async def handle_complex_query(query: str):
    facts = await rag.search_world_facts(query)
    reviews = await rag.search_reviews(query)
    
    return {
        "objective_info": {
            "source": "world_facts",
            "data": facts
        },
        "user_opinions": {
            "source": "reviews",
            "data": reviews
        }
    }
```

## 数据同步约束

### 同步原则

1. **关系数据库为单一事实源（SSOT）**
2. **向量数据库异步同步**
3. **同步失败必须记录并重试**

### 同步流程

```
关系数据库变更
  ↓
触发领域事件
  ↓
异步同步到向量数据库
  ↓
同步失败 → 记录日志 + 重试
```

### 同步约束

```java
// ✅ 正确：事件驱动同步
@Transactional
public Store createStore(Store store) {
    // 1. 保存到关系数据库
    storeRepository.save(store);
    
    // 2. 发布领域事件
    eventPublisher.publish(new StoreCreatedEvent(store));
    
    return store;
}

// 事件监听器异步同步
@EventListener
@Async
public void onStoreCreated(StoreCreatedEvent event) {
    ragSyncService.syncStoreToWorldFacts(event.getStore());
}
```

### 一致性检查

```python
# 定期检查数据一致性
async def check_consistency():
    # 1. 从关系数据库获取实体列表
    stores_in_db = await db.get_all_stores()
    
    # 2. 从向量数据库获取实体列表
    stores_in_vector = await vector_db.get_all_stores()
    
    # 3. 对比差异
    missing = set(stores_in_db) - set(stores_in_vector)
    
    # 4. 修复不一致
    for store_id in missing:
        await sync_store_to_vector(store_id)
```

## UI 展示约束

### 来源标注

```typescript
// ✅ 正确：明确标注数据来源
interface RAGResult {
  type: 'world_facts' | 'reviews' | 'rules'
  data: any
  source: {
    label: string
    icon: string
    color: string
  }
}

const sourceStyles = {
  world_facts: {
    label: '商城信息',
    icon: 'info-circle',
    color: 'blue'
  },
  reviews: {
    label: '用户评价',
    icon: 'comment',
    color: 'orange'
  },
  rules: {
    label: '系统规则',
    icon: 'shield',
    color: 'red'
  }
}
```

### 展示区分

```vue
<!-- ✅ 正确：区分展示不同类型数据 -->
<template>
  <div class="rag-result">
    <!-- 世界事实：客观信息样式 -->
    <div v-if="result.type === 'world_facts'" class="fact-card">
      <el-tag type="info">商城信息</el-tag>
      <p>{{ result.data.text }}</p>
    </div>
    
    <!-- 用户评论：主观评价样式，带评分 -->
    <div v-if="result.type === 'reviews'" class="review-card">
      <el-tag type="warning">用户评价</el-tag>
      <el-rate :value="result.data.rating" disabled />
      <p>{{ result.data.text }}</p>
    </div>
    
    <!-- 规则：警告样式 -->
    <div v-if="result.type === 'rules'" class="rule-card">
      <el-tag type="danger">系统规则</el-tag>
      <p>{{ result.data.text }}</p>
    </div>
  </div>
</template>
```

## 验证清单

开发时自查：
- [ ] 是否将三类数据存储在不同集合？
- [ ] 导航决策是否只用 world_facts + rules？
- [ ] 评价问题是否只用 reviews？
- [ ] 是否遵守 CRITICAL 规则？
- [ ] 是否明确标注数据来源？
- [ ] 数据变更是否同步到向量数据库？
- [ ] 是否有一致性检查机制？
