/**
 * 商城数据加载器
 *
 * 职责：
 * - 从 API 或配置文件加载商城数据
 * - 数据格式转换和标准化
 * - 集成数据验证
 * - 提供加载状态和错误处理
 *
 * @example
 * ```typescript
 * const loader = new MallDataLoader(validator)
 *
 * // 从 API 加载
 * const result = await loader.loadFromApi('/api/mall/1')
 *
 * // 从配置对象加载
 * const result = await loader.loadFromConfig(mallConfig)
 *
 * if (result.success) {
 *   console.log('加载成功:', result.data)
 * } else {
 *   console.error('加载失败:', result.error)
 * }
 * ```
 */

import type { Mall, Floor, Area, Store, Product } from '../mall/mall.types'
import type { DomainResult } from '@/protocol/result.protocol'
import { ErrorCode } from '@/protocol/result.enums'
import { MallDataValidator, type ValidationResult } from './MallDataValidator'

// =============================================================================
// 类型定义
// =============================================================================

/** 加载选项 */
export interface LoadOptions {
  /** 是否跳过验证 */
  skipValidation?: boolean
  /** 请求超时时间（毫秒） */
  timeout?: number
  /** 自定义请求头 */
  headers?: Record<string, string>
}

/** 加载结果 */
export interface LoadResult {
  /** 商城数据 */
  mall: Mall
  /** 验证结果 */
  validation: ValidationResult
  /** 加载耗时（毫秒） */
  loadTime: number
}

// =============================================================================
// MallDataLoader 类
// =============================================================================

export class MallDataLoader {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** 数据验证器 */
  private validator: MallDataValidator

  /** 默认超时时间 */
  private static readonly DEFAULT_TIMEOUT = 30000

  // ===========================================================================
  // 构造函数
  // ===========================================================================

  /**
   * 创建商城数据加载器
   *
   * @param validator - 数据验证器（可选，默认创建新实例）
   */
  constructor(validator?: MallDataValidator) {
    this.validator = validator ?? new MallDataValidator()
  }

  // ===========================================================================
  // 公共方法 - 加载
  // ===========================================================================

