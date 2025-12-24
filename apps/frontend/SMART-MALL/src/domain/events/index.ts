/**
 * 领域事件 - 统一导出
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
