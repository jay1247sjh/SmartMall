# Smart Mall 基础设施

本目录包含 Smart Mall 项目的 Docker 基础设施配置。

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │  Milvus  │  │  MinIO   │   │
│  │  :5433   │  │  :6379   │  │  :19530  │  │  :9000   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                    │                        │
│                              ┌──────────┐                   │
│                              │   Etcd   │                   │
│                              │  :2379   │                   │
│                              └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 服务说明

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| PostgreSQL | postgres:15-alpine | 5433:5432 | 主数据库 |
| Redis | redis:7-alpine | 6379:6379 | 缓存 |
| Milvus | milvusdb/milvus:v2.3.3 | 19530:19530 | 向量数据库（RAG） |
| MinIO | minio/minio | 9000/9001 | 对象存储（Milvus 依赖） |
| Etcd | quay.io/coreos/etcd:v3.5.5 | 2379 | 元数据存储（Milvus 依赖） |

## 快速启动

### 仅启动核心服务（开发推荐）

```bash
cd infra
docker-compose up -d postgres redis
```

### 启动全部服务（含 AI 向量库）

```bash
cd infra
docker-compose up -d
```

### 查看服务状态

```bash
docker-compose ps
```

## 数据库连接

| 参数 | 值 |
|------|------|
| Host | localhost |
| Port | **5433**（非默认 5432） |
| Database | smartmall |
| Username | smartmall |
| Password | smartmall123 |

### JDBC 连接字符串

```
jdbc:postgresql://localhost:5433/smartmall
```

### 命令行连接

```bash
docker exec -it smartmall-postgres psql -U smartmall -d smartmall
```

## Redis 连接

| 参数 | 值 |
|------|------|
| Host | localhost |
| Port | 6379 |

```bash
docker exec -it smartmall-redis redis-cli
```

## Milvus 向量数据库

用于 AI 智能导购的 RAG 知识库。

| 参数 | 值 |
|------|------|
| gRPC 端口 | 19530 |
| Metrics 端口 | 9091 |

### Python 连接示例

```python
from pymilvus import connections

connections.connect(
    alias="default",
    host="localhost",
    port="19530"
)
```

## MinIO 对象存储

Milvus 的依赖服务，用于存储向量数据。

| 参数 | 值 |
|------|------|
| API 端口 | 9000 |
| Console 端口 | 9001 |
| Access Key | minioadmin |
| Secret Key | minioadmin |

访问 MinIO Console：http://localhost:9001

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | ADMIN |
| merchant | 123456 | MERCHANT |
| user | 123456 | USER |

## 常用命令

```bash
# 启动服务
docker-compose up -d

# 启动指定服务
docker-compose up -d postgres redis

# 查看日志
docker-compose logs -f
docker-compose logs -f postgres

# 停止服务
docker-compose down

# 停止并删除数据卷（重置数据）
docker-compose down -v

# 重建数据库
docker-compose down -v
docker-compose up -d postgres redis
```

## 数据卷

| 卷名 | 说明 |
|------|------|
| postgres_data | PostgreSQL 数据 |
| redis_data | Redis 持久化数据 |
| milvus_data | Milvus 向量数据 |
| minio_data | MinIO 对象存储 |
| etcd_data | Etcd 元数据 |

## 初始化脚本

`init-db/` 目录下的 SQL 脚本会在 PostgreSQL 首次启动时自动执行，用于：

- 创建数据库表结构
- 插入测试账号
- 初始化基础数据

## 故障排查

### PostgreSQL 连接失败

```bash
# 检查容器状态
docker-compose ps postgres

# 查看日志
docker-compose logs postgres

# 检查端口占用
netstat -an | findstr 5433
```

### Milvus 启动失败

Milvus 依赖 Etcd 和 MinIO，确保它们先启动：

```bash
docker-compose up -d etcd minio
# 等待健康检查通过
docker-compose up -d milvus
```

### 重置所有数据

```bash
docker-compose down -v
docker-compose up -d
```
