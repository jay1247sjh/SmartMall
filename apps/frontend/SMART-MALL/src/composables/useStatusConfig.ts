/**
 * 状态配置 Composable
 * 统一管理各种业务状态的显示配置
 */

export interface StatusConfig {
  class: string
  text: string
  color?: string
}

// 通用状态配置
const STATUS_CONFIGS: Record<string, Record<string, StatusConfig>> = {
  // 用户状态
  user: {
    ACTIVE: { class: 'status-active', text: '正常', color: '#34d399' },
    FROZEN: { class: 'status-frozen', text: '冻结', color: '#fbbf24' },
    DELETED: { class: 'status-deleted', text: '已删除', color: '#9ca3af' },
  },
  // 店铺状态
  store: {
    ACTIVE: { class: 'status-active', text: '营业中', color: '#34d399' },
    INACTIVE: { class: 'status-inactive', text: '暂停营业', color: '#fbbf24' },
    PENDING: { class: 'status-pending', text: '待审批', color: '#60a5fa' },
    CLOSED: { class: 'status-closed', text: '已关闭', color: '#9ca3af' },
  },
  // 审批状态
  approval: {
    PENDING: { class: 'status-pending', text: '待审批', color: '#fbbf24' },
    APPROVED: { class: 'status-approved', text: '已通过', color: '#34d399' },
    REJECTED: { class: 'status-rejected', text: '已拒绝', color: '#f28b82' },
  },
  // 权限状态
  permission: {
    ACTIVE: { class: 'status-active', text: '有效', color: '#34d399' },
    REVOKED: { class: 'status-revoked', text: '已撤销', color: '#f28b82' },
  },
  // 版本状态
  version: {
    DRAFT: { class: 'status-draft', text: '草稿', color: '#fbbf24' },
    ACTIVE: { class: 'status-active', text: '当前版本', color: '#34d399' },
    ARCHIVED: { class: 'status-archived', text: '已归档', color: '#9ca3af' },
  },
  // 区域状态
  area: {
    LOCKED: { class: 'status-locked', text: '锁定', color: '#9ca3af' },
    PENDING: { class: 'status-pending', text: '待审批', color: '#fbbf24' },
    AUTHORIZED: { class: 'status-authorized', text: '已授权', color: '#60a5fa' },
    OCCUPIED: { class: 'status-occupied', text: '已入驻', color: '#34d399' },
  },
}

export function useStatusConfig(domain: keyof typeof STATUS_CONFIGS = 'approval') {
  const configs = STATUS_CONFIGS[domain] || {}

  function getStatusConfig(status: string): StatusConfig {
    return configs[status] || { class: '', text: status }
  }

  function getStatusClass(status: string): string {
    return getStatusConfig(status).class
  }

  function getStatusText(status: string): string {
    return getStatusConfig(status).text
  }

  function getStatusColor(status: string): string {
    return getStatusConfig(status).color || '#9ca3af'
  }

  return {
    getStatusConfig,
    getStatusClass,
    getStatusText,
    getStatusColor,
  }
}

// 导出所有配置供直接使用
export { STATUS_CONFIGS }
