-- 系统公告表
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

-- 条件索引：活跃公告按发布时间倒序
CREATE INDEX IF NOT EXISTS idx_notice_active_published ON notice(is_active, published_at DESC) WHERE is_deleted = FALSE;
