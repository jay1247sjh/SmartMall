/**
 * 用户状态 Store
 * 
 * 职责：
 * - 管理当前登录用户信息
 * - 管理 JWT Token
 * - 提供认证状态和角色判断
 * - 持久化到 localStorage
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
