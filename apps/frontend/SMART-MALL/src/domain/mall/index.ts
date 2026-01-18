/**
 * 商城领域模块
 *
 * 这个模块包含商城业务的核心领域模型和管理器，是整个应用的业务核心。
 *
 * 设计原则：
 * - 领域驱动设计（DDD）：以业务概念为中心组织代码
 * - 聚合根模式：MallManager 作为聚合根，协调 Floor 和 Store
 * - 类型安全：使用 TypeScript 枚举和接口确保类型正确
 *
 * 包含的组件：
 *
 * 1. 枚举定义（mall.enums.ts）
 *    - StoreStatus：店铺状态（营业中、休息中、装修中）
 *    - AreaType：区域类型（零售、餐饮、娱乐）
 *    - AreaStatus：区域状态（空置、已租、预留）
 *
 * 2. 类型定义（mall.types.ts）
 *    - Mall：商城实体
 *    - Floor：楼层实体
 *    - Area：区域实体
 *    - Store：店铺实体
 *
 * 3. 管理器类
 *    - MallManager：商城管理器（聚合根）
 *    - FloorManager：楼层管理器
 *    - StoreManager：店铺管理器
 *
 * 业务层次结构：
 * ```
 * Mall（商城）
 *   └── Floor（楼层）
 *         └── Area（区域）
 *               └── Store（店铺）
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { StoreManager, FloorManager, StoreStatus } from '@/domain/mall'
 *
 * // 获取所有营业中的店铺
 * const openStores = storeManager.getStoresByStatus(StoreStatus.OPEN)
 *
 * // 获取指定楼层
 * const floor = floorManager.getFloorByLevel(1)
 * ```
 */

export * from './mall.enums'
export * from './mall.types'
export * from './mall.constants'
export { StoreManager } from './StoreManager'
export { FloorManager } from './FloorManager'
export { MallManager } from './MallManager'
