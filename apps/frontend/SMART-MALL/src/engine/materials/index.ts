/**
 * 材质模块导出
 *
 * 这个模块包含材质管理相关的类：
 * - MaterialManager: 材质创建、缓存、复用管理器
 *
 * 使用示例：
 * ```typescript
 * import { MaterialManager } from '@/engine/materials'
 *
 * const materialManager = new MaterialManager()
 * const redMaterial = materialManager.getStandardMaterial({ color: 0xff0000 })
 * ```
 */

export { MaterialManager } from './MaterialManager'
export type { StandardMaterialOptions, BasicMaterialOptions } from './MaterialManager'
