-- ============================================================
-- Smart Mall 数据库初始化脚本（完整版）
-- PostgreSQL 15
-- 包含所有表、索引、函数、触发器、种子数据
-- ============================================================

-- ============================================================
-- 1. 通用函数
-- ============================================================

-- 自动更新时间戳
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_time = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动递增版本号
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. 用户表
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON "user"(email) WHERE is_deleted = FALSE;


-- ============================================================
-- 3. 商城项目表
-- ============================================================

CREATE TABLE IF NOT EXISTS mall_project (
    project_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    outline JSONB NOT NULL,
    settings JSONB,
    metadata JSONB,
    creator_id VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mall_project_creator ON mall_project(creator_id);
CREATE INDEX IF NOT EXISTS idx_mall_project_deleted ON mall_project(is_deleted);
CREATE INDEX IF NOT EXISTS idx_mall_project_status ON mall_project(status) WHERE is_deleted = FALSE;

-- ============================================================
-- 4. 楼层表
-- ============================================================

CREATE TABLE IF NOT EXISTS floor (
    floor_id VARCHAR(32) PRIMARY KEY,
    project_id VARCHAR(32) NOT NULL,
    name VARCHAR(50) NOT NULL,
    level INTEGER NOT NULL,
    height NUMERIC DEFAULT 4,
    shape JSONB,
    inherit_outline BOOLEAN DEFAULT TRUE,
    color VARCHAR(20),
    visible BOOLEAN DEFAULT TRUE,
    locked BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_floor_project ON floor(project_id);
CREATE INDEX IF NOT EXISTS idx_floor_deleted ON floor(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_project_level ON floor(project_id, level) WHERE is_deleted = FALSE;

-- ============================================================
-- 5. 区域表
-- ============================================================

CREATE TABLE IF NOT EXISTS area (
    area_id VARCHAR(32) PRIMARY KEY,
    floor_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    shape JSONB NOT NULL,
    color VARCHAR(20),
    properties JSONB,
    merchant_id VARCHAR(32),
    rental JSONB,
    visible BOOLEAN DEFAULT TRUE,
    locked BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    doors JSONB,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON COLUMN area.doors IS '门定义列表（JSONB 数组），存储区域的门位置和属性信息';

CREATE INDEX IF NOT EXISTS idx_area_floor ON area(floor_id);
CREATE INDEX IF NOT EXISTS idx_area_type ON area(type);
CREATE INDEX IF NOT EXISTS idx_area_status ON area(status);
CREATE INDEX IF NOT EXISTS idx_area_merchant ON area(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_deleted ON area(is_deleted);


-- ============================================================
-- 6. 区域申请表
-- ============================================================

CREATE TABLE IF NOT EXISTS area_apply (
    apply_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    apply_reason TEXT,
    reject_reason TEXT,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    approved_by VARCHAR(32),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_area_apply_area ON area_apply(area_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_merchant ON area_apply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_status ON area_apply(status);
CREATE INDEX IF NOT EXISTS idx_area_apply_deleted ON area_apply(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_apply_unique_pending ON area_apply(area_id, merchant_id) WHERE status = 'PENDING' AND is_deleted = FALSE;

-- ============================================================
-- 7. 区域权限表
-- ============================================================

CREATE TABLE IF NOT EXISTS area_permission (
    permission_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by VARCHAR(32),
    revoke_reason TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_area_permission_area ON area_permission(area_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_merchant ON area_permission(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_status ON area_permission(status);
CREATE INDEX IF NOT EXISTS idx_area_permission_deleted ON area_permission(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_permission_unique_active ON area_permission(area_id) WHERE status = 'ACTIVE' AND is_deleted = FALSE;

-- ============================================================
-- 8. 区域建模提案表
-- ============================================================

CREATE TABLE IF NOT EXISTS layout_proposal (
    proposal_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    layout_data JSONB NOT NULL,
    submit_note TEXT,
    reviewed_by VARCHAR(32),
    reviewed_at TIMESTAMP,
    reject_reason TEXT,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_layout_proposal_area ON layout_proposal(area_id);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_merchant ON layout_proposal(merchant_id);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_status ON layout_proposal(status);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_deleted ON layout_proposal(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_layout_proposal_unique_active
    ON layout_proposal(area_id, merchant_id)
    WHERE is_deleted = FALSE;

-- ============================================================
-- 9. 导航动态事件表
-- ============================================================

CREATE TABLE IF NOT EXISTS navigation_dynamic_event (
    event_id VARCHAR(32) PRIMARY KEY,
    project_id VARCHAR(32) NOT NULL,
    event_type VARCHAR(16) NOT NULL,
    scope_type VARCHAR(16) NOT NULL,
    scope_id VARCHAR(64) NOT NULL,
    severity VARCHAR(16),
    cost_multiplier NUMERIC(6,3),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    reason VARCHAR(255),
    created_by VARCHAR(32) NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_nav_event_project_status
    ON navigation_dynamic_event(project_id, status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_nav_event_scope
    ON navigation_dynamic_event(scope_type, scope_id, status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_nav_event_time
    ON navigation_dynamic_event(starts_at, ends_at, status);

-- ============================================================
-- 10. 商城表
-- ============================================================

CREATE TABLE IF NOT EXISTS mall (
    mall_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location_meta JSONB,
    current_layout_version VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    config JSONB,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mall_status ON mall(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mall_deleted ON mall(is_deleted);


-- ============================================================
-- 11. 布局版本表
-- ============================================================

CREATE TABLE IF NOT EXISTS layout_version (
    version_id VARCHAR(32) PRIMARY KEY,
    version_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    description TEXT,
    snapshot_data JSONB NOT NULL,
    source_project_id VARCHAR(32) NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    change_count INTEGER DEFAULT 0,
    creator_id VARCHAR(32) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_layout_version_source ON layout_version(source_project_id);
CREATE INDEX IF NOT EXISTS idx_layout_version_creator ON layout_version(creator_id);
CREATE INDEX IF NOT EXISTS idx_layout_version_status ON layout_version(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_layout_version_created ON layout_version(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layout_version_deleted ON layout_version(is_deleted);

-- ============================================================
-- 12. 店铺表
-- ============================================================

CREATE TABLE IF NOT EXISTS store (
    store_id VARCHAR(32) PRIMARY KEY,
    area_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    business_hours VARCHAR(50),
    logo VARCHAR(500),
    cover VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    close_reason TEXT,
    approved_at TIMESTAMP,
    approved_by VARCHAR(32),
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_store_area ON store(area_id);
CREATE INDEX IF NOT EXISTS idx_store_merchant ON store(merchant_id);
CREATE INDEX IF NOT EXISTS idx_store_category ON store(category);
CREATE INDEX IF NOT EXISTS idx_store_status ON store(status);
CREATE INDEX IF NOT EXISTS idx_store_deleted ON store(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_area_unique ON store(area_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 13. 商品表
-- ============================================================

CREATE TABLE IF NOT EXISTS product (
    product_id VARCHAR(32) PRIMARY KEY,
    store_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(50),
    image VARCHAR(500),
    images JSONB,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_SALE',
    sort_order INTEGER DEFAULT 0,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_store ON product(store_id);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);
CREATE INDEX IF NOT EXISTS idx_product_status ON product(status);
CREATE INDEX IF NOT EXISTS idx_product_deleted ON product(is_deleted);

ALTER TABLE product ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- 13.1 商品评价表
-- ============================================================

CREATE TABLE IF NOT EXISTS product_review (
    review_id VARCHAR(32) PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL,
    store_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_review_product ON product_review(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_store ON product_review(store_id);
CREATE INDEX IF NOT EXISTS idx_product_review_user ON product_review(user_id);
CREATE INDEX IF NOT EXISTS idx_product_review_rating ON product_review(rating);
CREATE INDEX IF NOT EXISTS idx_product_review_deleted ON product_review(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_review_product_user
    ON product_review(product_id, user_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 13.2 商品评价回复表
-- ============================================================

CREATE TABLE IF NOT EXISTS product_review_reply (
    reply_id VARCHAR(32) PRIMARY KEY,
    review_id VARCHAR(32) NOT NULL,
    merchant_id VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_review_reply_review ON product_review_reply(review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_reply_merchant ON product_review_reply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_product_review_reply_deleted ON product_review_reply(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_review_reply_review
    ON product_review_reply(review_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 14. 系统公告表
-- ============================================================

CREATE TABLE IF NOT EXISTS notice (
    notice_id VARCHAR(32) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notice_active ON notice(is_active) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notice_active_published ON notice(is_active, published_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notice_deleted ON notice(is_deleted);

-- ============================================================
-- 15. 用户收藏店铺表
-- ============================================================

CREATE TABLE IF NOT EXISTS user_favorite_store (
    favorite_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    store_id VARCHAR(32) NOT NULL,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_user ON user_favorite_store(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_store ON user_favorite_store(store_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_deleted ON user_favorite_store(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorite_unique_active
    ON user_favorite_store(user_id, store_id) WHERE is_deleted = FALSE;

-- ============================================================
-- 16. 用户浏览记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS user_browse_history (
    history_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    store_id VARCHAR(32) NOT NULL,
    browse_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_browse_user ON user_browse_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_browse_store ON user_browse_history(store_id);
CREATE INDEX IF NOT EXISTS idx_user_browse_browse_at ON user_browse_history(browse_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_browse_deleted ON user_browse_history(is_deleted);

-- ============================================================
-- 17. 用户订单表（MVP）
-- ============================================================

CREATE TABLE IF NOT EXISTS user_order (
    order_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    store_id VARCHAR(32),
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_order_user ON user_order(user_id);
CREATE INDEX IF NOT EXISTS idx_user_order_status ON user_order(status);
CREATE INDEX IF NOT EXISTS idx_user_order_deleted ON user_order(is_deleted);
CREATE INDEX IF NOT EXISTS idx_user_order_created ON user_order(created_at DESC);

-- ============================================================
-- 18. 用户优惠券表（MVP）
-- ============================================================

CREATE TABLE IF NOT EXISTS user_coupon (
    coupon_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    coupon_name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'AMOUNT',
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UNUSED',
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_coupon_user ON user_coupon(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_status ON user_coupon(status);
CREATE INDEX IF NOT EXISTS idx_user_coupon_expires ON user_coupon(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_coupon_deleted ON user_coupon(is_deleted);

-- ============================================================
-- 19. 用户偏好表
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    preference_key VARCHAR(64) NOT NULL,
    preference_value TEXT NOT NULL,
    source_session_id VARCHAR(64),
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_preferences_user_key
    ON user_preferences(user_id, preference_key) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
    ON user_preferences(user_id) WHERE is_deleted = FALSE;

CREATE TRIGGER trigger_user_preferences_update_time
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_user_preferences_version
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================
-- 20. 同步事件日志表
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_event_log (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(16) NOT NULL,
    operation VARCHAR(8) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'processed',
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    processed_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 0,
    create_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_sync_event_log_event_id
    ON sync_event_log(event_id);
CREATE INDEX IF NOT EXISTS idx_sync_event_log_status
    ON sync_event_log(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_sync_event_log_entity
    ON sync_event_log(entity_type, entity_id) WHERE is_deleted = FALSE;

CREATE TRIGGER trigger_sync_event_log_update_time
    BEFORE UPDATE ON sync_event_log
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_sync_event_log_version
    BEFORE UPDATE ON sync_event_log
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================
-- 21. 种子数据
-- ============================================================

-- 测试用户（密码都是 123456，BCrypt cost=10）
INSERT INTO "user" (user_id, username, password_hash, user_type, status, email) VALUES
('1', 'admin', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'ADMIN', 'ACTIVE', 'admin@smartmall.com'),
('2', 'merchant', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'MERCHANT', 'ACTIVE', 'merchant@smartmall.com'),
('3', 'user', '$2a$10$gdxMG/ifeMsv3YDGkqIEAeb8Ewno/Sn.1l.0CE6JaARmOSlaBr6wC', 'USER', 'ACTIVE', 'user@smartmall.com')
ON CONFLICT (user_id) DO NOTHING;
