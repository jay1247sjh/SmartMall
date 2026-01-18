/**
 * 已弃用的工具函数
 * 
 * 这些函数标记为 @deprecated，仅为向后兼容而保留。
 * 新代码请直接使用 AREA_TYPE_NAMES 和 AREA_TYPE_COLORS。
 */

import { AreaType, AREA_TYPE_NAMES, AREA_TYPE_COLORS } from '@smart-mall/shared-types'

/**
 * 获取区域类型的显示名称
 * 
 * @deprecated 使用 AREA_TYPE_NAMES[type] 代替
 * @param type - 区域类型
 * @returns 区域类型的中文名称
 */
export function getAreaTypeName(type: AreaType): string {
  return AREA_TYPE_NAMES[type] ?? String(type)
}

/**
 * 获取区域类型的默认颜色
 * 
 * @deprecated 使用 AREA_TYPE_COLORS[type] 代替
 * @param type - 区域类型
 * @returns 区域类型的默认颜色（十六进制）
 */
export function getAreaTypeColor(type: AreaType): string {
  return AREA_TYPE_COLORS[type] ?? '#6b7280'
}
