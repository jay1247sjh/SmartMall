/**
 * ID 生成工具函数
 * 
 * 提供唯一标识符生成功能，用于项目、楼层、区域等实体的创建。
 * 
 * 规则：
 * - 只包含纯函数
 * - 无副作用
 * - 无外部依赖
 */

/**
 * 生成唯一 ID
 * 
 * 使用时间戳 + 随机字符串组合，确保在单机环境下的唯一性。
 * 格式: `{timestamp_base36}-{random_base36}`
 * 
 * @returns 唯一标识符字符串
 * 
 * @example
 * ```ts
 * const id = generateId()
 * // => "lxyz1234-abc5678"
 * ```
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 生成带前缀的唯一 ID
 * 
 * @param prefix - ID 前缀，用于区分不同实体类型
 * @returns 带前缀的唯一标识符
 * 
 * @example
 * ```ts
 * generateIdWithPrefix('floor')  // => "floor_lxyz1234-abc5678"
 * generateIdWithPrefix('area')   // => "area_lxyz1234-abc5678"
 * ```
 */
export function generateIdWithPrefix(prefix: string): string {
  return `${prefix}_${generateId()}`
}
