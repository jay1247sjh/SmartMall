/**
 * 商城数据验证器
 *
 * 职责：
 * - 验证商城配置数据的结构完整性
 * - 验证必填字段
 * - 验证引用关系（如 Store.areaId 必须存在对应的 Area）
 * - 返回详细的验证错误信息
 *
 * @example
 * ```typescript
 * const validator = new MallDataValidator()
 * const result = validator.validate(mallData)
 *
 * if (!result.valid) {
 *   console.error('验证失败:', result.errors)
 * }
 * ```
 */

// =============================================================================
// 类型定义
// =============================================================================

/** 验证错误 */
export interface ValidationError {
  /** 错误路径（如 "floors[0].areas[1].stores[2].name"） */
  path: string
  /** 错误消息 */
  message: string
  /** 错误类型 */
  type: 'required' | 'type' | 'reference' | 'format' | 'range'
  /** 实际值（可选） */
  actualValue?: unknown
}

/** 验证结果 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误列表 */
  errors: ValidationError[]
  /** 警告列表（不影响验证结果） */
  warnings: string[]
}

// =============================================================================
// MallDataValidator 类
// =============================================================================

export class MallDataValidator {
  // ===========================================================================
  // 私有属性
  // ===========================================================================

  /** 错误列表 */
  private errors: ValidationError[] = []

  /** 警告列表 */
  private warnings: string[] = []

  /** 已注册的楼层 ID 集合 */
  private floorIds: Set<string> = new Set()

  /** 已注册的区域 ID 集合 */
  private areaIds: Set<string> = new Set()

  /** 已注册的店铺 ID 集合 */
  private storeIds: Set<string> = new Set()

  // ===========================================================================
  // 公共方法
  // ===========================================================================

  /**
   * 验证商城数据
   *
   * @param mall - 商城数据
   * @returns 验证结果
   */
  public validate(mall: unknown): ValidationResult {
    // 重置状态
    this.reset()

    // 验证顶层结构
    if (!this.isObject(mall)) {
      this.addError('', '商城数据必须是对象', 'type', mall)
      return this.getResult()
    }

    const mallData = mall as Record<string, unknown>

    // 验证必填字段
    this.validateRequired(mallData, 'id', '')
    this.validateRequired(mallData, 'name', '')

    // 验证楼层数组
    if (!Array.isArray(mallData.floors)) {
      this.addError('floors', '楼层列表必须是数组', 'type', mallData.floors)
    } else {
      this.validateFloors(mallData.floors as unknown[], mallData.id as string)
    }

    return this.getResult()
  }

  /**
   * 快速验证（只检查基本结构）
   *
   * @param mall - 商城数据
   * @returns 是否通过基本验证
   */
  public quickValidate(mall: unknown): boolean {
    if (!this.isObject(mall)) return false

    const mallData = mall as Record<string, unknown>
    if (!mallData.id || !mallData.name) return false
    if (!Array.isArray(mallData.floors)) return false

    return true
  }

  // ===========================================================================
  // 私有方法 - 验证逻辑
  // ===========================================================================

  /**
   * 验证楼层列表
   */
  private validateFloors(floors: unknown[], mallId: string): void {
    floors.forEach((floor, index) => {
      const path = `floors[${index}]`

      if (!this.isObject(floor)) {
        this.addError(path, '楼层数据必须是对象', 'type', floor)
        return
      }

      const floorData = floor as Record<string, unknown>

      // 验证必填字段
      this.validateRequired(floorData, 'id', path)
      this.validateRequired(floorData, 'name', path)

      // 验证 mallId 引用
      if (floorData.mallId !== mallId) {
        this.addWarning(`${path}.mallId 与父商城 ID 不匹配`)
      }

      // 验证 level 字段
      if (floorData.level !== undefined && typeof floorData.level !== 'number') {
        this.addError(`${path}.level`, '楼层编号必须是数字', 'type', floorData.level)
      }

      // 记录楼层 ID
      if (typeof floorData.id === 'string') {
        if (this.floorIds.has(floorData.id)) {
          this.addError(`${path}.id`, `楼层 ID 重复: ${floorData.id}`, 'format', floorData.id)
        } else {
          this.floorIds.add(floorData.id)
        }
      }

      // 验证区域数组
      if (!Array.isArray(floorData.areas)) {
        this.addError(`${path}.areas`, '区域列表必须是数组', 'type', floorData.areas)
      } else {
        this.validateAreas(floorData.areas as unknown[], floorData.id as string, path)
      }
    })
  }

  /**
   * 验证区域列表
   */
  private validateAreas(areas: unknown[], floorId: string, parentPath: string): void {
    areas.forEach((area, index) => {
      const path = `${parentPath}.areas[${index}]`

      if (!this.isObject(area)) {
        this.addError(path, '区域数据必须是对象', 'type', area)
        return
      }

      const areaData = area as Record<string, unknown>

      // 验证必填字段
      this.validateRequired(areaData, 'id', path)
      this.validateRequired(areaData, 'name', path)

      // 验证 floorId 引用
      if (areaData.floorId !== floorId) {
        this.addWarning(`${path}.floorId 与父楼层 ID 不匹配`)
      }

      // 验证边界框
      if (areaData.boundary !== undefined) {
        this.validateBoundingBox(areaData.boundary, `${path}.boundary`)
      }

      // 记录区域 ID
      if (typeof areaData.id === 'string') {
        if (this.areaIds.has(areaData.id)) {
          this.addError(`${path}.id`, `区域 ID 重复: ${areaData.id}`, 'format', areaData.id)
        } else {
          this.areaIds.add(areaData.id)
        }
      }

      // 验证店铺数组
      if (!Array.isArray(areaData.stores)) {
        this.addError(`${path}.stores`, '店铺列表必须是数组', 'type', areaData.stores)
      } else {
        this.validateStores(areaData.stores as unknown[], areaData.id as string, path)
      }
    })
  }

