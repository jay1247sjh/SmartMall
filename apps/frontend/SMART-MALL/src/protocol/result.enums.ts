/**
 * ============================================================================
 * 结果协议 - 枚举定义 (result.enums.ts)
 * ============================================================================
 * 
 * 【文件职责】
 * 定义系统中所有可能的错误码（ErrorCode）。
 * 这是 Protocol 层的错误分类标准，为整个系统提供统一的错误处理机制。
 * 
 * 【业务背景】
 * 智慧商城系统涉及多种业务场景，每种场景都可能产生特定的错误：
 * - 导航错误：目标不存在、目标未就绪
 * - 权限错误：无权限、权限过期、区域被占用
 * - 建模错误：边界越界、版本冲突
 * - 系统错误：网络问题、数据验证失败
 * 
 * 【设计原则】
 * 1. 语义明确：错误码应清晰表达错误原因
 * 2. 可操作性：前端可根据错误码给出针对性的用户提示
 * 3. 可追溯性：错误码便于日志分析和问题定位
 * 
 * 【与其他模块的关系】
 * - result.protocol.ts：使用 ErrorCode 构建 DomainError
 * - domain/behaviors/：行为处理器返回带有 ErrorCode 的结果
 * - views/：视图层根据 ErrorCode 显示对应的错误提示
 * 
 * ============================================================================
 */

/**
 * 错误码枚举
 * 
 * 按业务场景分类的错误码，每个错误码都有明确的业务含义：
 * 
 * 【通用错误】
 * - SUCCESS: 操作成功（虽然不是错误，但统一放在这里便于结果判断）
 * - INVALID_ACTION: 无效的操作（参数错误、数据验证失败）
 * - NETWORK_ERROR: 网络错误（请求超时、服务不可用）
 * 
 * 【权限错误】
 * - PERMISSION_DENIED: 权限不足（用户角色无权执行此操作）
 * - AREA_NOT_AUTHORIZED: 区域未授权（商家未获得该区域的建模权限）
 * - AUTHORIZATION_EXPIRED: 授权已过期（建模权限超过有效期）
 * 
 * 【目标错误】
 * - TARGET_NOT_FOUND: 目标不存在（店铺、区域、对象不存在）
 * - TARGET_NOT_READY: 目标未就绪（3D 模型未加载完成）
 * - CONTEXT_MISMATCH: 上下文不匹配（操作与当前状态不符）
 * 
 * 【建模错误】
 * - BOUNDARY_VIOLATION: 边界越界（对象超出授权区域范围）
 * - AREA_ALREADY_OCCUPIED: 区域已被占用（其他商家正在使用）
 * 
 * 【版本管理错误】
 * - INVALID_LAYOUT_VERSION: 无效的布局版本
 * - PROPOSAL_ALREADY_SUBMITTED: 提案已提交（重复提交）
 * - CANNOT_PUBLISH_DRAFT: 无法发布草稿（草稿状态不允许发布）
 */
export enum ErrorCode {
  // ===== 通用错误 =====
  /** 操作成功 */
  SUCCESS = 'SUCCESS',
  /** 无效的操作（参数错误、数据验证失败） */
  INVALID_ACTION = 'INVALID_ACTION',
  /** 网络错误（请求超时、服务不可用） */
  NETWORK_ERROR = 'NETWORK_ERROR',

  // ===== 权限错误 =====
  /** 权限不足（用户角色无权执行此操作） */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 区域未授权（商家未获得该区域的建模权限） */
  AREA_NOT_AUTHORIZED = 'AREA_NOT_AUTHORIZED',
  /** 授权已过期（建模权限超过有效期） */
  AUTHORIZATION_EXPIRED = 'AUTHORIZATION_EXPIRED',

  // ===== 目标错误 =====
  /** 目标不存在（店铺、区域、对象不存在） */
  TARGET_NOT_FOUND = 'TARGET_NOT_FOUND',
  /** 目标未就绪（3D 模型未加载完成） */
  TARGET_NOT_READY = 'TARGET_NOT_READY',
  /** 上下文不匹配（操作与当前状态不符） */
  CONTEXT_MISMATCH = 'CONTEXT_MISMATCH',

  // ===== 建模错误 =====
  /** 边界越界（对象超出授权区域范围） */
  BOUNDARY_VIOLATION = 'BOUNDARY_VIOLATION',
  /** 区域已被占用（其他商家正在使用） */
  AREA_ALREADY_OCCUPIED = 'AREA_ALREADY_OCCUPIED',

  // ===== 版本管理错误 =====
  /** 无效的布局版本 */
  INVALID_LAYOUT_VERSION = 'INVALID_LAYOUT_VERSION',
  /** 提案已提交（重复提交） */
  PROPOSAL_ALREADY_SUBMITTED = 'PROPOSAL_ALREADY_SUBMITTED',
  /** 无法发布草稿（草稿状态不允许发布） */
  CANNOT_PUBLISH_DRAFT = 'CANNOT_PUBLISH_DRAFT'
}
