/**
 * 类型统一导出（向后兼容）
 * 
 * ⚠️ 注意：此文件仅用于向后兼容
 * 新代码应该直接从各领域模块导入：
 * - domain/scene
 * - domain/mall
 * - domain/user
 * - domain/permission
 * - protocol
 * - shared
 */

// 场景领域
export * from '../domain/scene'

// 商城领域
export * from '../domain/mall'

// 用户领域
export * from '../domain/user'

// 权限领域
export * from '../domain/permission'

// 协议层
export * from '../protocol'

// 共享模块
export * from '../shared'
