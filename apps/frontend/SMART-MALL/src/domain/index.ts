/**
 * 领域场景层 (Domain Layer)
 *
 * 职责：
 * - 管理商城语义实体
 * - 提供业务语义一致的行为接口
 * - 将语义行为映射为 Three Core 操作
 *
 * 约束：
 * - 不关心用户是谁
 * - 不关心 AI 来源
 * - 只保证"语义正确性"
 */

// 场景类型与工具
export * from './scene'

// 商城实体
export * from './mall'

// 用户实体
export * from './user'

// 权限模型
export * from './permission'

// 语义对象注册表
export * from './registry'

// 领域行为
export * from './behaviors'

// 领域事件
export * from './events'

// 语义对象工厂
export * from './factory'

// 数据加载器
export * from './loader'
