/**
 * API 统一响应格式
 * 
 * 前后端共用的响应结构定义
 * 
 * @shared 前端、后端、AI服务共用
 */

/**
 * 统一响应结构
 */
export interface ApiResponse<T = unknown> {
  /** 状态码 */
  code: number
  /** 消息 */
  message: string
  /** 数据 */
  data: T
  /** 时间戳 */
  timestamp?: number
}

/**
 * 分页请求参数
 */
export interface PageRequest {
  /** 页码（从1开始） */
  page: number
  /** 每页数量 */
  size: number
  /** 排序字段 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分页响应结构
 */
export interface PageResponse<T> {
  /** 数据列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  size: number
  /** 总页数 */
  pages: number
}

/**
 * 成功响应码
 */
export const SUCCESS_CODE = 200

/**
 * 常用错误码
 */
export enum ErrorCode {
  /** 成功 */
  SUCCESS = 200,
  /** 参数错误 */
  BAD_REQUEST = 400,
  /** 未授权 */
  UNAUTHORIZED = 401,
  /** 禁止访问 */
  FORBIDDEN = 403,
  /** 资源不存在 */
  NOT_FOUND = 404,
  /** 服务器错误 */
  INTERNAL_ERROR = 500
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: SUCCESS_CODE,
    message,
    data,
    timestamp: Date.now()
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(code: number, message: string): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now()
  }
}
