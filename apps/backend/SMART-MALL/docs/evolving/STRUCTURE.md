# 后端目录结构说明（STRUCTURE.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：后端目录结构规范
> 
> 本文档为 **目录结构说明文档（Structure Document）**，用于定义代码组织规范与模块职责。

---

## 当前目录结构

```
smart-mall-backend/
├── src/main/java/com/smartmall/
│   ├── SmartMallApplication.java          # 应用入口
│   │
│   ├── application/                        # 应用层
│   │   └── service/
│   │       ├── AuthService.java           # 认证服务
│   │       ├── RegisterService.java       # 注册服务
│   │       ├── PasswordService.java       # 密码服务
│   │       └── MallBuilderService.java    # 商城建模器服务
│   │
│   ├── domain/                             # 领域层
│   │   └── entity/
│   │       ├── User.java                  # 用户实体
│   │       ├── MallProject.java           # 商城项目实体
│   │       ├── Floor.java                 # 楼层实体
│   │       └── Area.java                  # 区域实体
│   │
│   ├── infrastructure/                     # 基础设施层
│   │   ├── config/
│   │   │   ├── SecurityConfig.java        # 安全配置
│   │   │   ├── JwtConfig.java             # JWT 配置
│   │   │   └── CorsConfig.java            # 跨域配置
│   │   ├── mapper/
│   │   │   ├── UserMapper.java            # 用户 Mapper
│   │   │   ├── MallProjectMapper.java     # 项目 Mapper
│   │   │   ├── FloorMapper.java           # 楼层 Mapper
│   │   │   └── AreaMapper.java            # 区域 Mapper
│   │   └── service/
│   │       └── ConsoleEmailService.java   # 邮件服务（控制台实现）
│   │
│   ├── interfaces/                         # 接口层
│   │   ├── controller/
│   │   │   ├── AuthController.java        # 认证控制器
│   │   │   └── MallBuilderController.java # 建模器控制器
│   │   └── dto/
│   │       ├── auth/                      # 认证相关 DTO
│   │       │   ├── LoginRequest.java
│   │       │   ├── LoginResponse.java
│   │       │   ├── RegisterRequest.java
│   │       │   └── ...
│   │       └── mallbuilder/               # 建模器相关 DTO
│   │           ├── CreateProjectRequest.java
│   │           ├── UpdateProjectRequest.java
│   │           ├── ProjectResponse.java
│   │           ├── ProjectListItem.java
│   │           ├── FloorDTO.java
│   │           ├── AreaDTO.java
│   │           ├── OutlineDTO.java
│   │           └── SettingsDTO.java
│   │
│   └── protocol/                           # 协议定义
│       ├── response/
│       │   └── ApiResponse.java           # 统一响应
│       └── errorcode/
│           └── ErrorCode.java             # 错误码
│
└── src/main/resources/
    ├── application.yml                     # 应用配置
    └── mapper/                             # MyBatis XML 映射
```

---

## 模块结构（目标架构）

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
