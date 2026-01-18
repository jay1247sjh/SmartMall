/**
 * 组件白名单映射表
 * 
 * 将后端返回的组件标识符映射为真实的 Vue 组件
 * 使用懒加载（动态 import）实现按需加载
 * 
 * 安全设计：只有在白名单中的组件才能被加载
 */

import type { Component } from 'vue'

/**
 * 组件映射表
 * key: 后端返回的组件标识符
 * value: 懒加载的组件
 */
export const componentMap: Record<string, () => Promise<Component>> = {
  // ===== 布局组件 =====
  'Layout': () => import('@/views/layouts/MainLayout.vue'),
  'AdminLayout': () => import('@/views/layouts/AdminLayout.vue'),
  'MerchantLayout': () => import('@/views/layouts/MerchantLayout.vue'),

  // ===== 公共页面 =====
  'MallView': () => import('@/views/MallView.vue'),
  'Mall3DView': () => import('@/views/Mall3DView.vue'),
  'LoginView': () => import('@/views/LoginView.vue'),

  // ===== 管理员页面 =====
  'AdminDashboard': () => import('@/views/admin/DashboardView.vue'),
  'AdminMallManage': () => import('@/views/admin/MallManageView.vue'),
  'AdminAreaApproval': () => import('@/views/admin/AreaApprovalView.vue'),
  'AdminAreaPermission': () => import('@/views/admin/AreaPermissionManageView.vue'),
  'AdminStoreManage': () => import('@/views/admin/AdminStoreManageView.vue'),
  'AdminLayoutVersion': () => import('@/views/admin/LayoutVersionView.vue'),
  'AdminMallBuilder': () => import('@/views/admin/MallBuilderView.vue'),
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
 * @param name - 组件标识符
 * @returns 懒加载的组件
 */
export function getComponent(name: string): () => Promise<Component> {
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
