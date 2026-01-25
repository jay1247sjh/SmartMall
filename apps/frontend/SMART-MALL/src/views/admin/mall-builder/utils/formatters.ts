/**
 * 格式化工具函数
 */

/**
 * 格式化日期为相对时间
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化面积
 */
export function formatArea(area: number): string {
  return `${area.toFixed(1)} m²`
}

/**
 * 格式化周长
 */
export function formatPerimeter(perimeter: number): string {
  return `${perimeter.toFixed(1)} m`
}
