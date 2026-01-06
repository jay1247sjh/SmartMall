/**
 * 用户领域模块
 *
 * 这个模块定义了用户相关的领域模型，包括用户实体、角色和状态。
 *
 * 设计原则：
 * - 领域驱动设计：以用户为核心的业务建模
 * - 类型安全：使用 TypeScript 确保用户数据结构正确
 * - 安全性：敏感信息（如密码）不在前端存储
 *
 * 包含的组件：
 *
 * 1. 枚举定义（user.enums.ts）
 *    - UserStatus：用户状态（活跃、禁用、待验证）
 *    - AuthProvider：认证提供商（本地、微信、Google）
 *
 * 2. 类型定义（user.types.ts）
 *    - User：用户实体
 *    - UserProfile：用户资料
 *    - UserPreferences：用户偏好设置
 *
 * 用户状态流转：
 * ```
 * 注册 → PENDING（待验证）→ 邮箱验证 → ACTIVE（活跃）
 *                                         ↓
 *                              管理员禁用 → DISABLED（禁用）
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { UserStatus, type User } from '@/domain/user'
 *
 * // 检查用户状态
 * if (user.status === UserStatus.ACTIVE) {
 *   // 允许登录
 * }
 * ```
 */

export * from './user.enums'
export * from './user.types'
