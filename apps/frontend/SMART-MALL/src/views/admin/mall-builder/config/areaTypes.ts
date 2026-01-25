/**
 * 区域类型配置
 */
import type { AreaType } from '@/builder'

export interface AreaTypeConfig {
  value: AreaType
  label: string
  color: string
}

export const areaTypes: AreaTypeConfig[] = [
  { value: 'retail', label: '零售', color: '#3b82f6' },
  { value: 'food', label: '餐饮', color: '#f97316' },
  { value: 'service', label: '服务', color: '#8b5cf6' },
  { value: 'anchor', label: '主力店', color: '#ef4444' },
  { value: 'common', label: '公共区域', color: '#6b7280' },
  { value: 'corridor', label: '走廊', color: '#9ca3af' },
  { value: 'elevator', label: '电梯', color: '#10b981' },
  { value: 'escalator', label: '扶梯', color: '#14b8a6' },
  { value: 'restroom', label: '洗手间', color: '#ec4899' },
  { value: 'other', label: '其他', color: '#a3a3a3' },
]

export function getAreaTypeLabel(type: AreaType): string {
  return areaTypes.find(t => t.value === type)?.label || '未知'
}

export function getAreaTypeColorByType(type: AreaType): string {
  return areaTypes.find(t => t.value === type)?.color || '#a3a3a3'
}
