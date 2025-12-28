-- 智能商城导购系统数据库初始化脚本
-- PostgreSQL 15+

-- 创建自动更新 update_time 的触发器函数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建自动递增 version 的触发器函数（乐观锁）
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
    user_id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    user_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email VARCHAR(100),
    phone VARCHAR(20),
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_time TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_type ON "user"(user_type);

DROP TRIGGER IF EXISTS trigger_user_update_time ON "user";
CREATE TRIGGER trigger_user_update_time BEFORE UPDATE ON "user" 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 商城表
CREATE TABLE IF NOT EXISTS mall (
    mall_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_meta JSONB,
    current_layout_version VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_mall_status ON mall(status);

DROP TRIGGER IF EXISTS trigger_mall_update_time ON mall;
CREATE TRIGGER trigger_mall_update_time BEFORE UPDATE ON mall 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 楼层表
CREATE TABLE IF NOT EXISTS mall_floor (
    floor_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    floor_index INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    height NUMERIC(10,2),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_floor_mall_id ON mall_floor(mall_id);

DROP TRIGGER IF EXISTS trigger_floor_update_time ON mall_floor;
CREATE TRIGGER trigger_floor_update_time BEFORE UPDATE ON mall_floor 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 区域表
CREATE TABLE IF NOT EXISTS mall_area (
    area_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    floor_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    area_type VARCHAR(20) NOT NULL,
    geometry JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
    authorized_merchant_id VARCHAR(32),
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_area_mall_id ON mall_area(mall_id);
CREATE INDEX IF NOT EXISTS idx_area_floor_id ON mall_area(floor_id);
CREATE INDEX IF NOT EXISTS idx_area_status ON mall_area(status);

DROP TRIGGER IF EXISTS trigger_area_update_time ON mall_area;
CREATE TRIGGER trigger_area_update_time BEFORE UPDATE ON mall_area 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 商家信息表
CREATE TABLE IF NOT EXISTS merchant (
    merchant_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL UNIQUE,
    company_name VARCHAR(200) NOT NULL,
    business_license VARCHAR(100),
    contact_person VARCHAR(50),
    contact_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_merchant_user_id ON merchant(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_status ON merchant(status);

DROP TRIGGER IF EXISTS trigger_merchant_update_time ON merchant;
CREATE TRIGGER trigger_merchant_update_time BEFORE UPDATE ON merchant 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 店铺表
CREATE TABLE IF NOT EXISTS mall_store (
    store_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    logo_url VARCHAR(500),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    rotation_x NUMERIC(10,4),
    rotation_y NUMERIC(10,4),
    rotation_z NUMERIC(10,4),
    size_x NUMERIC(10,2),
    size_y NUMERIC(10,2),
    size_z NUMERIC(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    config JSONB,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_store_mall_id ON mall_store(mall_id);
CREATE INDEX IF NOT EXISTS idx_store_area_id ON mall_store(area_id);
CREATE INDEX IF NOT EXISTS idx_store_merchant_id ON mall_store(merchant_id);

DROP TRIGGER IF EXISTS trigger_store_update_time ON mall_store;
CREATE TRIGGER trigger_store_update_time BEFORE UPDATE ON mall_store 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 商品表
CREATE TABLE IF NOT EXISTS mall_product (
    product_id VARCHAR(32) PRIMARY KEY,
    store_id VARCHAR(32) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    position_x NUMERIC(10,2),
    position_y NUMERIC(10,2),
    position_z NUMERIC(10,2),
    attributes JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_product_store_id ON mall_product(store_id);

DROP TRIGGER IF EXISTS trigger_product_update_time ON mall_product;
CREATE TRIGGER trigger_product_update_time BEFORE UPDATE ON mall_product 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 区域权限表
CREATE TABLE IF NOT EXISTS mall_area_permission (
    permission_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    grant_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    granted_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    granted_by VARCHAR(32) NOT NULL,
    revoked_by VARCHAR(32),
    revoke_reason VARCHAR(500),
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (area_id, merchant_id)
);
CREATE INDEX IF NOT EXISTS idx_permission_area_id ON mall_area_permission(area_id);
CREATE INDEX IF NOT EXISTS idx_permission_merchant_id ON mall_area_permission(merchant_id);

DROP TRIGGER IF EXISTS trigger_permission_update_time ON mall_area_permission;
CREATE TRIGGER trigger_permission_update_time BEFORE UPDATE ON mall_area_permission 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 区域申请表
CREATE TABLE IF NOT EXISTS area_apply (
    apply_id VARCHAR(32) PRIMARY KEY,
    mall_id VARCHAR(32) NOT NULL,
    floor_id VARCHAR(32) NOT NULL,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    apply_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    reviewer_id VARCHAR(32),
    review_comment TEXT,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_apply_merchant_id ON area_apply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_apply_area_id ON area_apply(area_id);
CREATE INDEX IF NOT EXISTS idx_apply_status ON area_apply(status);

DROP TRIGGER IF EXISTS trigger_apply_update_time ON area_apply;
CREATE TRIGGER trigger_apply_update_time BEFORE UPDATE ON area_apply 
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO "user" (user_id, username, password_hash, user_type, status)
VALUES ('1', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'ADMIN', 'ACTIVE')
ON CONFLICT (username) DO NOTHING;
