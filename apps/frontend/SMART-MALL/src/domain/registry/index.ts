/**
 * 注册表模块
 *
 * 这个模块提供语义对象和 Mesh 的生命周期管理和查询能力。
 * 是领域层的核心基础设施，所有语义对象都在这里注册和管理。
 *
 * 设计原则：
 * - 分离关注点：语义对象（业务）和 Mesh（渲染）分开管理
 * - 双向映射：支持从语义对象找 Mesh，也支持从 Mesh 找语义对象
 * - 高效查询：使用 Map 和索引实现 O(1) 查询
 *
 * 包含的注册表：
 *
 * 1. SemanticObjectRegistry（语义对象注册表）
 *    - 职责：管理所有语义对象的生命周期（注册/查询/注销）
 *    - 索引：按 ID、按类型、按业务 ID 三种查询方式
 *    - 场景：创建店铺、查询楼层、删除区域
 *
 * 2. MeshRegistry（Mesh 注册表）
 *    - 职责：管理语义对象与 Three.js Mesh 的双向映射
 *    - 场景：点击 Mesh 找到对应店铺、高亮店铺找到对应 Mesh
 *
 * 数据流示意：
 * ```
 * 业务数据 → SemanticObjectFactory → SemanticObjectRegistry
 *                                           ↓
 *                                    MeshRegistry ← Mesh 创建
 *                                           ↓
 *                                    双向映射建立
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { SemanticObjectRegistry, MeshRegistry } from '@/domain/registry'
 *
 * // 注册语义对象
 * const store = semanticRegistry.register({
 *   semanticType: SemanticType.STORE,
 *   businessId: 'store-001',
 *   // ...
 * })
 *
 * // 绑定 Mesh
 * meshRegistry.bind(store.id, storeMesh)
 *
 * // 通过 Mesh 找语义对象（射线检测后）
 * const semanticId = meshRegistry.getSemanticId(clickedMesh)
 * const semanticObject = semanticRegistry.getById(semanticId)
 * ```
 */

export { SemanticObjectRegistry } from './SemanticObjectRegistry'
export { MeshRegistry } from './MeshRegistry'
