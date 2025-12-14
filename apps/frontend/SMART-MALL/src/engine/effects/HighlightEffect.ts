/**
 * 高亮效果管理器
 *
 * 这个类负责管理 3D 对象的高亮效果，包括：
 * - 悬停高亮（鼠标移到对象上时）
 * - 选中高亮（点击对象后）
 * - 高亮样式管理（颜色、强度）
 *
 * 设计原则：
 * - 简单：使用 Three.js 内置的 emissive（自发光）属性
 * - 可扩展：预留接口支持更复杂的效果（如描边）
 * - 状态管理：跟踪当前悬停和选中的对象
 *
 * 使用示例：
 * ```typescript
 * const highlightEffect = new HighlightEffect()
 *
 * // 设置悬停高亮
 * highlightEffect.setHover(mesh)
 *
 * // 清除悬停高亮
 * highlightEffect.clearHover()
 *
 * // 设置选中高亮
 * highlightEffect.setSelected(mesh)
 * ```
 */

import * as THREE from 'three'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 高亮配置选项
 */
export interface HighlightOptions {
  /**
   * 悬停时的发光颜色（十六进制）
   * 默认：0x666666（中灰色）
   */
  hoverColor?: number

  /**
   * 选中时的发光颜色（十六进制）
   * 默认：0xffaa00（橙黄色）
   */
  selectedColor?: number

  /**
   * 发光强度（0-1）
   * 默认：0.5
   */
  intensity?: number
}

/**
 * 对象原始材质信息
 * 用于恢复对象的原始状态
 */
interface OriginalMaterialState {
  /** 原始自发光颜色 */
  emissive: THREE.Color
  /** 原始自发光强度 */
  emissiveIntensity: number
}

// ============================================================================
// HighlightEffect 类
// ============================================================================

export class HighlightEffect {
  // ==========================================================================
  // 私有属性
  // ==========================================================================

  /**
   * 高亮配置
   */
  private options: Required<HighlightOptions>

  /**
   * 当前悬停的对象
   * null 表示没有对象被悬停
   */
  private currentHoverObject: THREE.Mesh | null = null

  /**
   * 当前选中的对象
   * null 表示没有对象被选中
   */
  private currentSelectedObject: THREE.Mesh | null = null

  /**
   * 对象原始材质状态存储
   * 
   * 数据结构：Map<对象ID, 原始材质状态>
   * 用于在清除高亮时恢复对象的原始外观
   */
  private originalStates: Map<number, OriginalMaterialState> = new Map()

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  /**
   * 创建高亮效果管理器
   *
   * @param options - 高亮配置选项（可选）
   */
  constructor(options: HighlightOptions = {}) {
    // 合并默认配置和用户配置
    this.options = {
      hoverColor: options.hoverColor ?? 0x666666,      // 悬停：中灰色
      selectedColor: options.selectedColor ?? 0xffaa00, // 选中：橙黄色
      intensity: options.intensity ?? 0.5               // 强度：50%
    }
  }

  // ==========================================================================
  // 公共方法 - 悬停高亮
  // ==========================================================================

  /**
   * 设置悬停高亮
   *
   * 当鼠标移到对象上时调用，让对象发光
   *
   * 实现逻辑：
   * 1. 检查是否和当前悬停对象相同（避免重复操作）
   * 2. 清除之前的悬停高亮
   * 3. 保存新对象的原始状态
   * 4. 应用悬停高亮效果（灰色发光）
   * 5. 更新当前悬停对象
   *
   * @param object - 要高亮的 3D 对象
   *
   * @example
   * ```typescript
   * // 在 hover 事件中使用
   * eventEmitter.on('hover', (data) => {
   *   if (data.object instanceof THREE.Mesh) {
   *     highlightEffect.setHover(data.object)
   *   }
   * })
   * ```
   */
  public setHover(object: THREE.Mesh): void {
    // 步骤 1: 检查是否和当前悬停对象相同
    // 如果鼠标还在同一个对象上，不需要重复操作
    if (this.currentHoverObject === object) {
      return
    }

    // 步骤 2: 清除之前的悬停高亮
    // 如果之前有悬停对象，先恢复它的原始状态
    this.clearHover()

    // 步骤 3: 保存新对象的原始状态
    // 以便后续恢复
    this.saveOriginalState(object)

    // 步骤 4: 应用悬停高亮效果
    // 使用配置中的悬停颜色（灰色）
    this.applyHighlight(object, this.options.hoverColor)

    // 步骤 5: 更新当前悬停对象
    // 保存引用，供下次比较和清除使用
    this.currentHoverObject = object
  }

  /**
   * 清除悬停高亮
   *
   * 当鼠标离开对象时调用，恢复对象原始外观
   *
   * 实现逻辑：
   * 1. 检查是否有当前悬停对象
   * 2. 恢复对象的原始状态
   * 3. 清空当前悬停对象引用
   *
   * @example
   * ```typescript
   * // 在 hoverEnd 事件中使用
   * eventEmitter.on('hoverEnd', () => {
   *   highlightEffect.clearHover()
   * })
   * ```
   */
  public clearHover(): void {
    // 步骤 1: 检查是否有当前悬停对象
    // 如果没有悬停对象，不需要清除
    if (!this.currentHoverObject) {
      return
    }

    // 步骤 2: 恢复对象的原始状态
    // 传入 Mesh 对象（不是状态对象）
    this.restoreOriginalState(this.currentHoverObject)

    // 步骤 3: 清空当前悬停对象引用
    // 表示现在没有悬停对象了
    this.currentHoverObject = null
  }

