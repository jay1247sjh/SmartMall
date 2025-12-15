/**
 * 对象模块导出
 *
 * 这个模块包含 3D 对象创建相关的类：
 * - GeometryFactory: 几何体工厂（创建、缓存、复用）
 *
 * 使用示例：
 * ```typescript
 * import { GeometryFactory } from '@/engine/objects'
 *
 * const geometryFactory = new GeometryFactory()
 * const boxGeometry = geometryFactory.getBoxGeometry({ width: 2, height: 1, depth: 1 })
 * ```
 */

export { GeometryFactory } from './GeometryFactory'
export type { BoxGeometryOptions, PlaneGeometryOptions } from './GeometryFactory'

export { ObjectPool } from './ObjectPool'
export type { ObjectPoolOptions } from './ObjectPool'
