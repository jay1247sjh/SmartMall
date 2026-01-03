-- Smart Mall 数据库初始化脚本
-- PostgreSQL

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
    user_id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email VARCHAR(100),
    phone VARCHAR(20),
    last_login_time TIMESTAMP,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status);

-- 插入测试用户（密码都是 123456）
-- BCrypt hash for '123456' (cost=10) - 使用 Python bcrypt 生成，已验证可用
INSERT INTO "user" (user_id, username, password_hash, user_type, status, email) VALUES
('1', 'admin', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'ADMIN', 'ACTIVE', 'admin@smartmall.com'),
('2', 'merchant', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'MERCHANT', 'ACTIVE', 'merchant@smartmall.com'),
('3', 'user', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'USER', 'ACTIVE', 'user@smartmall.com')
ON CONFLICT (user_id) DO NOTHING;


-- ============================================================================
-- 商城建模器相关表
-- ============================================================================

-- 商城项目表
CREATE TABLE IF NOT EXISTS mall_project (
    project_id      VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    outline         JSONB NOT NULL,           -- 商城轮廓多边形
    settings        JSONB,                    -- 项目设置
    metadata        JSONB,                    -- 元数据
    creator_id      VARCHAR(32) NOT NULL,     -- 创建者
    version         INTEGER DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mall_project_creator ON mall_project(creator_id);
CREATE INDEX IF NOT EXISTS idx_mall_project_deleted ON mall_project(is_deleted);

-- 楼层表
CREATE TABLE IF NOT EXISTS floor (
    floor_id        VARCHAR(32) PRIMARY KEY,
    project_id      VARCHAR(32) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    level           INTEGER NOT NULL,         -- 楼层编号（可负数，如 B1=-1）
    height          DECIMAL(10,2) DEFAULT 4,  -- 楼层高度(米)
    shape           JSONB,                    -- 楼层形状(可选，为空则继承商城轮廓)
    inherit_outline BOOLEAN DEFAULT TRUE,
    color           VARCHAR(20),
    visible         BOOLEAN DEFAULT TRUE,
    locked          BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_floor_project ON floor(project_id);
CREATE INDEX IF NOT EXISTS idx_floor_deleted ON floor(is_deleted);

-- 楼层编号唯一约束（同一项目内，未删除的楼层 level 不能重复）
CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_project_level 
    ON floor(project_id, level) WHERE is_deleted = FALSE;

-- 区域表
CREATE TABLE IF NOT EXISTS area (
    area_id         VARCHAR(32) PRIMARY KEY,
    floor_id        VARCHAR(32) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(30) NOT NULL,     -- 区域类型: retail, food, service, etc.
    shape           JSONB NOT NULL,           -- 区域形状多边形
    color           VARCHAR(20),
    properties      JSONB,                    -- 区域属性(面积、周长、租金等)
    merchant_id     VARCHAR(32),              -- 关联商户ID
    rental          JSONB,                    -- 租金信息
    visible         BOOLEAN DEFAULT TRUE,
    locked          BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_area_floor ON area(floor_id);
CREATE INDEX IF NOT EXISTS idx_area_type ON area(type);
CREATE INDEX IF NOT EXISTS idx_area_merchant ON area(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_deleted ON area(is_deleted);
