/**
 * 营业时间工具
 *
 * 统一处理营业时间字符串的解析、校验、展示格式化。
 * 规范格式：HH:mm-HH:mm
 * 特殊值：00:00-24:00（24小时营业）
 */

export type BusinessHoursRange = [string, string]

export const FULL_DAY_BUSINESS_HOURS = '00:00-24:00'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function normalize(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, '')
    .replace(/[~～—–]/g, '-')
}

function toMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/**
 * 解析营业时间字符串
 * @returns 合法时返回 [start, end]，不合法返回 null
 */
export function parseBusinessHours(raw?: string | null): BusinessHoursRange | null {
  if (!raw) return null

  const value = normalize(raw)
  if (!value) return null

  const [start, end] = value.split('-')
  if (!start || !end) return null

  // 24小时营业只接受 00:00-24:00
  if (start === '00:00' && end === '24:00') {
    return ['00:00', '24:00']
  }
  if (end === '24:00') {
    return null
  }

  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)
  if (startMinutes === null || endMinutes === null) {
    return null
  }

  // 非全天模式，开始时间不能等于结束时间
  if (startMinutes === endMinutes) {
    return null
  }

  return [start, end]
}

/**
 * 是否为 24 小时营业
 */
export function isAllDayBusinessHours(raw?: string | null): boolean {
  const parsed = parseBusinessHours(raw)
  return parsed?.[0] === '00:00' && parsed?.[1] === '24:00'
}

/**
 * 是否为有效营业时间（空值视为有效，表示未设置）
 */
export function isValidBusinessHours(raw?: string | null): boolean {
  if (raw == null || raw.trim() === '') {
    return true
  }
  return parseBusinessHours(raw) !== null
}

/**
 * 是否为跨天营业（例如 22:00-02:00）
 */
export function isOvernightBusinessHours(raw?: string | null): boolean {
  const parsed = parseBusinessHours(raw)
  if (!parsed || isAllDayBusinessHours(raw)) {
    return false
  }
  const startMinutes = toMinutes(parsed[0])
  const endMinutes = toMinutes(parsed[1])
  if (startMinutes === null || endMinutes === null) {
    return false
  }
  return startMinutes > endMinutes
}

/**
 * 从时间选择器值构建营业时间字符串
 */
export function buildBusinessHoursFromPicker(
  range: BusinessHoursRange | null,
  allDay: boolean
): string {
  if (allDay) {
    return FULL_DAY_BUSINESS_HOURS
  }
  if (!range) {
    return ''
  }
  return `${range[0]}-${range[1]}`
}

/**
 * 将营业时间转换为时间选择器可回填值
 * 24 小时营业返回 null（由全日开关控制）
 */
export function toPickerRange(raw?: string | null): BusinessHoursRange | null {
  const parsed = parseBusinessHours(raw)
  if (!parsed || parsed[1] === '24:00') {
    return null
  }
  return parsed
}

interface DisplayBusinessHoursOptions {
  allDayText?: string
  nextDayPrefix?: string
  separator?: string
}

/**
 * 营业时间展示格式化
 */
export function toDisplayBusinessHours(
  raw?: string | null,
  options: DisplayBusinessHoursOptions = {}
): string {
  if (!raw) return ''

  const parsed = parseBusinessHours(raw)
  if (!parsed) {
    return raw.trim()
  }

  const allDayText = options.allDayText ?? '24小时营业'
  const nextDayPrefix = options.nextDayPrefix ?? '次日'
  const separator = options.separator ?? '-'

  if (parsed[0] === '00:00' && parsed[1] === '24:00') {
    return allDayText
  }

  if (isOvernightBusinessHours(raw)) {
    return `${parsed[0]}${separator}${nextDayPrefix}${parsed[1]}`
  }

  return `${parsed[0]}${separator}${parsed[1]}`
}
