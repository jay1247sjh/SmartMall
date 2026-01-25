/**
 * MallBuilder 子组件模块
 *
 * 这个模块包含 MallBuilderView 页面拆分出的子组件，用于商城建模器页面。
 *
 * 设计原则：
 * - 单一职责：每个组件专注于一个功能区域
 * - 可复用性：组件通过 Props 和 Emits 与父组件通信
 * - 类型安全：所有接口都有完整的 TypeScript 类型定义
 *
 * 包含的组件：
 *
 * 1. BuilderWizard - 项目创建向导（模板选择、项目命名）
 * 2. BuilderToolbar - 顶部工具栏（工具选择、操作按钮）
 * 3. FloorPanel - 楼层管理侧边栏
 * 4. MaterialPanel - 材质选择侧边栏
 * 5. PropertyPanel - 选中区域属性编辑
 * 6. SceneLegend - 场景图例显示
 */

export { default as BuilderWizard } from './BuilderWizard.vue'
export type {
  BuilderWizardProps,
  BuilderWizardEmits,
} from './BuilderWizard.vue'

export { default as BuilderToolbar } from './BuilderToolbar.vue'
export type {
  BuilderToolbarProps,
  BuilderToolbarEmits,
  DrawingTool,
} from './BuilderToolbar.vue'

export { default as FloorPanel } from './FloorPanel.vue'
export type {
  FloorPanelProps,
  FloorPanelEmits,
} from './FloorPanel.vue'

export { default as MaterialPanel } from './MaterialPanel.vue'
export type {
  MaterialPanelProps,
  MaterialPanelEmits,
} from './MaterialPanel.vue'

export { default as PropertyPanel } from './PropertyPanel.vue'
export type {
  PropertyPanelProps,
  PropertyPanelEmits,
  AreaTypeConfig,
} from './PropertyPanel.vue'

export { default as SceneLegend } from './SceneLegend.vue'
export type {
  SceneLegendProps,
  LegendItem,
} from './SceneLegend.vue'
