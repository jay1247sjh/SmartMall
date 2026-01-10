/**
 * ============================================================================
 * 管理员 API 模块 (Admin API)
 * ============================================================================
 *
 * 【业务职责】
 * 提供系统管理员（ADMIN 角色）专用的 API 接口，包括：
 * 1. 管理员统计数据 - 商城运营的宏观指标
 * 2. 区域审批管理 - 审批商家的入驻申请
 *
 * 【管理员角色说明】
 * 管理员是 Smart Mall 的最高权限用户：
 * - 管理商城的整体配置和布局
 * - 审批商家的区域入驻申请
 * - 查看系统运营数据
 * - 管理用户和商家账号
 *
 * 【区域审批流程】
 * 1. 商家提交区域入驻申请（通过 merchant.api）
 * 2. 管理员在审批列表中看到待审批申请
 * 3. 管理员审核申请内容和商家资质
 * 4. 通过（approveRequest）或拒绝（rejectRequest）
 * 5. 通过后，区域状态变为 AUTHORIZED，商家可以开始装修
 * 6. 拒绝后，需要填写拒绝原因，商家可以看到原因
 *
 * 【当前状态】
 * 此模块目前使用 Mock 数据，TODO 标记处需要对接真实后端。
 *
 * 【后端对应接口】（待实现）
 * - GET /api/admin/stats - 管理员统计数据
 * - GET /api/admin/approvals - 审批列表
 * - POST /api/admin/approvals/:id/approve - 通过审批
 * - POST /api/admin/approvals/:id/reject - 拒绝审批
 * ============================================================================
 */
import http from './http'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 管理员统计数据
 * 用于管理员仪表盘展示系统运营指标
 */
export interface AdminStats {
  /** 入驻商家总数 */
  merchantCount: number
  /** 店铺总数 */
  storeCount: number
  /** 待审批申请数 */
  pendingApprovals: number
  /** 当前在线用户数 */
  onlineUsers: number
}

/**
 * 审批请求记录
 * 商家提交的区域入驻申请
 */
export interface ApprovalRequest {
  id: number
  /** 申请商家 ID */
  merchantId: number
  /** 申请商家名称 */
  merchantName: string
  /** 申请的区域 ID */
  areaId: number
  /** 区域名称 */
  areaName: string
  /** 楼层名称 */
  floorName: string
  /** 申请理由 */
  reason: string
  /** 审批状态 */
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  /** 拒绝原因（仅当 status 为 REJECTED 时有值） */
  rejectReason?: string
  /** 申请时间 */
  createdAt: string
}

/**
 * 审批列表查询参数
 */
export interface ApprovalListParams {
  /** 按状态筛选（ALL 表示全部） */
  status?: string
  /** 页码（从 1 开始） */
  page?: number
  /** 每页数量 */
  pageSize?: number
}

// ============================================================================
// 用户管理类型定义
// ============================================================================

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  /** 搜索关键词（用户名或邮箱） */
  keyword?: string
  /** 用户类型筛选 */
  userType?: 'ALL' | 'ADMIN' | 'MERCHANT' | 'USER'
  /** 用户状态筛选 */
  status?: 'ALL' | 'ACTIVE' | 'FROZEN' | 'DELETED'
  /** 页码（从 1 开始） */
  page?: number
  /** 每页数量 */
  pageSize?: number
}

/**
 * 用户信息（列表项）
 */
export interface UserInfo {
  /** 用户 ID */
  userId: string
  /** 用户名 */
  username: string
  /** 邮箱 */
  email: string
  /** 用户类型 */
  userType: 'ADMIN' | 'MERCHANT' | 'USER'
  /** 用户状态 */
  status: 'ACTIVE' | 'FROZEN' | 'DELETED'
  /** 注册时间 */
  createdAt: string
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  /** 用户列表 */
  list: UserInfo[]
  /** 总数 */
  total: number
}

/**
 * 用户详情
 */
export interface UserDetail extends UserInfo {
  /** 手机号 */
  phone?: string
  /** 最后登录时间 */
  lastLoginTime?: string
}

