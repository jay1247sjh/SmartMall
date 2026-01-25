/**
 * User 子组件模块
 *
 * 这个模块包含 UserManageView 页面拆分出的子组件，用于用户管理页面。
 *
 * 设计原则：
 * - 单一职责：每个组件专注于一个功能区域
 * - 可复用性：组件通过 Props 和 Emits 与父组件通信
 * - 类型安全：所有接口都有完整的 TypeScript 类型定义
 *
 * 包含的组件：
 *
 * 1. UserSearchForm - 搜索和筛选表单（关键词、用户类型、状态）
 * 2. UserTable - 用户列表表格（展示、操作、分页）
 */

export { default as UserSearchForm } from './UserSearchForm.vue'
export type {
  UserSearchParams,
  UserSearchFormProps,
  UserSearchFormEmits,
} from './UserSearchForm.vue'

export { default as UserTable } from './UserTable.vue'
export type { UserTableProps, UserTableEmits } from './UserTable.vue'
