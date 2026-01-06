/**
 * ============================================================================
 * 协议层 - 统一导出 (index.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 作为 Protocol 层的统一入口，导出所有协议定义。
 * 其他模块只需要从 '@/protocol' 导入，不需要知道具体的文件路径。
 * 
 * 【Protocol 层概述】
 * Protocol 层定义了系统边界的交互协议，是"行为驱动架构"的核心：
 * 
 * 1. Action 协议（输入协议）
 *    - action.enums.ts: 行为类型和来源的枚举定义
 *    - action.protocol.ts: Action 接口和 Payload 类型定义
 *    
 * 2. Result 协议（输出协议）
 *    - result.enums.ts: 错误码枚举定义
 *    - result.protocol.ts: 结果接口和错误类型定义
 * 
 * 【业务价值】
 * - 统一接口：所有模块使用相同的协议进行通信
 * - 类型安全：TypeScript 类型系统确保协议的正确使用
 * - 可扩展性：新增行为只需添加枚举值和 Payload 类型
 * - AI 友好：AI Agent 可以通过协议与系统交互
 * 
 * 【使用示例】
 * ```typescript
 * import { 
 *   ActionType, 
 *   ActionSource, 
 *   ErrorCode,
 *   type Action,
 *   type DomainResult 
 * } from '@/protocol'
 * 
 * // 创建一个导航 Action
 * const action: Action<ActionType.NAVIGATE_TO_STORE> = {
 *   type: ActionType.NAVIGATE_TO_STORE,
 *   payload: { storeId: 'store-001' },
 *   source: ActionSource.UI,
 *   timestamp: Date.now()
 * }
 * 
 * // 处理结果
 * const result: DomainResult<void> = {
 *   success: true,
 *   data: undefined
 * }
 * ```
 * 
 * ============================================================================
 */

// ============================================================================
// Action 协议（输入协议）
// ============================================================================

/** 行为类型和来源枚举 */
export * from './action.enums'

/** Action 接口和 Payload 类型定义 */
export * from './action.protocol'

// ============================================================================
// Result 协议（输出协议）
// ============================================================================

/** 错误码枚举 */
export * from './result.enums'

/** 结果接口和错误类型定义 */
export * from './result.protocol'
