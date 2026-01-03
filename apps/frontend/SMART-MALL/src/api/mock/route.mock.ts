/**
 * 路由 Mock 数据
 * 
 * 模拟后端返回的动态路由配置
 * 根据当前用户角色返回不同的路由
 */

import type { RouteConfig } from '@/router/types'
import { useUserStore } from '@/stores'

/**
 * 管理员路由
 */
const adminRoutes: RouteConfig[] = [
  {
    path: '/admin',
    name: 'Admin',
    component: 'AdminLayout',
    redirect: '/admin/dashboard',
    meta: {
      title: '管理中心',
      icon: 'setting',
      roles: ['ADMIN'],
    },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: 'AdminDashboard',
        meta: { title: '控制台', icon: 'dashboard' },
      },
      {
        path: 'mall',
        name: 'AdminMallManage',
        component: 'AdminMallManage',
        meta: { title: '商城管理', icon: 'shop' },
      },
      {
        path: 'area-approval',
        name: 'AdminAreaApproval',
        component: 'AdminAreaApproval',
        meta: { title: '区域审批', icon: 'audit' },
      },
      {
        path: 'layout-version',
        name: 'AdminLayoutVersion',
        component: 'AdminLayoutVersion',
        meta: { title: '版本管理', icon: 'history' },
      },
    ],
  },
  // MallBuilder 作为独立全屏路由
  {
    path: '/admin/builder',
    name: 'AdminMallBuilder',
    component: 'AdminMallBuilder',
    meta: {
      title: '商城建模',
      icon: 'tool',
      roles: ['ADMIN'],
    },
  },
]

/**
 * 商家路由
 */
const merchantRoutes: RouteConfig[] = [
  {
    path: '/merchant',
    name: 'Merchant',
    component: 'MerchantLayout',
    redirect: '/merchant/dashboard',
    meta: {
      title: '商家中心',
      icon: 'shop',
      roles: ['MERCHANT'],
    },
    children: [
      {
        path: 'dashboard',
        name: 'MerchantDashboard',
        component: 'MerchantDashboard',
        meta: { title: '工作台', icon: 'dashboard' },
      },
      {
        path: 'store-config',
        name: 'MerchantStoreConfig',
        component: 'MerchantStoreConfig',
        meta: { title: '店铺配置', icon: 'setting', mode: 'CONFIG' },
      },
      {
        path: 'area-apply',
        name: 'MerchantAreaApply',
        component: 'MerchantAreaApply',
        meta: { title: '区域申请', icon: 'form' },
      },
      {
        path: 'builder',
        name: 'MerchantBuilder',
        component: 'MerchantBuilder',
        meta: { title: '建模工具', icon: 'tool', mode: 'CONFIG' },
      },
    ],
  },
]

/**
 * 用户路由
 */
const userRoutes: RouteConfig[] = [
  {
    path: '/user',
    name: 'User',
    component: 'Layout',
    redirect: '/user/profile',
    meta: {
      title: '个人中心',
      icon: 'user',
      roles: ['USER', 'MERCHANT', 'ADMIN'],
    },
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: 'UserProfile',
        meta: { title: '个人信息', icon: 'user' },
      },
    ],
  },
]

/**
 * 公共路由（所有角色可访问）
 */
const commonRoutes: RouteConfig[] = [
  {
    path: '/mall',
    name: 'Mall',
    component: 'MallView',
    meta: {
      title: '商城',
      icon: 'home',
      roles: ['ADMIN', 'MERCHANT', 'USER'],
    },
  },
  {
    path: '/builder',
    name: 'Builder',
    component: 'BuilderView',
    meta: {
      title: '建模器',
      icon: 'tool',
      roles: ['ADMIN', 'MERCHANT'],
      mode: 'CONFIG',
    },
  },
]

/**
 * 根据当前用户角色获取路由
 */
export function getMockRoutes(): RouteConfig[] {
  const userStore = useUserStore()
  const role = userStore.role
  
  const routes: RouteConfig[] = [...commonRoutes]
  
  // 根据角色添加对应路由
  if (role === 'ADMIN') {
    routes.push(...adminRoutes)
    routes.push(...merchantRoutes) // 管理员也能看商家路由
    routes.push(...userRoutes)
  } else if (role === 'MERCHANT') {
    routes.push(...merchantRoutes)
    routes.push(...userRoutes)
  } else if (role === 'USER') {
    routes.push(...userRoutes)
  }
  
  return routes
}

/**
 * 获取所有路由（用于测试）
 */
export function getAllMockRoutes(): RouteConfig[] {
  return [
    ...commonRoutes,
    ...adminRoutes,
    ...merchantRoutes,
    ...userRoutes,
  ]
}
