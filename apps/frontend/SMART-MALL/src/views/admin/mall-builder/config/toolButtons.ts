/**
 * 工具按钮配置
 */
import type { Tool } from '../composables/useMallBuilderState'

export interface ToolButtonConfig {
  tool?: Tool
  title?: string
  icon?: string
  divider?: boolean
  special?: string
  extraCircles?: boolean
}

export const toolButtons: ToolButtonConfig[] = [
  { tool: 'select', title: '选择工具 (V)', icon: 'M4 4l5 14 2-5 5-2L4 4z' },
  { tool: 'pan', title: '平移工具', icon: 'M10 3v14M3 10h14' },
  { divider: true },
  { tool: 'draw-rect', title: '绘制矩形 (R)', icon: 'M3 3h14v14H3z' },
  { tool: 'draw-poly', title: '绘制多边形 (P)', icon: 'M10 2l8 6-3 10H5L2 8l8-6z' },
  { tool: 'draw-outline', title: '绘制商城轮廓', icon: 'M3 3h14v14H3V3z', extraCircles: true },
  { special: 'reset-outline', title: '重置商城轮廓', icon: 'M4 4l12 12M16 4L4 16' },
]
