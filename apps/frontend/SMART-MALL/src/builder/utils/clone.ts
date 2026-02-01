/**
 * 深拷贝工具函数
 * 
 * 提供统一的深拷贝实现，避免代码重复
 */

/**
 * 深拷贝对象
 * 
 * 使用 structuredClone API 实现深拷贝（现代浏览器原生支持）
 * 相比 JSON.parse(JSON.stringify()) 的优势：
 * - 性能更好
 * - 支持更多类型（Date、RegExp、Map、Set、ArrayBuffer 等）
 * - 支持循环引用
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
  return structuredClone(obj)
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
