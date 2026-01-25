/**
 * 格式化工具 Composable
 * 统一的日期、数字等格式化函数
 */

export function useFormatters() {
  /**
   * 格式化日期时间
   */
  function formatDateTime(dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', options ?? {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * 格式化日期（不含时间）
   */
  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  /**
   * 格式化短日期（月/日 时:分）
   */
  function formatShortDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * 格式化数字（千分位）
   */
  function formatNumber(num: number | null | undefined): string {
    if (num == null) return '-'
    return num.toLocaleString('zh-CN')
  }

  /**
   * 格式化货币
   */
  function formatCurrency(amount: number | null | undefined, currency = 'CNY'): string {
    if (amount == null) return '-'
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  /**
   * 格式化百分比
   */
  function formatPercent(value: number | null | undefined, decimals = 1): string {
    if (value == null) return '-'
    return `${(value * 100).toFixed(decimals)}%`
  }

  return {
    formatDateTime,
    formatDate,
    formatShortDateTime,
    formatNumber,
    formatCurrency,
    formatPercent,
  }
}
