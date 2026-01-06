/**
 * ============================================================================
 * 用户状态 Store (User Store)
 * ============================================================================
 *
 * 【业务职责】
 * 管理 Smart Mall 系统的用户认证状态，是整个应用的身份认证核心。
 * 所有需要用户身份的功能都依赖此 Store 提供的状态和方法。
 *
 * 【核心功能】
 * 1. 用户身份管理 - 存储当前登录用户的基本信息
 * 2. JWT Token 管理 - 管理 Access Token 和 Refresh Token
 * 3. 角色权限判断 - 提供便捷的角色检查方法
 * 4. 商家信息管理 - 商家用户的附加业务信息
 * 5. 状态持久化 - 通过 localStorage 实现页面刷新后的状态恢复
 *
 * 【用户角色体系】
 * Smart Mall 采用三级角色体系：
 * - ADMIN（管理员）：系统管理员，拥有所有权限，管理商城配置和用户
 * - MERCHANT（商家）：入驻商户，可以管理自己的店铺和商品
 * - USER（普通用户）：访客用户，可以浏览商城和购物
 *
 * 【Token 机制】
 * 采用双 Token 机制保证安全性和用户体验：
 * - Access Token：短期有效（如 15 分钟），用于 API 请求认证
 * - Refresh Token：长期有效（如 7 天），用于刷新 Access Token
 * 当 Access Token 过期时，自动使用 Refresh Token 获取新的 Access Token，
 * 实现无感知的 Token 续期，避免用户频繁重新登录。
 *
 * 【存储键名约定】
 * 所有 localStorage 键名以 'sm_' 前缀开头（Smart Mall 缩写）：
 * - sm_accessToken：Access Token
 * - sm_refreshToken：Refresh Token
 * - sm_userInfo：用户基本信息 JSON
 * - sm_merchantInfo：商家信息 JSON（仅商家用户）
 *
 * 【依赖关系】
 * - 被 http.ts 依赖：请求拦截器从此获取 Token
 * - 被 guards.ts 依赖：路由守卫从此判断认证状态
 * - 被各业务组件依赖：获取用户信息和权限
 * ============================================================================
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ============================================================================
// 类型定义
// ============================================================================

/** 用户类型枚举 */
export type UserType = 'ADMIN' | 'MERCHANT' | 'USER'

/** 用户状态枚举 */
export type UserStatus = 'ACTIVE' | 'FROZEN' | 'DELETED'

/** 用户信息接口 */
export interface UserInfo {
  userId: string
  username: string
  userType: UserType
  status: UserStatus
  email?: string
  phone?: string
  lastLoginTime?: string
}

/** 商家信息接口（商家用户附加信息） */
export interface MerchantInfo {
  merchantId: string
  companyName: string
  status: string
  authorizedAreaIds: string[]
}

// ============================================================================
// Store 定义
// ============================================================================

