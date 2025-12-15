/**
 * 效果模块导出
 *
 * 这个模块包含所有视觉效果相关的类：
 * - HighlightEffect: 高亮效果管理器（悬停、选中）
 *
 * 使用示例：
 * ```typescript
 * import { HighlightEffect } from '@/engine/effects'
 *
 * const highlightEffect = new HighlightEffect()
 * highlightEffect.setHover(mesh)
 * ```
 */

export { HighlightEffect } from './HighlightEffect'
export type { HighlightOptions } from './HighlightEffect'