// ============================================================================
// API 方法
// ============================================================================

/**
 * 获取管理员统计数据
 *
 * 用于管理员仪表盘，展示系统运营的关键指标。
 * 数据实时计算，反映当前系统状态。
 *
 * @returns 管理员统计数据
 */
export async function getStats(): Promise<AdminStats> {
  // TODO: 对接真实后端
  // return http.get('/api/admin/stats')
  
  // Mock 数据：模拟一个中等规模商城的运营数据
  return Promise.resolve({
    merchantCount: 128,    // 128 家入驻商家
    storeCount: 256,       // 256 家店铺（部分商家有多店）
    pendingApprovals: 5,   // 5 个待审批申请
    onlineUsers: 42,       // 42 个在线用户
  })
}

/**
 * 获取审批列表
 *
 * 返回区域入驻申请列表，支持按状态筛选和分页。
 * 管理员可以在此列表中处理待审批的申请。
 *
 * @param params - 查询参数
 * @returns 审批请求列表
 */
export async function getApprovalList(params?: ApprovalListParams): Promise<ApprovalRequest[]> {
  // TODO: 对接真实后端
  // return http.get('/api/admin/approvals', { params })
  
  // Mock 数据：模拟不同状态的审批申请
  const mockData: ApprovalRequest[] = [
    {
      id: 1,
      merchantId: 101,
      merchantName: '星巴克咖啡',
      areaId: 1001,
      areaName: 'A-101',
      floorName: '1F',
      reason: '希望在一楼开设新店铺，主营咖啡饮品',
      status: 'PENDING',
      createdAt: '2024-12-28T10:30:00Z',
    },
    {
      id: 2,
      merchantId: 102,
      merchantName: '优衣库',
      areaId: 1002,
      areaName: 'B-201',
      floorName: '2F',
      reason: '扩展店铺面积，增加服装展示区',
      status: 'PENDING',
      createdAt: '2024-12-27T14:20:00Z',
    },
    {
      id: 3,
      merchantId: 103,
      merchantName: '海底捞',
      areaId: 1003,
      areaName: 'C-301',
      floorName: '3F',
      reason: '开设餐饮店铺',
      status: 'APPROVED',
      createdAt: '2024-12-26T09:15:00Z',
    },
  ]
  
  // 按状态筛选
  if (params?.status && params.status !== 'ALL') {
    return mockData.filter(item => item.status === params.status)
  }
  
  return Promise.resolve(mockData)
}

/**
 * 通过审批
 *
 * 批准商家的区域入驻申请。
 * 通过后，区域状态变为 AUTHORIZED，商家可以开始装修店铺。
 *
 * @param id - 审批请求 ID
 */
export async function approveRequest(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/approvals/${id}/approve`)
  
  return Promise.resolve()
}

/**
 * 拒绝审批
 *
 * 拒绝商家的区域入驻申请。
 * 需要填写拒绝原因，商家可以在申请记录中看到原因。
 *
 * @param id - 审批请求 ID
 * @param reason - 拒绝原因
 */
export async function rejectRequest(id: number, reason: string): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/approvals/${id}/reject`, { reason })
  
  return Promise.resolve()
}

// ============================================================================
// 用户管理 API 方法
// ============================================================================

