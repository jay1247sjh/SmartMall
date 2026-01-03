# Smart Mall 基础设施

## 快速启动

```bash
cd infra
docker-compose up -d
```

## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

## 数据库连接

- Host: localhost
- Port: 5432
- Database: smartmall
- Username: smartmall
- Password: smartmall123

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

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 停止并删除数据
docker-compose down -v

# 重建数据库
docker-compose down -v
docker-compose up -d
```

## 连接数据库

```bash
docker exec -it smartmall-postgres psql -U smartmall -d smartmall
```
