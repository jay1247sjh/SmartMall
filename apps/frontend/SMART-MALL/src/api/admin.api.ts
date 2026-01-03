/**
 * 管理员 API 模块
 * 管理员相关接口（统计、审批等）
 */
import http from './http'

// ============================================================================
// Types
// ============================================================================

export interface AdminStats {
  merchantCount: number
  storeCount: number
  pendingApprovals: number
  onlineUsers: number
}

export interface ApprovalRequest {
  id: number
  merchantId: number
  merchantName: string
  areaId: number
  areaName: string
  floorName: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason?: string
  createdAt: string
}

export interface ApprovalListParams {
  status?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * 获取管理员统计数据
 */
export async function getStats(): Promise<AdminStats> {
  // TODO: 对接真实后端
  // return http.get('/api/admin/stats')
  
  return Promise.resolve({
    merchantCount: 128,
    storeCount: 256,
    pendingApprovals: 5,
    onlineUsers: 42,
  })
}

/**
 * 获取审批列表
 */
export async function getApprovalList(params?: ApprovalListParams): Promise<ApprovalRequest[]> {
  // TODO: 对接真实后端
  // return http.get('/api/admin/approvals', { params })
  
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
  
  if (params?.status && params.status !== 'ALL') {
    return mockData.filter(item => item.status === params.status)
  }
  
  return Promise.resolve(mockData)
}

/**
 * 通过审批
 */
export async function approveRequest(id: number): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/approvals/${id}/approve`)
  
  return Promise.resolve()
}

/**
 * 拒绝审批
 */
export async function rejectRequest(id: number, reason: string): Promise<void> {
  // TODO: 对接真实后端
  // return http.post(`/api/admin/approvals/${id}/reject`, { reason })
  
  return Promise.resolve()
}

// ============================================================================
// Export
// ============================================================================

export const adminApi = {
  getStats,
  getApprovalList,
  approveRequest,
  rejectRequest,
}

export default adminApi