  /**
   * 从 API 加载商城数据
   *
   * @param url - API 地址
   * @param options - 加载选项
   * @returns 加载结果
   */
  public async loadFromApi(
    url: string,
    options?: LoadOptions
  ): Promise<DomainResult<LoadResult>> {
    const startTime = performance.now()

    try {
      // 发起请求
      const response = await this.fetchWithTimeout(url, options)

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: ErrorCode.NETWORK_ERROR,
            message: `API 请求失败: ${response.status} ${response.statusText}`,
            details: `URL: ${url}`,
          },
        }
      }

      // 解析 JSON
      const data = await response.json()

      // 处理数据
      return this.processData(data, startTime, options)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      return {
        success: false,
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: `加载商城数据失败: ${errorMessage}`,
          details: `URL: ${url}`,
        },
      }
    }
  }

  /**
   * 从配置对象加载商城数据
   *
   * @param config - 商城配置数据
   * @param options - 加载选项
   * @returns 加载结果
   */
  public async loadFromConfig(
    config: unknown,
    options?: LoadOptions
  ): Promise<DomainResult<LoadResult>> {
    const startTime = performance.now()
    return this.processData(config, startTime, options)
  }

  /**
   * 从 JSON 字符串加载商城数据
   *
   * @param jsonString - JSON 字符串
   * @param options - 加载选项
   * @returns 加载结果
   */
  public async loadFromJson(
    jsonString: string,
    options?: LoadOptions
  ): Promise<DomainResult<LoadResult>> {
    const startTime = performance.now()

    try {
      const data = JSON.parse(jsonString)
      return this.processData(data, startTime, options)
    } catch (error) {
      return {
        success: false,
        error: {
          code: ErrorCode.INVALID_ACTION,
          message: 'JSON 解析失败',
          details: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  // ===========================================================================
  // 私有方法 - 数据处理
  // ===========================================================================

  /**
   * 处理加载的数据
   */
  private async processData(
    data: unknown,
    startTime: number,
    options?: LoadOptions
  ): Promise<DomainResult<LoadResult>> {
    // 验证数据
    const validation = options?.skipValidation
      ? { valid: true, errors: [], warnings: [] }
      : this.validator.validate(data)

    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: ErrorCode.INVALID_ACTION,
          message: '商城数据验证失败',
          details: validation.errors.map((e) => `${e.path}: ${e.message}`).join('; '),
          metadata: { errors: validation.errors },
        },
      }
    }

    // 标准化数据
    const mall = this.normalizeData(data as Record<string, unknown>)

    const loadTime = performance.now() - startTime

    return {
      success: true,
      data: {
        mall,
        validation,
        loadTime,
      },
    }
  }

  /**
   * 标准化商城数据
   * 确保所有字段都有默认值
   */
  private normalizeData(data: Record<string, unknown>): Mall {
    return {
      id: String(data.id),
      name: String(data.name),
      description: data.description as string | undefined,
      floors: this.normalizeFloors(data.floors as unknown[], String(data.id)),
      metadata: data.metadata as Record<string, unknown> | undefined,
    }
  }

  /**
   * 标准化楼层列表
   */
  private normalizeFloors(floors: unknown[], mallId: string): Floor[] {
    if (!Array.isArray(floors)) return []

    return floors.map((floor) => {
      const f = floor as Record<string, unknown>
      return {
        id: String(f.id),
        mallId,
        name: String(f.name),
        level: typeof f.level === 'number' ? f.level : 0,
        areas: this.normalizeAreas(f.areas as unknown[], String(f.id)),
        transform: f.transform as Floor['transform'],
      }
    })
  }

  /**
   * 标准化区域列表
   */
  private normalizeAreas(areas: unknown[], floorId: string): Area[] {
    if (!Array.isArray(areas)) return []

    return areas.map((area) => {
      const a = area as Record<string, unknown>
      return {
        id: String(a.id),
        floorId,
        name: String(a.name),
        type: a.type as Area['type'],
        status: a.status as Area['status'],
        boundary: a.boundary as Area['boundary'],
        stores: this.normalizeStores(a.stores as unknown[], String(a.id)),
        authorizedMerchantId: a.authorizedMerchantId as string | undefined,
        authorizationExpiry: a.authorizationExpiry as number | undefined,
      }
    })
  }

  /**
   * 标准化店铺列表
   */
  private normalizeStores(stores: unknown[], areaId: string): Store[] {
    if (!Array.isArray(stores)) return []

    return stores.map((store) => {
      const s = store as Record<string, unknown>
      return {
        id: String(s.id),
        areaId,
        name: String(s.name),
        merchantId: String(s.merchantId),
        description: s.description as string | undefined,
        transform: s.transform as Store['transform'],
        products: this.normalizeProducts(s.products as unknown[], String(s.id)),
        isHighlighted: s.isHighlighted as boolean | undefined,
        logoUrl: s.logoUrl as string | undefined,
        isOpen: s.isOpen as boolean | undefined,
      }
    })
  }

  /**
   * 标准化商品列表
   */
  private normalizeProducts(products: unknown[], storeId: string): Product[] {
    if (!Array.isArray(products)) return []

    return products.map((product) => {
      const p = product as Record<string, unknown>
      return {
        id: String(p.id),
        storeId,
        name: String(p.name),
        description: p.description as string | undefined,
        price: p.price as number | undefined,
        imageUrl: p.imageUrl as string | undefined,
        position: p.position as Product['position'],
        category: p.category as string | undefined,
        inStock: p.inStock as boolean | undefined,
      }
    })
  }

  // ===========================================================================
  // 私有方法 - 网络请求
  // ===========================================================================

  /**
   * 带超时的 fetch 请求
   */
  private async fetchWithTimeout(
    url: string,
    options?: LoadOptions
  ): Promise<Response> {
    const timeout = options?.timeout ?? MallDataLoader.DEFAULT_TIMEOUT

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: options?.headers,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
