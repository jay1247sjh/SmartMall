/**
 * 3D 场景领域模块
 *
 * 这个模块定义了 3D 场景的核心概念，是连接业务层和渲染层的桥梁。
 *
 * 设计原则：
 * - 语义化：将 3D 对象赋予业务含义（店铺、楼层、区域）
 * - 解耦：领域层不直接依赖 Three.js，通过语义对象间接操作
 * - 可扩展：支持添加新的语义类型和属性
 *
 * 核心概念：
 *
 * 1. SemanticObject（语义对象）
 *    - 定义：带有业务含义的 3D 对象抽象
 *    - 属性：ID、类型、业务ID、变换、边界框、元数据
 *    - 作用：将 Mesh 与业务实体关联
 *
 * 2. SemanticType（语义类型）
 *    - FLOOR：楼层
 *    - AREA：区域
 *    - STORE：店铺
 *    - FACILITY：设施（电梯、扶梯、洗手间）
 *    - DECORATION：装饰物
 *
 * 3. Transform（变换）
 *    - position：位置 (x, y, z)
 *    - rotation：旋转 (x, y, z)
 *    - scale：缩放 (x, y, z)
 *
 * 数据流示意：
 * ```
 * 业务实体 (Store)          语义对象 (SemanticObject)          3D 对象 (Mesh)
 *      ↓                            ↓                              ↓
 *   id: "store-001"    →    businessId: "store-001"    →    userData.semanticId
 *   name: "星巴克"           semanticType: STORE              geometry + material
 *   areaId: "area-001"       transform: {...}
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { SemanticType, type SemanticObject } from '@/domain/scene'
 *
 * // 创建店铺语义对象
 * const storeObject: SemanticObject = {
 *   id: 'store_1_xxx',
 *   semanticType: SemanticType.STORE,
 *   businessId: 'store-001',
 *   transform: { position: [10, 0, 5], rotation: [0, 0, 0], scale: [1, 1, 1] },
 *   // ...
 * }
 * ```
 */

export * from './scene.types'
export * from './scene.enums'
export * from './scene.model'
export * from './scene.utils'
