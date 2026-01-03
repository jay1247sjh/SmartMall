/**
 * 用户 API 模块
 * 用户资料管理相关接口
 * 
 * 注意：后端 UserController 尚未实现，当前使用 mock 数据
 * 待后端实现后，取消注释真实 API 调用
 */
// import http from './http'  // 后端实现后启用

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string
  username: string
  email: string
  phone?: string
  avatar?: string
  userType: 'ADMIN' | 'MERCHANT' | 'USER'
  status: 'ACTIVE' | 'FROZEN' | 'DELETED'
  createdAt: string
}

export interface UpdateProfileRequest {
  email?: string
  phone?: string
  avatar?: string
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * 获取当前用户资料
 * 
 * 后端接口：GET /user/profile（待实现）
 */
export async function getProfile(): Promise<UserProfile> {
  // 后端实现后启用：
  // return http.get<UserProfile>('/user/profile')
  
  // 临时：从 localStorage 获取登录时保存的用户信息
  const userStr = localStorage.getItem('sm_userInfo')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return {
        id: user.userId,
        username: user.username,
        email: user.email || '',
        phone: user.phone,
        avatar: undefined,
        userType: user.userType,
        status: user.status,
        createdAt: user.lastLoginTime || new Date().toISOString(),
      }
    } catch {
      // 解析失败，返回默认值
    }
  }
  
  throw new Error('用户未登录')
}

/**
 * 更新用户资料
 * 
 * 后端接口：PUT /user/profile（待实现）
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  // 后端实现后启用：
  // return http.put<UserProfile>('/user/profile', data)
  
  // 临时：模拟更新成功
  const current = await getProfile()
  return {
    ...current,
    email: data.email || current.email,
    phone: data.phone || current.phone,
    avatar: data.avatar || current.avatar,
  }
}

// ============================================================================
// Export
// ============================================================================

export const userApi = {
  getProfile,
  updateProfile,
}

export default userApi
