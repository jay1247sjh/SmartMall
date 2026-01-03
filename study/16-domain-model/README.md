# 领域模型学习指南

## 学习目标

通过本章学习，你将掌握：
- 语义对象（SemanticObject）设计
- 事件总线机制
- 权限模型设计
- 领域驱动设计在前端的应用

---

## 苏格拉底式问答

### 问题 1：什么是语义对象？

**思考**：在 3D 商城建模器中，一个"店铺"应该包含哪些信息？

<details>
<summary>点击查看答案</summary>

语义对象是具有业务含义的对象，不仅仅是几何形状。

```typescript
// 普通 3D 对象
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 0, 0);

// 语义对象
const shop: SemanticObject = {
  id: 'shop-001',
  type: 'SHOP',
  name: '星巴克咖啡',
  geometry: { /* 几何数据 */ },
  properties: {
    category: 'FOOD_BEVERAGE',
    area: 120,
    floor: 1,
    rentPrice: 50000
  }
};
```

语义对象 = 几何信息 + 业务属性

</details>

### 问题 2：为什么需要事件总线？

<details>
<summary>点击查看答案</summary>

**场景**：用户在 3D 场景中点击一个店铺
- 属性面板需要显示店铺信息
- 工具栏需要更新可用操作
- 状态栏需要显示选中状态

**没有事件总线**：
```typescript
// 紧耦合，难以维护
scene.onClick = (object) => {
  propertyPanel.show(object);
  toolbar.update(object);
  statusBar.update(object);
};
```

**使用事件总线**：
```typescript
// 发布事件
eventBus.emit('object:selected', object);

// 各组件独立订阅
propertyPanel.on('object:selected', show);
toolbar.on('object:selected', update);
statusBar.on('object:selected', update);
```

</details>


---

## 核心代码解析

### 1. 语义对象类型定义

```typescript
// domain/semantic-object.ts
export type ObjectType = 
  | 'FLOOR' 
  | 'SHOP' 
  | 'CORRIDOR' 
  | 'ELEVATOR' 
  | 'ESCALATOR'
  | 'RESTROOM'
  | 'ENTRANCE';

export interface SemanticObject {
  id: string;
  type: ObjectType;
  name: string;
  parentId?: string;
  geometry: GeometryData;
  material: MaterialData;
  properties: Record<string, unknown>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface Shop extends SemanticObject {
  type: 'SHOP';
  properties: {
    category: ShopCategory;
    area: number;
    floor: number;
    merchantId?: string;
    rentStatus: 'AVAILABLE' | 'RENTED' | 'RESERVED';
  };
}
```

### 2. 事件总线实现

```typescript
// domain/event-bus.ts
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events = new Map<string, Set<EventHandler>>();
  
  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
    
    // 返回取消订阅函数
    return () => this.off(event, handler);
  }
  
  off(event: string, handler: EventHandler) {
    this.events.get(event)?.delete(handler);
  }
  
  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(handler => handler(...args));
  }
}

export const eventBus = new EventBus();
```

### 3. 权限模型

```typescript
// domain/permission.ts
export type Role = 'ADMIN' | 'MERCHANT' | 'USER';

export type Permission = 
  | 'mall:read'
  | 'mall:write'
  | 'shop:read'
  | 'shop:write'
  | 'user:manage';

export const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: ['mall:read', 'mall:write', 'shop:read', 'shop:write', 'user:manage'],
  MERCHANT: ['mall:read', 'shop:read', 'shop:write'],
  USER: ['mall:read', 'shop:read']
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
```

---

## 延伸阅读

- [领域驱动设计](https://www.domainlanguage.com/ddd/)
- [事件驱动架构](https://martinfowler.com/articles/201701-event-driven.html)
