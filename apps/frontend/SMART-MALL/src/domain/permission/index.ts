/**
 * 权限领域模块
 *
 * 这个模块定义了系统的权限模型，用于控制用户对资源的访问。
 *
 * 设计原则：
 * - 基于角色的访问控制（RBAC）：用户 → 角色 → 权限
 * - 最小权限原则：用户只拥有完成工作所需的最小权限
 * - 类型安全：使用 TypeScript 枚举确保权限值正确
 *
 * 包含的组件：
 *
 * 1. 枚举定义（permission.enums.ts）
 *    - UserRole：用户角色（管理员、商户、普通用户）
 *    - Permission：权限类型（查看、编辑、删除、管理）
 *
 * 2. 类型定义（permission.types.ts）
 *    - RolePermissions：角色权限映射
 *    - PermissionCheck：权限检查结果
 *
 * 角色权限矩阵：
 * ```
 * 角色        | 查看商城 | 编辑店铺 | 管理用户 | 系统设置
 * ------------|---------|---------|---------|--------
 * ADMIN       |    ✓    |    ✓    |    ✓    |    ✓
 * MERCHANT    |    ✓    |    ✓    |    ✗    |    ✗
 * USER        |    ✓    |    ✗    |    ✗    |    ✗
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { UserRole, Permission } from '@/domain/permission'
 *
 * // 检查用户是否有编辑权限
 * if (user.role === UserRole.ADMIN || user.role === UserRole.MERCHANT) {
 *   // 允许编辑
 * }
 * ```
 */

export * from './permission.enums'
export * from './permission.types'
