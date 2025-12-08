# 后端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。

---

## 模块结构

```
smart-mall-backend/
├── mall-interface/           # 接口层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── controller/   # REST 控制器
│           ├── dto/          # 数据传输对象
│           └── validator/    # 参数校验
│
├── mall-application/         # 应用层
│   └── src/main/java/
│       └── com/smartmall/
│           └── service/      # 应用服务
│
├── mall-domain/              # 领域层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── entity/       # 实体
│           ├── valueobject/  # 值对象
│           ├── service/      # 领域服务
│           └── repository/   # Repository 接口
│
├── mall-infrastructure/      # 基础设施层
│   └── src/main/java/
│       └── com/smartmall/
│           ├── mapper/       # MyBatis Mapper
│           ├── repository/   # Repository 实现
│           └── config/       # 配置类
│
└── mall-protocol/            # 协议定义
    └── src/main/java/
        └── com/smartmall/
            ├── response/     # 统一响应
            └── errorcode/    # 错误码
```

---

## 依赖关系

```
interface → application → domain ← infrastructure
                ↓
            protocol
```

- 接口层依赖应用层
- 应用层依赖领域层
- 基础设施层实现领域层定义的接口
- 协议层被所有层共享