  /**
   * 验证店铺列表
   */
  private validateStores(stores: unknown[], areaId: string, parentPath: string): void {
    stores.forEach((store, index) => {
      const path = `${parentPath}.stores[${index}]`

      if (!this.isObject(store)) {
        this.addError(path, '店铺数据必须是对象', 'type', store)
        return
      }

      const storeData = store as Record<string, unknown>

      // 验证必填字段
      this.validateRequired(storeData, 'id', path)
      this.validateRequired(storeData, 'name', path)
      this.validateRequired(storeData, 'merchantId', path)

      // 验证 areaId 引用
      if (storeData.areaId !== areaId) {
        this.addWarning(`${path}.areaId 与父区域 ID 不匹配`)
      }

      // 验证变换
      if (storeData.transform !== undefined) {
        this.validateTransform(storeData.transform, `${path}.transform`)
      }

      // 记录店铺 ID
      if (typeof storeData.id === 'string') {
        if (this.storeIds.has(storeData.id)) {
          this.addError(`${path}.id`, `店铺 ID 重复: ${storeData.id}`, 'format', storeData.id)
        } else {
          this.storeIds.add(storeData.id)
        }
      }

      // 验证商品数组（可选）
      if (storeData.products !== undefined && !Array.isArray(storeData.products)) {
        this.addError(`${path}.products`, '商品列表必须是数组', 'type', storeData.products)
      }
    })
  }

  /**
   * 验证边界框
   */
  private validateBoundingBox(boundary: unknown, path: string): void {
    if (!this.isObject(boundary)) {
      this.addError(path, '边界框必须是对象', 'type', boundary)
      return
    }

    const box = boundary as Record<string, unknown>

    // 验证 min 和 max
    if (!this.isObject(box.min)) {
      this.addError(`${path}.min`, '边界框最小点必须是对象', 'type', box.min)
    } else {
      this.validateVector3(box.min, `${path}.min`)
    }

    if (!this.isObject(box.max)) {
      this.addError(`${path}.max`, '边界框最大点必须是对象', 'type', box.max)
    } else {
      this.validateVector3(box.max, `${path}.max`)
    }
  }

  /**
   * 验证变换
   */
  private validateTransform(transform: unknown, path: string): void {
    if (!this.isObject(transform)) {
      this.addError(path, '变换必须是对象', 'type', transform)
      return
    }

    const t = transform as Record<string, unknown>

    // 验证 position（必填）
    if (t.position !== undefined) {
      this.validateVector3(t.position, `${path}.position`)
    }

    // 验证 rotation（可选）
    if (t.rotation !== undefined) {
      this.validateVector3(t.rotation, `${path}.rotation`)
    }

    // 验证 scale（可选）
    if (t.scale !== undefined) {
      this.validateVector3(t.scale, `${path}.scale`)
    }
  }

  /**
   * 验证 Vector3
   */
  private validateVector3(vector: unknown, path: string): void {
    if (!this.isObject(vector)) {
      this.addError(path, '向量必须是对象', 'type', vector)
      return
    }

    const v = vector as Record<string, unknown>

    if (typeof v.x !== 'number') {
      this.addError(`${path}.x`, 'x 坐标必须是数字', 'type', v.x)
    }
    if (typeof v.y !== 'number') {
      this.addError(`${path}.y`, 'y 坐标必须是数字', 'type', v.y)
    }
    if (typeof v.z !== 'number') {
      this.addError(`${path}.z`, 'z 坐标必须是数字', 'type', v.z)
    }
  }

  // ===========================================================================
  // 私有方法 - 辅助函数
  // ===========================================================================

  /**
   * 验证必填字段
   */
  private validateRequired(obj: Record<string, unknown>, field: string, parentPath: string): void {
    const path = parentPath ? `${parentPath}.${field}` : field
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      this.addError(path, `${field} 是必填字段`, 'required')
    }
  }

  /**
   * 检查是否为对象
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  }

  /**
   * 添加错误
   */
  private addError(
    path: string,
    message: string,
    type: ValidationError['type'],
    actualValue?: unknown
  ): void {
    this.errors.push({ path, message, type, actualValue })
  }

  /**
   * 添加警告
   */
  private addWarning(message: string): void {
    this.warnings.push(message)
  }

  /**
   * 重置状态
   */
  private reset(): void {
    this.errors = []
    this.warnings = []
    this.floorIds.clear()
    this.areaIds.clear()
    this.storeIds.clear()
  }

  /**
   * 获取验证结果
   */
  private getResult(): ValidationResult {
    return {
      valid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    }
  }
}
