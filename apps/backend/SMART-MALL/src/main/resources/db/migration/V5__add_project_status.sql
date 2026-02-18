-- 为 mall_project 表添加 status 字段，支持发布功能
-- 状态：DRAFT（草稿）、PUBLISHED（已发布）

ALTER TABLE mall_project ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

-- 为 status 字段创建索引（常用查询条件）
CREATE INDEX IF NOT EXISTS idx_mall_project_status ON mall_project(status) WHERE is_deleted = FALSE;

-- 将现有项目标记为草稿
UPDATE mall_project SET status = 'DRAFT' WHERE status IS NULL OR status = '';
