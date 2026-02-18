/**
 * Action ID 生成工具
 *
 * 为每个 Action 生成唯一标识符，格式：act_{timestamp}_{randomSuffix}
 */

/**
 * 生成唯一的 Action ID
 * @returns 格式为 `act_{timestamp}_{random}` 的唯一字符串
 */
export function generateActionId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `act_${timestamp}_${random}`
}