/** Mock 用户数据 */
const mockUsers: UserDetail[] = [
  {
    userId: 'u001',
    username: 'admin',
    email: 'admin@smartmall.com',
    phone: '13800138000',
    userType: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginTime: '2024-12-28T10:30:00Z',
  },
  {
    userId: 'u002',
    username: 'merchant_starbucks',
    email: 'starbucks@example.com',
    phone: '13900139001',
    userType: 'MERCHANT',
    status: 'ACTIVE',
    createdAt: '2024-03-15T08:00:00Z',
    lastLoginTime: '2024-12-27T14:20:00Z',
  },
  {
    userId: 'u003',
    username: 'merchant_uniqlo',
    email: 'uniqlo@example.com',
    phone: '13900139002',
    userType: 'MERCHANT',
    status: 'ACTIVE',
    createdAt: '2024-04-20T10:00:00Z',
    lastLoginTime: '2024-12-26T09:15:00Z',
  },
  {
    userId: 'u004',
    username: 'user_zhangsan',
    email: 'zhangsan@example.com',
    phone: '13700137001',
    userType: 'USER',
    status: 'ACTIVE',
    createdAt: '2024-06-10T12:00:00Z',
    lastLoginTime: '2024-12-25T16:45:00Z',
  },
  {
    userId: 'u005',
    username: 'user_lisi',
    email: 'lisi@example.com',
    userType: 'USER',
    status: 'FROZEN',
    createdAt: '2024-07-05T14:00:00Z',
    lastLoginTime: '2024-11-20T08:30:00Z',
  },
  {
    userId: 'u006',
    username: 'merchant_haidilao',
    email: 'haidilao@example.com',
    phone: '13900139003',
    userType: 'MERCHANT',
    status: 'ACTIVE',
    createdAt: '2024-05-01T09:00:00Z',
    lastLoginTime: '2024-12-28T11:00:00Z',
  },
  {
    userId: 'u007',
    username: 'user_wangwu',
    email: 'wangwu@example.com',
    phone: '13700137002',
    userType: 'USER',
    status: 'ACTIVE',
    createdAt: '2024-08-15T16:00:00Z',
    lastLoginTime: '2024-12-27T20:15:00Z',
  },
  {
    userId: 'u008',
    username: 'user_deleted',
    email: 'deleted@example.com',
    userType: 'USER',
    status: 'DELETED',
    createdAt: '2024-02-20T10:00:00Z',
  },
]

/**
 * 获取用户列表
 *
 * 支持按关键词搜索、用户类型和状态筛选，以及分页。
 *
 * @param params - 查询参数
 * @returns 用户列表响应
 */
export async function getUserList(params?: UserListParams): Promise<UserListResponse> {
  // TODO: 对接真实后端
  // return http.get('/api/admin/users', { params })
  
  let filtered = [...mockUsers]
  
  // 关键词搜索（用户名或邮箱）
  if (params?.keyword) {
    const keyword = params.keyword.toLowerCase()
    filtered = filtered.filter(
      user => user.username.toLowerCase().includes(keyword) ||
              user.email.toLowerCase().includes(keyword)
    )
  }
  
  // 用户类型筛选
  if (params?.userType && params.userType !== 'ALL') {
    filtered = filtered.filter(user => user.userType === params.userType)
  }
  
  // 状态筛选
  if (params?.status && params.status !== 'ALL') {
    filtered = filtered.filter(user => user.status === params.status)
  }
  
  // 分页
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = filtered.slice(start, end)
  
  return Promise.resolve({
    list,
    total: filtered.length,
  })
}

/**
 * 获取用户详情
 *
 * @param userId - 用户 ID
 * @returns 用户详情
 */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  // TODO: 对接真实后端
  // return http.get(`/api/admin/users/${userId}`)
  
  const user = mockUsers.find(u => u.userId === userId)
  if (!user) {
    throw new Error('用户不存在')
  }
  return Promise.resolve(user)
}

/**
 * 冻结用户
 *
 * 将用户状态设置为 FROZEN，用户将无法登录系统。
 *
 * @param userId - 用户 ID
 */
export async function freezeUser(userId: string): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/users/${userId}/freeze`)
  
  const user = mockUsers.find(u => u.userId === userId)
  if (user) {
    user.status = 'FROZEN'
  }
  return Promise.resolve()
}

/**
 * 激活用户
 *
 * 将用户状态设置为 ACTIVE，恢复用户的登录权限。
 *
 * @param userId - 用户 ID
 */
export async function activateUser(userId: string): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/users/${userId}/activate`)
  
  const user = mockUsers.find(u => u.userId === userId)
  if (user) {
    user.status = 'ACTIVE'
  }
  return Promise.resolve()
}

// ============================================================================
// 导出
// ============================================================================

export const adminApi = {
  getStats,
  getApprovalList,
  approveRequest,
  rejectRequest,
  getUserList,
  getUserDetail,
  freezeUser,
  activateUser,
}

export default adminApi
