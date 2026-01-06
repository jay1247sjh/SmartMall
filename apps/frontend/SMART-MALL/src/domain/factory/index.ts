/**
 * 语义对象工厂模块
 *
 * 这个模块提供从业务实体创建语义对象的能力，是领域层的核心工厂。
 *
 * 设计原则：
 * - 工厂模式：封装语义对象的创建逻辑
 * - 数据转换：将后端 API 返回的业务数据转换为语义对象
 * - 默认值处理：为缺失的字段提供合理的默认值
 *
 * 业务场景：
 * - 加载商城数据时，将 Floor、Area、Store 转换为语义对象
 * - 创建新店铺时，生成对应的语义对象
 * - 导入商城配置时，批量创建语义对象
 *
 * 数据流示意：
 * ```
 * API 响应 → MallDataLoader → SemanticObjectFactory → SemanticObjectRegistry
 *   ↓                                                        ↓
 * Floor/Area/Store                                    SemanticObject
 * (业务实体)                                           (语义对象)
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { SemanticObjectFactory } from '@/domain/factory'
 *
 * const factory = new SemanticObjectFactory(semanticRegistry)
 *
 * // 从业务数据创建店铺语义对象
 * const storeSemanticObject = factory.createStore(storeData, areaSemanticId)
 * ```
 */

export { SemanticObjectFactory } from './SemanticObjectFactory'
