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
