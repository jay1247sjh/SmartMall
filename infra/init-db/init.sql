-- ============================================================================
-- Smart Mall 数据库初始化脚本（统一版）
-- PostgreSQL 15
-- ============================================================================

-- ============================================================================
-- 通用触发器函数
-- ============================================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$ LANGUAGE plpgsql;


-- ============================================================================
-- 1. 用户表
-- ============================================================================

CREATE TABLE IF NOT EXISTS "user" (
    user_id         VARCHAR(32) PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    user_type       VARCHAR(20) NOT NULL DEFAULT 'USER',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    email           VARCHAR(100),
    phone           VARCHAR(20),
    last_login_time TIMESTAMP,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_username ON "user"(username);
CREATE INDEX IF NOT EXISTS idx_user_status ON "user"(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON "user"(email) WHERE is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_user_update_time ON "user";
CREATE TRIGGER trigger_user_update_time
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_user_version ON "user";
CREATE TRIGGER trigger_user_version
BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 2. 商城项目表
-- ============================================================================

CREATE TABLE IF NOT EXISTS mall_project (
    project_id      VARCHAR(32) PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    outline         JSONB NOT NULL,
    settings        JSONB,
    metadata        JSONB,
    creator_id      VARCHAR(32) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version         INTEGER DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mall_project_creator ON mall_project(creator_id);
CREATE INDEX IF NOT EXISTS idx_mall_project_deleted ON mall_project(is_deleted);
CREATE INDEX IF NOT EXISTS idx_mall_project_status ON mall_project(status) WHERE is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_mall_project_update_time ON mall_project;
CREATE TRIGGER trigger_mall_project_update_time
BEFORE UPDATE ON mall_project
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_mall_project_version ON mall_project;
CREATE TRIGGER trigger_mall_project_version
BEFORE UPDATE ON mall_project
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 3. 商城表
-- ============================================================================

CREATE TABLE IF NOT EXISTS mall (
    mall_id                 VARCHAR(32) PRIMARY KEY,
    name                    VARCHAR(100) NOT NULL,
    description             TEXT,
    location_meta           JSONB,
    current_layout_version  VARCHAR(32),
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    config                  JSONB,
    version                 INTEGER DEFAULT 0,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_mall_status ON mall(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_mall_deleted ON mall(is_deleted);

-- 触发器
DROP TRIGGER IF EXISTS trigger_mall_update_time ON mall;
CREATE TRIGGER trigger_mall_update_time
BEFORE UPDATE ON mall
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_mall_version ON mall;
CREATE TRIGGER trigger_mall_version
BEFORE UPDATE ON mall
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 4. 楼层表
-- ============================================================================

CREATE TABLE IF NOT EXISTS floor (
    floor_id        VARCHAR(32) PRIMARY KEY,
    project_id      VARCHAR(32) NOT NULL,
    name            VARCHAR(50) NOT NULL,
    level           INTEGER NOT NULL,
    height          DECIMAL(10,2) DEFAULT 4,
    shape           JSONB,
    inherit_outline BOOLEAN DEFAULT TRUE,
    color           VARCHAR(20),
    visible         BOOLEAN DEFAULT TRUE,
    locked          BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_floor_project ON floor(project_id);
CREATE INDEX IF NOT EXISTS idx_floor_deleted ON floor(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_floor_project_level
    ON floor(project_id, level) WHERE is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_floor_update_time ON floor;
CREATE TRIGGER trigger_floor_update_time
BEFORE UPDATE ON floor
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_floor_version ON floor;
CREATE TRIGGER trigger_floor_version
BEFORE UPDATE ON floor
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 5. 区域表
-- ============================================================================

CREATE TABLE IF NOT EXISTS area (
    area_id         VARCHAR(32) PRIMARY KEY,
    floor_id        VARCHAR(32) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    shape           JSONB NOT NULL,
    color           VARCHAR(20),
    properties      JSONB,
    merchant_id     VARCHAR(32),
    rental          JSONB,
    status          VARCHAR(20) DEFAULT 'AVAILABLE',
    visible         BOOLEAN DEFAULT TRUE,
    locked          BOOLEAN DEFAULT FALSE,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_area_floor ON area(floor_id);
CREATE INDEX IF NOT EXISTS idx_area_type ON area(type);
CREATE INDEX IF NOT EXISTS idx_area_merchant ON area(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_status ON area(status);
CREATE INDEX IF NOT EXISTS idx_area_deleted ON area(is_deleted);

-- 触发器
DROP TRIGGER IF EXISTS trigger_area_update_time ON area;
CREATE TRIGGER trigger_area_update_time
BEFORE UPDATE ON area
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_area_version ON area;
CREATE TRIGGER trigger_area_version
BEFORE UPDATE ON area
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 6. 区域权限申请表
-- ============================================================================

CREATE TABLE IF NOT EXISTS area_apply (
    apply_id        VARCHAR(32) PRIMARY KEY,
    area_id         VARCHAR(32) NOT NULL,
    merchant_id     VARCHAR(32) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
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

CREATE INDEX IF NOT EXISTS idx_area_apply_area ON area_apply(area_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_merchant ON area_apply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_apply_status ON area_apply(status);
CREATE INDEX IF NOT EXISTS idx_area_apply_deleted ON area_apply(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_apply_unique_pending
    ON area_apply(area_id, merchant_id)
    WHERE status = 'PENDING' AND is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_area_apply_update_time ON area_apply;
CREATE TRIGGER trigger_area_apply_update_time
BEFORE UPDATE ON area_apply
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_area_apply_version ON area_apply;
CREATE TRIGGER trigger_area_apply_version
BEFORE UPDATE ON area_apply
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 7. 区域权限表
-- ============================================================================

CREATE TABLE IF NOT EXISTS area_permission (
    permission_id   VARCHAR(32) PRIMARY KEY,
    area_id         VARCHAR(32) NOT NULL,
    merchant_id     VARCHAR(32) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    granted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMP,
    revoked_by      VARCHAR(32),
    revoke_reason   TEXT,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_area_permission_area ON area_permission(area_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_merchant ON area_permission(merchant_id);
CREATE INDEX IF NOT EXISTS idx_area_permission_status ON area_permission(status);
CREATE INDEX IF NOT EXISTS idx_area_permission_deleted ON area_permission(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_area_permission_unique_active
    ON area_permission(area_id)
    WHERE status = 'ACTIVE' AND is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_area_permission_update_time ON area_permission;
CREATE TRIGGER trigger_area_permission_update_time
BEFORE UPDATE ON area_permission
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_area_permission_version ON area_permission;
CREATE TRIGGER trigger_area_permission_version
BEFORE UPDATE ON area_permission
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 8. 区域建模提案表
-- ============================================================================

CREATE TABLE IF NOT EXISTS layout_proposal (
    proposal_id      VARCHAR(32) PRIMARY KEY,
    area_id          VARCHAR(32) NOT NULL,
    merchant_id      VARCHAR(32) NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    layout_data      JSONB NOT NULL,
    submit_note      TEXT,
    reviewed_by      VARCHAR(32),
    reviewed_at      TIMESTAMP,
    reject_reason    TEXT,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_layout_proposal_area ON layout_proposal(area_id);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_merchant ON layout_proposal(merchant_id);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_status ON layout_proposal(status);
CREATE INDEX IF NOT EXISTS idx_layout_proposal_deleted ON layout_proposal(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_layout_proposal_unique_active
    ON layout_proposal(area_id, merchant_id) WHERE is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_layout_proposal_update_time ON layout_proposal;
CREATE TRIGGER trigger_layout_proposal_update_time
BEFORE UPDATE ON layout_proposal
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_layout_proposal_version ON layout_proposal;
CREATE TRIGGER trigger_layout_proposal_version
BEFORE UPDATE ON layout_proposal
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 9. 导航动态事件表
-- ============================================================================

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


-- ============================================================================
-- 10. 店铺表
-- ============================================================================

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
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    close_reason    TEXT,
    approved_at     TIMESTAMP,
    approved_by     VARCHAR(32),
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_store_area ON store(area_id);
CREATE INDEX IF NOT EXISTS idx_store_merchant ON store(merchant_id);
CREATE INDEX IF NOT EXISTS idx_store_status ON store(status);
CREATE INDEX IF NOT EXISTS idx_store_category ON store(category);
CREATE INDEX IF NOT EXISTS idx_store_deleted ON store(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_area_unique
    ON store(area_id) WHERE is_deleted = FALSE;

-- 触发器
DROP TRIGGER IF EXISTS trigger_store_update_time ON store;
CREATE TRIGGER trigger_store_update_time
BEFORE UPDATE ON store
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_store_version ON store;
CREATE TRIGGER trigger_store_version
BEFORE UPDATE ON store
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 9. 商品表
-- ============================================================================

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
    rating_avg      NUMERIC(3,2) NOT NULL DEFAULT 0,
    rating_count    INTEGER NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'ON_SALE',
    sort_order      INTEGER DEFAULT 0,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_store ON product(store_id);
CREATE INDEX IF NOT EXISTS idx_product_status ON product(status);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category);
CREATE INDEX IF NOT EXISTS idx_product_deleted ON product(is_deleted);

ALTER TABLE product ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0;
ALTER TABLE product ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;

-- 触发器
DROP TRIGGER IF EXISTS trigger_product_update_time ON product;
CREATE TRIGGER trigger_product_update_time
BEFORE UPDATE ON product
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_product_version ON product;
CREATE TRIGGER trigger_product_version
BEFORE UPDATE ON product
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 9.1 商品评价表
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_review (
    review_id        VARCHAR(32) PRIMARY KEY,
    product_id       VARCHAR(32) NOT NULL,
    store_id         VARCHAR(32) NOT NULL,
    user_id          VARCHAR(32) NOT NULL,
    rating           SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content          TEXT NOT NULL,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_review_product ON product_review(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_store ON product_review(store_id);
CREATE INDEX IF NOT EXISTS idx_product_review_user ON product_review(user_id);
CREATE INDEX IF NOT EXISTS idx_product_review_rating ON product_review(rating);
CREATE INDEX IF NOT EXISTS idx_product_review_deleted ON product_review(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_review_product_user
    ON product_review(product_id, user_id) WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS trigger_product_review_update_time ON product_review;
CREATE TRIGGER trigger_product_review_update_time
BEFORE UPDATE ON product_review
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_product_review_version ON product_review;
CREATE TRIGGER trigger_product_review_version
BEFORE UPDATE ON product_review
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 9.2 商品评价回复表
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_review_reply (
    reply_id         VARCHAR(32) PRIMARY KEY,
    review_id        VARCHAR(32) NOT NULL,
    merchant_id      VARCHAR(32) NOT NULL,
    content          TEXT NOT NULL,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_review_reply_review ON product_review_reply(review_id);
CREATE INDEX IF NOT EXISTS idx_product_review_reply_merchant ON product_review_reply(merchant_id);
CREATE INDEX IF NOT EXISTS idx_product_review_reply_deleted ON product_review_reply(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS uk_product_review_reply_review
    ON product_review_reply(review_id) WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS trigger_product_review_reply_update_time ON product_review_reply;
CREATE TRIGGER trigger_product_review_reply_update_time
BEFORE UPDATE ON product_review_reply
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_product_review_reply_version ON product_review_reply;
CREATE TRIGGER trigger_product_review_reply_version
BEFORE UPDATE ON product_review_reply
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 10. 公告表
-- ============================================================================

CREATE TABLE IF NOT EXISTS notice (
    notice_id       VARCHAR(32) PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    published_at    TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE,
    version         INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_notice_active ON notice(is_active) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_notice_deleted ON notice(is_deleted);

-- 触发器
DROP TRIGGER IF EXISTS trigger_notice_update_time ON notice;
CREATE TRIGGER trigger_notice_update_time
BEFORE UPDATE ON notice
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_notice_version ON notice;
CREATE TRIGGER trigger_notice_version
BEFORE UPDATE ON notice
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 11. 布局版本表
-- ============================================================================

CREATE TABLE IF NOT EXISTS layout_version (
    version_id        VARCHAR(32) PRIMARY KEY,
    version_number    VARCHAR(20) NOT NULL UNIQUE,
    status            VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    description       TEXT,
    snapshot_data     JSONB NOT NULL,
    source_project_id VARCHAR(32) NOT NULL,
    schema_version    INTEGER NOT NULL DEFAULT 1,
    change_count      INTEGER DEFAULT 0,
    creator_id        VARCHAR(32) NOT NULL,
    version           INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_layout_version_status ON layout_version(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_layout_version_source ON layout_version(source_project_id);
CREATE INDEX IF NOT EXISTS idx_layout_version_creator ON layout_version(creator_id);
CREATE INDEX IF NOT EXISTS idx_layout_version_created ON layout_version(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layout_version_deleted ON layout_version(is_deleted);

-- 触发器
DROP TRIGGER IF EXISTS trigger_layout_version_update_time ON layout_version;
CREATE TRIGGER trigger_layout_version_update_time
BEFORE UPDATE ON layout_version
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_layout_version_version ON layout_version;
CREATE TRIGGER trigger_layout_version_version
BEFORE UPDATE ON layout_version
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 12. 用户收藏店铺表
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_favorite_store (
    favorite_id      VARCHAR(32) PRIMARY KEY,
    user_id          VARCHAR(32) NOT NULL,
    store_id         VARCHAR(32) NOT NULL,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_user ON user_favorite_store(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_store ON user_favorite_store(store_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_deleted ON user_favorite_store(is_deleted);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorite_unique_active
    ON user_favorite_store(user_id, store_id) WHERE is_deleted = FALSE;

DROP TRIGGER IF EXISTS trigger_user_favorite_update_time ON user_favorite_store;
CREATE TRIGGER trigger_user_favorite_update_time
BEFORE UPDATE ON user_favorite_store
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_user_favorite_version ON user_favorite_store;
CREATE TRIGGER trigger_user_favorite_version
BEFORE UPDATE ON user_favorite_store
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 13. 用户浏览记录表
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_browse_history (
    history_id       VARCHAR(32) PRIMARY KEY,
    user_id          VARCHAR(32) NOT NULL,
    store_id         VARCHAR(32) NOT NULL,
    browse_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_browse_user ON user_browse_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_browse_store ON user_browse_history(store_id);
CREATE INDEX IF NOT EXISTS idx_user_browse_browse_at ON user_browse_history(browse_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_browse_deleted ON user_browse_history(is_deleted);

DROP TRIGGER IF EXISTS trigger_user_browse_update_time ON user_browse_history;
CREATE TRIGGER trigger_user_browse_update_time
BEFORE UPDATE ON user_browse_history
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_user_browse_version ON user_browse_history;
CREATE TRIGGER trigger_user_browse_version
BEFORE UPDATE ON user_browse_history
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 14. 用户订单表（MVP）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_order (
    order_id         VARCHAR(32) PRIMARY KEY,
    user_id          VARCHAR(32) NOT NULL,
    store_id         VARCHAR(32),
    status           VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_order_user ON user_order(user_id);
CREATE INDEX IF NOT EXISTS idx_user_order_status ON user_order(status);
CREATE INDEX IF NOT EXISTS idx_user_order_deleted ON user_order(is_deleted);
CREATE INDEX IF NOT EXISTS idx_user_order_created ON user_order(created_at DESC);

DROP TRIGGER IF EXISTS trigger_user_order_update_time ON user_order;
CREATE TRIGGER trigger_user_order_update_time
BEFORE UPDATE ON user_order
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_user_order_version ON user_order;
CREATE TRIGGER trigger_user_order_version
BEFORE UPDATE ON user_order
FOR EACH ROW EXECUTE FUNCTION increment_version();

-- ============================================================================
-- 15. 用户优惠券表（MVP）
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_coupon (
    coupon_id        VARCHAR(32) PRIMARY KEY,
    user_id          VARCHAR(32) NOT NULL,
    coupon_name      VARCHAR(100) NOT NULL,
    discount_type    VARCHAR(20) NOT NULL DEFAULT 'AMOUNT',
    discount_value   DECIMAL(10,2) NOT NULL DEFAULT 0,
    status           VARCHAR(20) NOT NULL DEFAULT 'UNUSED',
    expires_at       TIMESTAMP NOT NULL,
    used_at          TIMESTAMP,
    version          INTEGER DEFAULT 0,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_coupon_user ON user_coupon(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_status ON user_coupon(status);
CREATE INDEX IF NOT EXISTS idx_user_coupon_expires ON user_coupon(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_coupon_deleted ON user_coupon(is_deleted);

DROP TRIGGER IF EXISTS trigger_user_coupon_update_time ON user_coupon;
CREATE TRIGGER trigger_user_coupon_update_time
BEFORE UPDATE ON user_coupon
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_user_coupon_version ON user_coupon;
CREATE TRIGGER trigger_user_coupon_version
BEFORE UPDATE ON user_coupon
FOR EACH ROW EXECUTE FUNCTION increment_version();


-- ============================================================================
-- 默认管理员账号
-- 用户名: admin, 密码: admin123 (BCrypt 加密)
-- ============================================================================

INSERT INTO "user" (user_id, username, password_hash, user_type, status, email)
VALUES (
    'admin-default-001',
    'admin',
    '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
    'ADMIN',
    'ACTIVE',
    'admin@smartmall.com'
) ON CONFLICT (username) DO NOTHING;
