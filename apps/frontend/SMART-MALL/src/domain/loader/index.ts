/**
 * 数据加载器模块
 *
 * 这个模块负责从后端 API 加载商城数据，并进行验证和转换。
 *
 * 设计原则：
 * - 职责分离：加载和验证分开，便于测试和维护
 * - 错误处理：提供详细的验证错误信息
 * - 类型安全：确保加载的数据符合预期结构
 *
 * 包含的组件：
 *
 * 1. MallDataLoader（商城数据加载器）
 *    - 职责：从 API 加载商城数据，创建语义对象
 *    - 流程：API 请求 → 数据验证 → 语义对象创建 → Mesh 绑定
 *    - 场景：进入商城页面时加载数据
 *
 * 2. MallDataValidator（商城数据验证器）
 *    - 职责：验证 API 返回的数据结构和业务规则
 *    - 验证项：必填字段、数据类型、引用完整性
 *    - 场景：加载数据前验证、导入配置时验证
 *
 * 数据流示意：
 * ```
 * API 响应 → MallDataValidator → MallDataLoader → SemanticObjectFactory
 *              ↓                      ↓                    ↓
 *         验证结果              加载结果            语义对象
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { MallDataLoader, MallDataValidator } from '@/domain/loader'
 *
 * // 验证数据
 * const validationResult = validator.validate(mallData)
 * if (!validationResult.valid) {
 *   console.error('数据验证失败:', validationResult.errors)
 *   return
 * }
 *
 * // 加载数据
 * const loadResult = await loader.load(mallId)
 * if (loadResult.success) {
 *   console.log('加载成功:', loadResult.statistics)
 * }
 * ```
 */

export {
  MallDataLoader,
  type LoadOptions,
  type LoadResult,
} from './MallDataLoader'

export {
  MallDataValidator,
  type ValidationError,
  type ValidationResult,
} from './MallDataValidator'
