-- 用户偏好表（长期记忆 - Intelligence 服务使用）
-- 存储 AI 导购过程中提取的用户偏好信息
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

-- 唯一约束：同一用户同一偏好键只保留一条（Last-Write-Wins）
CREATE UNIQUE INDEX IF NOT EXISTS uk_user_preferences_user_key
    ON user_preferences(user_id, preference_key) WHERE is_deleted = FALSE;

-- 索引：按用户查询偏好
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
    ON user_preferences(user_id) WHERE is_deleted = FALSE;

-- 触发器
CREATE TRIGGER trigger_user_preferences_update_time
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_user_preferences_version
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION increment_version();

-- 同步事件日志表（增量同步 - Intelligence 服务使用）
-- 记录 RAG 同步事件的处理状态，支持幂等性和重试
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

-- 唯一约束：event_id 全局唯一，保障幂等性
CREATE UNIQUE INDEX IF NOT EXISTS uk_sync_event_log_event_id
    ON sync_event_log(event_id);

-- 索引：按状态查询（用于 RetryQueue.recover_from_db）
CREATE INDEX IF NOT EXISTS idx_sync_event_log_status
    ON sync_event_log(status) WHERE is_deleted = FALSE;

-- 索引：按实体查询同步历史
CREATE INDEX IF NOT EXISTS idx_sync_event_log_entity
    ON sync_event_log(entity_type, entity_id) WHERE is_deleted = FALSE;

-- 触发器
CREATE TRIGGER trigger_sync_event_log_update_time
    BEFORE UPDATE ON sync_event_log
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_sync_event_log_version
    BEFORE UPDATE ON sync_event_log
    FOR EACH ROW EXECUTE FUNCTION increment_version();
