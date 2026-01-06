/**
 * 领域事件模块
 *
 * 这个模块实现了领域驱动设计（DDD）中的领域事件模式，
 * 用于解耦不同模块之间的通信，实现松耦合的事件驱动架构。
 *
 * 设计原则：
 * - 发布-订阅模式：发布者不需要知道订阅者是谁
 * - 类型安全：使用 TypeScript 泛型确保事件类型和数据匹配
 * - 单例模式：全局唯一的事件总线，方便跨模块通信
 *
 * 包含的组件：
 *
 * 1. DomainEventBus（领域事件总线）
 *    - 职责：事件的发布和订阅管理
 *    - 特点：类型安全、支持取消订阅、全局单例
 *    - 场景：店铺选中、楼层切换、区域聚焦
 *
 * 2. DomainEventHandler（领域事件处理器）
 *    - 职责：统一处理领域事件，协调各模块响应
 *    - 场景：选中店铺时同时更新 UI 和 3D 高亮
 *
 * 支持的事件类型：
 * - store.selected：店铺被选中（点击）
 * - store.focused：店铺被聚焦（悬停）
 * - store.unfocused：店铺失去聚焦
 * - area.selected：区域被选中
 * - floor.selected：楼层被选中
 * - scene.backgroundClick：点击场景空白处
 *
 * 数据流示意：
 * ```
 * 用户交互 → SceneEventEmitter → DomainEventHandler → DomainEventBus
 *                                                           ↓
 *                                                    各模块订阅者
 *                                                    (UI、Store、3D)
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { domainEventBus } from '@/domain/events'
 *
 * // 订阅店铺选中事件
 * const unsubscribe = domainEventBus.on('store.selected', (data) => {
 *   console.log('选中了店铺:', data.storeId)
 * })
 *
 * // 发布事件
 * domainEventBus.emit('store.selected', { storeId: 'store-001' })
 *
 * // 取消订阅
 * unsubscribe()
 * ```
 */

export {
  DomainEventBus,
  domainEventBus,
  type DomainEventType,
  type DomainEventMap,
  type DomainEventCallback,
  type StoreSelectedEventData,
  type StoreFocusedEventData,
  type StoreUnfocusedEventData,
  type AreaSelectedEventData,
  type FloorSelectedEventData,
  type SceneBackgroundClickEventData,
} from './DomainEventBus'

export { DomainEventHandler } from './DomainEventHandler'
