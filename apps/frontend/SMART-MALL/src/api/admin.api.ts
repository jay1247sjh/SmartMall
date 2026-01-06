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
// 导出
// ============================================================================

export const adminApi = {
  getStats,
  getApprovalList,
  approveRequest,
  rejectRequest,
}

export default adminApi
