/**
 * 组件白名单映射表
 * 
 * 将后端返回的组件标识符映射为真实的 Vue 组件
 * 使用懒加载（动态 import）实现按需加载
 * 
 * 安全设计：只有在白名单中的组件才能被加载
 * 
 * 性能优化：
 * - 大型组件使用 defineAsyncComponent 配置加载状态和错误处理
 * - 配置 LoadingSpinner 和 ErrorFallback 组件
 * 
 * Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6
 */

import { defineAsyncComponent, type Component } from 'vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import ErrorFallback from '@/components/shared/ErrorFallback.vue'

// ============================================================================
// 异步组件配置
// ============================================================================

/**
 * 异步组件默认配置
 */
const asyncComponentConfig = {
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorFallback,
  delay: 200,        // 延迟显示 loading（避免闪烁）
  timeout: 30000,    // 超时时间
  suspensible: false // 不使用 Suspense
}

/**
 * MallBuilderView 异步组件
 * 1277 行，包含 Three.js，需要异步加载优化
 * Requirements: 24.1
 */
export const AsyncMallBuilderView = defineAsyncComponent({
  loader: () => import('@/views/admin/MallBuilderView.vue'),
  ...asyncComponentConfig
})

/**
 * Mall3DView 异步组件
 * 400+ 行，包含 3D 渲染，需要异步加载优化
 * Requirements: 24.2
 */
export const AsyncMall3DView = defineAsyncComponent({
  loader: () => import('@/views/Mall3DView.vue'),
  ...asyncComponentConfig
})

/**
 * AiChatPanel 异步组件
 * AI 功能，非首屏必需，需要异步加载优化
 * Requirements: 24.3
 */
export const AsyncAiChatPanel = defineAsyncComponent({
  loader: () => import('@/components/ai/AiChatPanel.vue'),
  ...asyncComponentConfig,
  delay: 100,        // AI 面板延迟更短
  timeout: 10000     // AI 面板超时更短
})

/**
 * 组件映射表
 * key: 后端返回的组件标识符
 * value: 懒加载的组件或异步组件
 * 
 * 注意：大型组件使用 defineAsyncComponent 包装，提供更好的加载体验
 */
export const componentMap: Record<string, (() => Promise<Component>) | Component> = {
  // ===== 布局组件 =====
  'Layout': () => import('@/views/layouts/MainLayout.vue'),
  'AdminLayout': () => import('@/views/layouts/AdminLayout.vue'),
  'MerchantLayout': () => import('@/views/layouts/MerchantLayout.vue'),

  // ===== 公共页面 =====
  'MallView': () => import('@/views/MallView.vue'),
  // Mall3DView 使用异步组件优化（400+ 行，包含 3D 渲染）
  'Mall3DView': AsyncMall3DView,
  'LoginView': () => import('@/views/LoginView.vue'),

  // ===== 管理员页面 =====
  'AdminDashboard': () => import('@/views/admin/DashboardView.vue'),
  'AdminMallManage': () => import('@/views/admin/MallManageView.vue'),
  'AdminAreaApproval': () => import('@/views/admin/AreaApprovalView.vue'),
  'AdminAreaPermission': () => import('@/views/admin/AreaPermissionManageView.vue'),
  'AdminStoreManage': () => import('@/views/admin/AdminStoreManageView.vue'),
  'AdminLayoutVersion': () => import('@/views/admin/LayoutVersionView.vue'),
  // MallBuilderView 使用异步组件优化（1277 行，包含 Three.js）
  'AdminMallBuilder': AsyncMallBuilderView,
  'AdminUserManage': () => import('@/views/admin/UserManageView.vue'),

  // ===== 商家页面 =====
  'MerchantDashboard': () => import('@/views/merchant/DashboardView.vue'),
  'MerchantStoreConfig': () => import('@/views/merchant/StoreConfigView.vue'),
  'MerchantAreaApply': () => import('@/views/merchant/AreaApplyView.vue'),
  'MerchantAreaPermission': () => import('@/views/merchant/AreaPermissionView.vue'),
  'MerchantProduct': () => import('@/views/merchant/ProductManageView.vue'),
  'MerchantBuilder': () => import('@/views/merchant/BuilderView.vue'),

  // ===== 用户页面 =====
  'UserProfile': () => import('@/views/user/ProfileView.vue'),

  // ===== 错误页面 =====
  'NotFound': () => import('@/views/errors/NotFoundView.vue'),
  'Forbidden': () => import('@/views/errors/ForbiddenView.vue'),
}

/**
 * 根据组件标识符获取组件
 * 如果不在白名单中，返回 404 页面
 * 
 * 支持两种类型的组件：
 * - 懒加载函数：() => Promise<Component>
 * - 异步组件：defineAsyncComponent 返回的组件
 * 
 * @param name - 组件标识符
 * @returns 懒加载的组件或异步组件
 */
export function getComponent(name: string): (() => Promise<Component>) | Component {
  const component = componentMap[name]
  
  if (!component) {
    console.warn(`[Router] 组件 "${name}" 不在白名单中，将加载 404 页面`)
    return componentMap['NotFound'] || (() => Promise.resolve({ template: '<div>404</div>' }))
  }
  
  return component
}

/**
 * 检查组件是否在白名单中
 * 
 * @param name - 组件标识符
 * @returns 是否在白名单中
 */
export function isComponentAllowed(name: string): boolean {
  return name in componentMap
}
