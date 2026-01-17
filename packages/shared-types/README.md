# @smart-mall/shared-types

Smart Mall 项目的共享类型定义包，确保前端、后端、AI服务之间的类型一致性。

## 设计目标

- **类型一致性**：跨服务使用相同的枚举值和数据结构
- **低耦合**：各服务可独立使用，不强制依赖
- **高可复用**：提供 TypeScript、Python 两种语言版本
- **JSON Schema**：支持生成 JSON Schema 用于跨语言验证

## 目录结构

```
packages/shared-types/
├── src/                    # TypeScript 源码
│   ├── enums/              # 枚举定义
│   │   ├── user.ts         # 用户相关枚举
│   │   ├── area.ts         # 区域相关枚举
│   │   ├── store.ts        # 店铺相关枚举
│   │   └── product.ts      # 商品相关枚举
│   ├── api/                # API 类型
│   │   └── response.ts     # 统一响应格式
│   ├── models/             # 数据模型
│   │   └── geometry.ts     # 几何类型
│   └── index.ts            # 统一导出
├── python/                 # Python 版本
│   └── smart_mall_types/
│       ├── enums.py
│       ├── models.py
│       └── api.py
├── dist/                   # 编译输出
└── schema.json             # JSON Schema
```

## 包含的类型

### 枚举

| 枚举 | 说明 | 值 |
|------|------|-----|
| UserRole | 用户角色 | ADMIN, MERCHANT, USER |
| UserStatus | 用户状态 | ACTIVE, PENDING, FROZEN, DELETED |
| AreaType | 区域类型 | retail, food, service, anchor, common, ... |
| AreaStatus | 区域状态 | AVAILABLE, LOCKED, PENDING, AUTHORIZED, OCCUPIED |
| StoreStatus | 店铺状态 | PENDING, ACTIVE, INACTIVE, CLOSED |
| ProductStatus | 商品状态 | ON_SALE, OFF_SALE, SOLD_OUT |

### API 类型

- `ApiResponse<T>` - 统一响应格式
- `PageRequest` - 分页请求参数
- `PageResponse<T>` - 分页响应格式
- `ErrorCode` - 错误码枚举

### 几何类型

- `Point2D` / `Point3D` - 点
- `Polygon` - 多边形
- `Rectangle` - 矩形
- `BoundingBox` - 边界盒
- `Transform2D` - 2D 变换

## 使用方式

### TypeScript (前端)

```typescript
import { 
  UserRole, AreaType, StoreStatus,
  AREA_TYPE_NAMES, AREA_TYPE_COLORS,
  type ApiResponse, type PageResponse
} from '@smart-mall/shared-types'

// 使用枚举
const role = UserRole.ADMIN
const areaType = AreaType.RETAIL

// 获取显示名称
console.log(AREA_TYPE_NAMES[areaType]) // 零售店铺

// 获取颜色
console.log(AREA_TYPE_COLORS[areaType]) // #3b82f6
```

### Python (AI 服务)

```python
from smart_mall_types import (
    UserRole, AreaType, StoreStatus,
    AREA_TYPE_NAMES, AREA_TYPE_COLORS,
    ApiResponse, create_success_response
)

# 使用枚举
role = UserRole.ADMIN
area_type = AreaType.RETAIL

# 获取显示名称
print(AREA_TYPE_NAMES[area_type])  # 零售店铺
```

### Java (后端)

后端可以参考此包的枚举定义，保持值的一致性。
建议在后端枚举中添加注释引用此包。

```java
/**
 * 区域类型
 * @see packages/shared-types/src/enums/area.ts
 */
public enum AreaType {
    RETAIL("retail"),
    FOOD("food"),
    // ...
}
```

## 构建

```bash
# TypeScript
cd packages/shared-types
npm install
npm run build

# Python
cd packages/shared-types/python
pip install -e .
```

## 生成 JSON Schema

```bash
npm run build:json-schema
```

生成的 `schema.json` 可用于：
- API 请求/响应验证
- 文档生成
- 跨语言类型检查
