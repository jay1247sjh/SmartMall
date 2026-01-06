/**
 * 领域行为模块
 *
 * 这个模块包含连接领域层和渲染层的行为类，实现业务逻辑与 3D 渲染的解耦。
 *
 * 设计原则：
 * - 行为类作为"桥梁"，连接语义对象（业务）和 Mesh（渲染）
 * - 领域层不直接操作 Three.js，通过行为类间接控制
 * - 每个行为类专注于一个职责（单一职责原则）
 *
 * 包含的行为类：
 *
 * 1. HighlightBehavior（高亮行为）
 *    - 职责：通过语义对象 ID 控制 3D 对象的高亮效果
 *    - 场景：鼠标悬停店铺高亮、点击选中店铺高亮
 *    - 依赖：MeshRegistry（获取 Mesh）、HighlightEffect（应用效果）
 *
 * 2. NavigationBehavior（导航行为）
 *    - 职责：通过语义对象 ID 导航相机到目标位置
 *    - 场景：点击店铺列表跳转、楼层切换、区域导航
 *    - 依赖：MeshRegistry（获取目标位置）、CameraController（执行动画）
 *
 * 3. SceneQueryBehavior（场景查询行为）
 *    - 职责：提供统一的场景查询接口，聚合多个管理器的查询能力
 *    - 场景：获取店铺列表、楼层信息、区域统计
 *    - 依赖：StoreManager、FloorManager、SemanticObjectRegistry
 *
 * 数据流示意：
 * ```
 * UI 组件 → 行为类 → 管理器/注册表 → 语义对象
 *                 ↓
 *           MeshRegistry → Mesh → 渲染效果
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { HighlightBehavior, NavigationBehavior } from '@/domain/behaviors'
 *
 * // 高亮店铺
 * highlightBehavior.highlightStore('store_1_xxx')
 *
 * // 导航到店铺
 * navigationBehavior.navigateToStore('store_1_xxx')
 * ```
 */

export { HighlightBehavior } from './HighlightBehavior'
export {
  NavigationBehavior,
  type NavigationOptions,
  type NavigationResult,
} from './NavigationBehavior'
export {
  SceneQueryBehavior,
  type StoreQueryResult,
  type FloorQueryResult,
  type AreaQueryResult,
  type SceneStatistics,
} from './SceneQueryBehavior'
