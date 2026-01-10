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


-- ============================================================================
-- 区域权限管理相关表
-- ============================================================================

-- 为 area 表添加 status 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'area' AND column_name = 'status') THEN
        ALTER TABLE area ADD COLUMN status VARCHAR(20) DEFAULT 'AVAILABLE';
    END IF;
END $$;

-- 创建区域状态索引
CREATE INDEX IF NOT EXISTS idx_area_status ON area(status);

-- 区域权限申请表
CREATE TABLE IF NOT EXISTS area_apply (
    apply_id        VARCHAR(32) PRIMARY KEY,
    area_id         VARCHAR(32) NOT NULL,
    merchant_id     VARCHAR(32) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
    apply_reason    TEXT,
    reject_reason   TEXT,
    approved_at     TIMESTAMP,
    rejected_at     TIMESTAMP,
    approved_by     VARCHAR(32),
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_area_apply_area ON area_apply(area_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_merchant ON area_apply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_status ON area_apply(status);
CREATE INDEX IF NOT EXISTS idx_area_apply_deleted ON area_apply(is_deleted);

-- 防止同一商家对同一区域重复申请（PENDING 状态）
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_apply_unique_pending 
    ON area_apply(area_id, merchant_id) 
    WHERE status = 'PENDING' AND is_deleted = FALSE;

-- 区域权限表
CREATE TABLE IF NOT EXISTS area_permission (
    permission_id   VARCHAR(32) PRIMARY KEY,
    area_id         VARCHAR(32) NOT NULL,
    merchant_id     VARCHAR(32) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, REVOKED, EXPIRED
    granted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMP,
    revoked_by      VARCHAR(32),
    revoke_reason   TEXT,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_area_permission_area ON area_permission(area_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_merchant ON area_permission(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_status ON area_permission(status);
CREATE INDEX IF NOT EXISTS idx_area_permission_deleted ON area_permission(is_deleted);

-- 确保同一区域只有一个 ACTIVE 权限
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_permission_unique_active 
    ON area_permission(area_id) 
    WHERE status = 'ACTIVE' AND is_deleted = FALSE;


-- ============================================================================
-- 店铺管理相关表
-- ============================================================================

-- 店铺表
CREATE TABLE IF NOT EXISTS store (
    store_id        VARCHAR(32) PRIMARY KEY,
    area_id         VARCHAR(32) NOT NULL,
    merchant_id     VARCHAR(32) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    category        VARCHAR(30) NOT NULL,
    business_hours  VARCHAR(50),
    logo            VARCHAR(500),
    cover           VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, ACTIVE, INACTIVE, CLOSED
    close_reason    TEXT,
    approved_at     TIMESTAMP,
    approved_by     VARCHAR(32),
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_store_area ON store(area_id);
CREATE INDEX IF NOT EXISTS idx_store_merchant ON store(merchant_id);
CREATE INDEX IF NOT EXISTS idx_store_status ON store(status);
CREATE INDEX IF NOT EXISTS idx_store_category ON store(category);
CREATE INDEX IF NOT EXISTS idx_store_deleted ON store(is_deleted);

-- 每个区域只能有一个未删除的店铺
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_area_unique 
    ON store(area_id) WHERE is_deleted = FALSE;


-- ============================================================================
-- 商品管理相关表
-- ============================================================================

-- 商品表
CREATE TABLE IF NOT EXISTS product (
    product_id      VARCHAR(32) PRIMARY KEY,
    store_id        VARCHAR(32) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    original_price  DECIMAL(10,2),
    stock           INTEGER NOT NULL DEFAULT 0,
    category        VARCHAR(50),
    image           VARCHAR(500),
    images          JSONB,
    status          VARCHAR(20) NOT NULL DEFAULT 'ON_SALE',  -- ON_SALE, OFF_SALE, SOLD_OUT
    sort_order      INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_product_store ON product(store_id);
CREATE INDEX IF NOT EXISTS idx_product_status ON product(status);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);
CREATE INDEX IF NOT EXISTS idx_product_deleted ON product(is_deleted);


-- ============================================================================
-- 测试数据
-- ============================================================================

-- 插入测试商城项目
INSERT INTO mall_project (project_id, name, description, outline, creator_id) VALUES
('proj_001', '智慧商城一期', '智慧商城一期项目', '{"type":"Polygon","coordinates":[[[0,0],[100,0],[100,100],[0,100],[0,0]]]}', '1')
ON CONFLICT (project_id) DO NOTHING;

-- 插入测试楼层
INSERT INTO floor (floor_id, project_id, name, level, height, sort_order) VALUES
('floor_001', 'proj_001', '一楼', 1, 4.5, 1),
('floor_002', 'proj_001', '二楼', 2, 4.0, 2),
('floor_003', 'proj_001', '三楼', 3, 4.0, 3)
ON CONFLICT (floor_id) DO NOTHING;

-- 插入测试区域
INSERT INTO area (area_id, floor_id, name, type, shape, status) VALUES
('area_001', 'floor_001', 'A101', 'retail', '{"type":"Polygon","coordinates":[[[0,0],[20,0],[20,20],[0,20],[0,0]]]}', 'AVAILABLE'),
('area_002', 'floor_001', 'A102', 'retail', '{"type":"Polygon","coordinates":[[[25,0],[45,0],[45,20],[25,20],[25,0]]]}', 'AVAILABLE'),
('area_003', 'floor_001', 'A103', 'food', '{"type":"Polygon","coordinates":[[[50,0],[70,0],[70,20],[50,20],[50,0]]]}', 'AVAILABLE'),
('area_004', 'floor_002', 'B201', 'retail', '{"type":"Polygon","coordinates":[[[0,0],[20,0],[20,20],[0,20],[0,0]]]}', 'AVAILABLE'),
('area_005', 'floor_002', 'B202', 'service', '{"type":"Polygon","coordinates":[[[25,0],[45,0],[45,20],[25,20],[25,0]]]}', 'AVAILABLE')
ON CONFLICT (area_id) DO NOTHING;

-- 插入测试区域申请记录
INSERT INTO area_apply (apply_id, area_id, merchant_id, status, apply_reason, created_at) VALUES
('apply_001', 'area_001', '2', 'PENDING', '希望开设服装店，位置优越，人流量大', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('apply_002', 'area_003', '2', 'PENDING', '计划开设餐饮店，该区域适合餐饮业态', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('apply_003', 'area_004', '2', 'APPROVED', '开设数码产品店', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (apply_id) DO NOTHING;

-- 更新已通过申请的审批信息
UPDATE area_apply SET approved_at = CURRENT_TIMESTAMP - INTERVAL '3 days', approved_by = '1' WHERE apply_id = 'apply_003' AND status = 'APPROVED';
