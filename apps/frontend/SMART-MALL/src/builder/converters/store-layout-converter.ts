/**
 * 店铺布局转换器
 *
 * 将 AI 生成的 StoreLayoutData 转换为建模器使用的 AreaDefinition 格式，
 * 并提供前端防御性边界校验（AI 服务端已做主校验，此处为双重防御）。
 *
 * 复用现有 polygon.ts 的 isPointInside() 进行边界检测。
 */

import type { Polygon } from '../geometry/types'
import { isPointInside } from '../geometry/polygon'
import type { AreaDefinition, AreaProperties } from '../types/mall-project.types'
import { AreaType } from '@smart-mall/shared-types'
import type { StoreLayoutData } from '../../api/merchant.api'
import { getMaterialPresetById } from '../materials/presets'
import { generateIdWithPrefix } from '../utils/id-generator'

// ============================================================================
// 转换函数
// ============================================================================

/**
 * 将 StoreLayoutData 中的每个 StoreObject 转换为 AreaDefinition
 *
 * 每个 StoreObject 被转换为一个小型矩形区域，
 * 使用 materialId 查找对应的 MaterialPreset 获取颜色信息。
 *
 * @param layout - AI 生成的店铺布局数据
 * @param existingArea - 所属的父区域定义（提供上下文信息）
 * @returns 可加载到 BuilderEngine 的区域定义列表
 */
export function convertStoreLayoutToAreas(
  layout: StoreLayoutData,
  existingArea: AreaDefinition,
): AreaDefinition[] {
  return layout.objects.map((obj) => {
    const preset = getMaterialPresetById(obj.materialId)

    // 使用 scale 构造矩形形状（以 position 为中心，x/z 平面）
    const halfW = (obj.scale.x || 1) / 2
    const halfD = (obj.scale.z || 1) / 2
    const cx = obj.position.x
    const cz = obj.position.z

    const shape: Polygon = {
      vertices: [
        { x: cx - halfW, y: cz - halfD },
        { x: cx + halfW, y: cz - halfD },
        { x: cx + halfW, y: cz + halfD },
        { x: cx - halfW, y: cz + halfD },
      ],
      isClosed: true,
    }

    const objArea = (obj.scale.x || 1) * (obj.scale.z || 1)
    const objPerimeter = 2 * ((obj.scale.x || 1) + (obj.scale.z || 1))

    const properties: AreaProperties = {
      area: Math.round(objArea * 100) / 100,
      perimeter: Math.round(objPerimeter * 100) / 100,
      notes: `AI 生成 - ${layout.theme}`,
    }

    return {
      id: generateIdWithPrefix('store-obj'),
      name: obj.name,
      type: (preset?.areaType as AreaType) ?? AreaType.OTHER,
      shape,
      color: preset?.color ?? existingArea.color,
      properties,
      visible: true,
      locked: false,
      merchantId: existingArea.merchantId,
    }
  })
}

// ============================================================================
// 边界校验
// ============================================================================

/**
 * 前端防御性边界校验
 *
 * 校验 StoreLayoutData 中每个对象的 position 是否在区域多边形内。
 * AI 服务端已做主校验，此处为双重防御，复用现有 polygon.ts 的 isPointInside()。
 *
 * @param layout - AI 生成的店铺布局数据
 * @param areaBoundary - 区域边界多边形
 * @returns 校验结果：valid 表示是否全部在边界内，outOfBounds 为越界对象名称列表
 */
export function validateLayoutBoundary(
  layout: StoreLayoutData,
  areaBoundary: Polygon,
): { valid: boolean; outOfBounds: string[] } {
  const outOfBounds: string[] = []

  for (const obj of layout.objects) {
    // Three.js 中 y 是高度，x/z 是水平面，映射到 2D 的 x/y
    const point = { x: obj.position.x, y: obj.position.z }

    if (!isPointInside(point, areaBoundary)) {
      outOfBounds.push(obj.name)
    }
  }

  return {
    valid: outOfBounds.length === 0,
    outOfBounds,
  }
}