export const useUserStore = defineStore('user', () => {
  // ==========================================================================
  // 状态
  // ==========================================================================

  /** 当前登录用户 */
  const currentUser = ref<UserInfo | null>(null)

  /** 商家信息（仅商家用户有） */
  const merchantInfo = ref<MerchantInfo | null>(null)

  /** Access Token */
  const accessToken = ref<string | null>(null)

  /** Refresh Token */
  const refreshToken = ref<string | null>(null)

  // ==========================================================================
  // 计算属性
  // ==========================================================================

  /** 是否已认证 */
  const isAuthenticated = computed(() => !!accessToken.value && !!currentUser.value)

  /** 当前用户角色 */
  const role = computed(() => currentUser.value?.userType ?? null)

  /** 是否是管理员 */
  const isAdmin = computed(() => role.value === 'ADMIN')

  /** 是否是商家 */
  const isMerchant = computed(() => role.value === 'MERCHANT')

  /** 是否是普通用户 */
  const isUser = computed(() => role.value === 'USER')

  /** 当前用户ID */
  const userId = computed(() => currentUser.value?.userId ?? null)

  /** 当前商家ID（仅商家有） */
  const merchantId = computed(() => merchantInfo.value?.merchantId ?? null)

  /** 商家授权的区域ID列表 */
  const authorizedAreaIds = computed(() => merchantInfo.value?.authorizedAreaIds ?? [])

  // ==========================================================================
  // Actions
  // ==========================================================================

  /**
   * 设置用户信息（登录成功后调用）
   */
  function setUser(user: UserInfo, token: string, refresh: string) {
    currentUser.value = user
    accessToken.value = token
    refreshToken.value = refresh

    // 持久化到 localStorage
    localStorage.setItem('sm_accessToken', token)
    localStorage.setItem('sm_refreshToken', refresh)
    localStorage.setItem('sm_userInfo', JSON.stringify(user))
  }

  /**
   * 设置商家信息
   */
  function setMerchantInfo(info: MerchantInfo) {
    merchantInfo.value = info
    localStorage.setItem('sm_merchantInfo', JSON.stringify(info))
  }

  /**
   * 清除用户信息（登出时调用）
   */
  function clearUser() {
    currentUser.value = null
    merchantInfo.value = null
    accessToken.value = null
    refreshToken.value = null

    localStorage.removeItem('sm_accessToken')
    localStorage.removeItem('sm_refreshToken')
    localStorage.removeItem('sm_userInfo')
    localStorage.removeItem('sm_merchantInfo')
  }

  /**
   * 更新 Access Token（刷新 token 后调用）
   */
  function updateToken(token: string) {
    accessToken.value = token
    localStorage.setItem('sm_accessToken', token)
  }

  /**
   * 从 localStorage 恢复状态（应用启动时调用）
   * 
   * @returns 是否恢复成功
   */
  function restoreFromStorage(): boolean {
    try {
      const token = localStorage.getItem('sm_accessToken')
      const refresh = localStorage.getItem('sm_refreshToken')
      const userStr = localStorage.getItem('sm_userInfo')
      const merchantStr = localStorage.getItem('sm_merchantInfo')

      if (!token || !refresh || !userStr) {
        return false
      }

      const parsedUser = JSON.parse(userStr) as UserInfo
      
      // 验证必要字段
      if (!parsedUser.userId || !parsedUser.username || !parsedUser.userType) {
        console.warn('[UserStore] Invalid user info in storage')
        clearUser()
        return false
      }

      accessToken.value = token
      refreshToken.value = refresh
      currentUser.value = parsedUser

      if (merchantStr) {
        try {
          const parsedMerchant = JSON.parse(merchantStr) as MerchantInfo
          if (parsedMerchant.merchantId) {
            merchantInfo.value = parsedMerchant
          }
        } catch {
          console.warn('[UserStore] Failed to parse merchant info')
          localStorage.removeItem('sm_merchantInfo')
        }
      }

      return true
    } catch (error) {
      console.error('[UserStore] Failed to restore from storage:', error)
      clearUser()
      return false
    }
  }

  /**
   * 检查用户是否有指定区域的建模权限
   */
  function hasAreaPermission(areaId: string): boolean {
    if (isAdmin.value) return true
    if (!isMerchant.value) return false
    return authorizedAreaIds.value.includes(areaId)
  }

  /**
   * 添加授权区域（权限审批通过后调用）
   */
  function addAuthorizedArea(areaId: string) {
    if (merchantInfo.value && !merchantInfo.value.authorizedAreaIds.includes(areaId)) {
      merchantInfo.value.authorizedAreaIds.push(areaId)
      localStorage.setItem('sm_merchantInfo', JSON.stringify(merchantInfo.value))
    }
  }

  /**
   * 移除授权区域（权限撤销后调用）
   */
  function removeAuthorizedArea(areaId: string) {
    if (merchantInfo.value) {
      merchantInfo.value.authorizedAreaIds = merchantInfo.value.authorizedAreaIds.filter(
        (id) => id !== areaId
      )
      localStorage.setItem('sm_merchantInfo', JSON.stringify(merchantInfo.value))
    }
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    // 状态
    currentUser,
    merchantInfo,
    accessToken,
    refreshToken,

    // 计算属性
    isAuthenticated,
    role,
    isAdmin,
    isMerchant,
    isUser,
    userId,
    merchantId,
    authorizedAreaIds,

    // Actions
    setUser,
    setMerchantInfo,
    clearUser,
    updateToken,
    restoreFromStorage,
    hasAreaPermission,
    addAuthorizedArea,
    removeAuthorizedArea,
  }
})
