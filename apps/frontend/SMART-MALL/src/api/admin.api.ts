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
 * 用户管理接口已对接后端。区域审批接口已对接后端。
 * 统计数据和公告接口使用后端 dashboard 接口。
 *
 * 【后端对应接口】
 * - GET /api/admin/stats - 管理员统计数据
 * - GET /api/admin/approvals - 审批列表
 * - POST /api/admin/approvals/:id/approve - 通过审批
 * - POST /api/admin/approvals/:id/reject - 拒绝审批
 * - GET /api/admin/users - 用户列表（分页、搜索、筛选）
 * - GET /api/admin/users/:userId - 用户详情
 * - POST /api/admin/users/:userId/freeze - 冻结用户
 * - POST /api/admin/users/:userId/activate - 激活用户
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
  /** 今日活跃用户数 */
  todayActiveUsers: number
}

/**
 * 系统公告项
 * 用于管理员仪表盘展示系统公告
 */
export interface NoticeItem {
  noticeId: string
  title: string
  content: string
  publishedAt: string
}

/**
 * 发布系统公告请求
 */
export interface PublishNoticeRequest {
  title: string
  content: string
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
 * 
 * TODO: 后端尚未实现 /admin/stats 接口，暂时使用 Mock 数据
 */
export async function getStats(): Promise<AdminStats> {
  return http.get('/dashboard/admin/stats')
}

/**
 * 获取系统公告列表
 *
 * @param limit - 返回数量限制，默认 5
 * @returns 系统公告列表
 */
export async function getNotices(limit = 5): Promise<NoticeItem[]> {
  return http.get('/dashboard/notices', { params: { limit } })
}

/**
 * 发布系统公告（管理员）
 *
 * @param data - 公告标题与内容
 * @returns 新发布的公告
 */
export async function publishNotice(data: PublishNoticeRequest): Promise<NoticeItem> {
  return http.post('/dashboard/notices', data)
}

/**
 * 后端区域申请 DTO 类型（与后端 AreaApplyDTO 对应）
 */
interface BackendAreaApplyDTO {
  applyId: string
  areaId: string
  areaName: string
  floorName: string
  merchantId: string
  merchantName: string
  status: string
  applyReason: string
  rejectReason?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

/**
 * 将后端 DTO 转换为前端类型
 */
function mapBackendApplyToFrontend(dto: BackendAreaApplyDTO): ApprovalRequest {
  return {
    id: parseInt(dto.applyId) || 0,
    merchantId: parseInt(dto.merchantId) || 0,
    merchantName: dto.merchantName,
    areaId: parseInt(dto.areaId) || 0,
    areaName: dto.areaName,
    floorName: dto.floorName,
    reason: dto.applyReason,
    status: dto.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    rejectReason: dto.rejectReason,
    createdAt: dto.createdAt,
  }
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
  // 后端只提供待审批列表接口，如果需要全部状态需要后端扩展
  if (!params?.status || params.status === 'ALL' || params.status === 'PENDING') {
    const data = await http.get<BackendAreaApplyDTO[]>('/admin/area/apply/pending')
    return data.map(mapBackendApplyToFrontend)
  }
  
  // 其他状态暂时返回空数组（后端未提供按状态查询的接口）
  return []
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
  return http.post(`/admin/area/apply/${id}/approve`)
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
  return http.post(`/admin/area/apply/${id}/reject`, { reason })
}

// ============================================================================
// 用户管理 API 方法
// ============================================================================

/**
 * 获取用户列表
 *
 * 支持按关键词搜索、用户类型和状态筛选，以及分页。
 *
 * @param params - 查询参数
 * @returns 用户列表响应
 */
export async function getUserList(params?: UserListParams): Promise<UserListResponse> {
  return http.get('/admin/users', { params })
}

/**
 * 获取用户详情
 *
 * @param userId - 用户 ID
 * @returns 用户详情
 */
export async function getUserDetail(userId: string): Promise<UserDetail> {
  return http.get(`/admin/users/${userId}`)
}

/**
 * 冻结用户
 *
 * 将用户状态设置为 FROZEN，用户将无法登录系统。
 *
 * @param userId - 用户 ID
 */
export async function freezeUser(userId: string): Promise<void> {
  return http.post(`/admin/users/${userId}/freeze`)
}

/**
 * 激活用户
 *
 * 将用户状态设置为 ACTIVE，恢复用户的登录权限。
 *
 * @param userId - 用户 ID
 */
export async function activateUser(userId: string): Promise<void> {
  return http.post(`/admin/users/${userId}/activate`)
}

// ============================================================================
// 导出
// ============================================================================

export const adminApi = {
  getStats,
  getNotices,
  publishNotice,
  getApprovalList,
  approveRequest,
  rejectRequest,
  getUserList,
  getUserDetail,
  freezeUser,
  activateUser,
}

export default adminApi
