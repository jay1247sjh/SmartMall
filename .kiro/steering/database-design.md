---
inclusion: fileMatch
fileMatchPattern: "**/*.sql"
---

# 数据库设计约束

## 表设计规范

### 命名规范
- 表名使用小写 + 下划线（snake_case）
- 字段名使用小写 + 下划线
- 主键命名：`{table_name}_id`

### 必备字段
所有表必须包含以下字段：
```sql
create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
is_deleted BOOLEAN NOT NULL DEFAULT FALSE
version INT NOT NULL DEFAULT 0
```

### 软删除
- 使用 `is_deleted` 字段实现软删除
- 禁止物理删除数据

### 乐观锁
- 使用 `version` 字段实现乐观锁
- 更新时自动递增 version

## 通用触发器

### 自动更新时间戳

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 使用示例
CREATE TRIGGER trigger_table_update_time 
BEFORE UPDATE ON table_name 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

### 自动递增版本号

```sql
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 使用示例
CREATE TRIGGER trigger_table_version 
BEFORE UPDATE ON table_name 
FOR EACH ROW EXECUTE FUNCTION increment_version();
```

## 外键策略

### 逻辑外键
- 采用逻辑外键，不使用物理外键约束
- 外键引用有效性由应用层校验
- 级联操作由应用层事务保证

```sql
-- ✅ 正确：逻辑外键
CREATE TABLE mall_store (
    store_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,  -- 逻辑外键
    area_id VARCHAR(32) NOT NULL   -- 逻辑外键
);

-- ❌ 错误：物理外键
CREATE TABLE mall_store (
    store_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    FOREIGN KEY (mall_id) REFERENCES mall(mall_id)  -- ❌
);
```

## 索引设计

### 索引原则
- 主键自动创建索引
- 外键字段创建索引
- 常用查询条件创建索引
- 联合索引遵循最左前缀原则

### 索引示例

```sql
-- 单列索引
CREATE INDEX idx_store_mall_id ON mall_store(mall_id);

-- 联合索引
CREATE INDEX idx_floor_mall_floor ON mall_floor(mall_id, floor_index);

-- 条件索引
CREATE INDEX idx_store_active ON mall_store(status) WHERE is_deleted = FALSE;
```

## PostgreSQL 特性

### JSONB 类型
- 使用 JSONB 存储 JSON 数据
- 支持索引和查询

```sql
CREATE TABLE mall (
    mall_id VARCHAR(32) PRIMARY KEY,
    config JSONB,
    location_meta JSONB
);

-- JSONB 索引
CREATE INDEX idx_mall_config ON mall USING GIN (config);
```

### 时间类型
- 使用 TIMESTAMPTZ 存储时间（带时区）

```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
```

## 表结构示例

```sql
CREATE TABLE mall_store (
    store_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 索引
CREATE INDEX idx_store_mall_id ON mall_store(mall_id);
CREATE INDEX idx_store_area_id ON mall_store(area_id);
CREATE INDEX idx_store_merchant_id ON mall_store(merchant_id);

-- 触发器
CREATE TRIGGER trigger_store_update_time 
BEFORE UPDATE ON mall_store 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_store_version 
BEFORE UPDATE ON mall_store 
FOR EACH ROW EXECUTE FUNCTION increment_version();
```

## 验证清单

- [ ] 表名是否使用小写 + 下划线？
- [ ] 是否包含必备字段（create_time, update_time, is_deleted, version）？
- [ ] 是否使用逻辑外键而非物理外键？
- [ ] 是否为常用查询字段创建索引？
- [ ] 是否添加了 update_time 和 version 触发器？
- [ ] 是否使用 TIMESTAMPTZ 存储时间？