  // ==========================================================================
  // 公共方法 - 选中高亮
  // ==========================================================================

  /**
   * 设置选中高亮
   *
   * 当点击对象时调用，让对象持续高亮
   *
   * @param object - 要选中的 3D 对象
   *
   * @example
   * ```typescript
   * // 在 click 事件中使用
   * eventEmitter.on('click', (data) => {
   *   if (data.object instanceof THREE.Mesh) {
   *     highlightEffect.setSelected(data.object)
   *   }
   * })
   * ```
   */
  public setSelected(object: THREE.Mesh): void {
    // TODO: 实现选中高亮逻辑
  }

  /**
   * 清除选中高亮
   *
   * 取消当前选中的对象，恢复原始外观
   *
   * @example
   * ```typescript
   * // 点击空白处时清除选中
   * eventEmitter.on('click', (data) => {
   *   if (!data.object) {
   *     highlightEffect.clearSelected()
   *   }
   * })
   * ```
   */
  public clearSelected(): void {
    // TODO: 实现清除选中高亮逻辑
  }

  // ==========================================================================
  // 私有方法 - 材质状态管理
  // ==========================================================================

  /**
   * 保存对象的原始材质状态
   *
   * 在应用高亮效果前，先保存对象的原始外观
   * 这样在清除高亮时可以恢复
   *
   * @param object - 要保存状态的对象
   */
  private saveOriginalState(object: THREE.Mesh): void {
    // 步骤 1: 检查是否已经保存过
    // 如果已保存，直接返回，保护原始状态不被覆盖
    if (this.originalStates.has(object.id)) {
      return
    }

    // 步骤 2: 获取材质
    const material = object.material

    // 步骤 3: 类型检查
    // 我们只处理 MeshStandardMaterial（标准材质）
    // 因为它有 emissive（自发光）属性
    if (!(material instanceof THREE.MeshStandardMaterial)) {
      return // 不是标准材质，无法处理
    }

    // 步骤 4: 保存原始状态
    // 创建状态对象，包含原始的发光颜色和强度
    const originalState: OriginalMaterialState = {
      // 克隆颜色对象（不能直接引用，否则会被后续修改影响）
      emissive: material.emissive.clone(),
      // 复制强度值（数字类型，直接赋值即可）
      emissiveIntensity: material.emissiveIntensity
    }

    // 步骤 5: 存储到 Map
    // 使用对象的唯一 ID 作为 key
    this.originalStates.set(object.id, originalState)
  }

  /**
   * 恢复对象的原始材质状态
   *
   * 从存储中读取原始状态，恢复对象外观
   *
   * 实现逻辑：
   * 1. 从 Map 获取原始状态（检查是否存在）
   * 2. 获取材质并检查类型
   * 3. 使用 copy() 恢复 emissive 颜色
   * 4. 恢复 emissiveIntensity 强度
   * 5. 从 Map 中删除状态（清理内存）
   *
   * @param object - 要恢复状态的对象
   */
  private restoreOriginalState(object: THREE.Mesh): void {
    // 步骤 1: 从 Map 中获取原始状态
    const originalState = this.originalStates.get(object.id)

    // 如果不存在，说明没保存过，直接返回
    // 场景：用户点击一个从未悬停过的对象
    if (!originalState) {
      return
    }

    // 步骤 2: 获取材质
    const material = object.material

    // 步骤 3: 类型检查
    // 确保材质类型和保存时一致
    if (!(material instanceof THREE.MeshStandardMaterial)) {
      return
    }

    // 步骤 4: 恢复原始状态
    // 使用 copy() 复制颜色值（不改变引用）
    material.emissive.copy(originalState.emissive)
    // 恢复发光强度
    material.emissiveIntensity = originalState.emissiveIntensity

    // 步骤 5: 从 Map 中删除
    // 清理内存，避免泄漏
    this.originalStates.delete(object.id)
  }

  /**
   * 应用高亮效果
   *
   * 修改对象的材质，让它发光
   *
   * 实现逻辑：
   * 1. 获取材质并检查类型
   * 2. 设置 emissive 颜色（使用 setHex）
   * 3. 设置 emissiveIntensity 强度
   *
   * @param object - 要应用效果的对象
   * @param color - 发光颜色（十六进制，如 0x666666）
   */
  private applyHighlight(object: THREE.Mesh, color: number): void {
    // 步骤 1: 获取材质
    const material = object.material

    // 步骤 2: 类型检查
    // 确保材质支持 emissive 属性
    if (!(material instanceof THREE.MeshStandardMaterial)) {
      return
    }

    // 步骤 3: 设置发光颜色
    // 使用 setHex() 直接设置十六进制颜色
    material.emissive.setHex(color)

    // 步骤 4: 设置发光强度
    // 使用配置中的统一强度值
    material.emissiveIntensity = this.options.intensity
  }

  // ==========================================================================
  // 资源清理
  // ==========================================================================

  /**
   * 清理所有高亮效果
   *
   * 恢复所有对象的原始状态，释放资源
   *
   * @example
   * ```typescript
   * // 在组件卸载时调用
   * onUnmounted(() => {
   *   highlightEffect.dispose()
   * })
   * ```
   */
  public dispose(): void {
    // TODO: 实现资源清理逻辑
  }

  // ==========================================================================
  // 公共访问器
  // ==========================================================================

  /**
   * 获取当前悬停的对象
   */
  public getHoverObject(): THREE.Mesh | null {
    return this.currentHoverObject
  }

  /**
   * 获取当前选中的对象
   */
  public getSelectedObject(): THREE.Mesh | null {
    return this.currentSelectedObject
  }
}
