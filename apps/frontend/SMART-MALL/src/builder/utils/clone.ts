/**
 * 深拷贝工具函数
 * 
 * 提供统一的深拷贝实现，避免代码重复
 */

/**
 * 深拷贝对象
 * 
 * 使用 JSON 序列化/反序列化实现深拷贝
 * 注意：不支持函数、Symbol、循环引用等特殊类型
 * 
 * @param obj - 要拷贝的对象
 * @returns 拷贝后的对象
 * 
 * @example
 * ```typescript
 * const original = { name: 'Mall', floors: [{ id: '1' }] }
 * const copy = deepClone(original)
 * copy.name = 'New Mall'
 * console.log(original.name) // 'Mall' (未被修改)
 * ```
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 浅拷贝对象
 * 
 * @param obj - 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T
  }
  if (typeof obj === 'object' && obj !== null) {
    return { ...obj }
  }
  return obj
}
