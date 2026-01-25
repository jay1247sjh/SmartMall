/**
 * Mall3D 子组件模块
 *
 * 这个模块包含 Mall3DView 页面拆分出的子组件，用于 3D 商城展示页面。
 *
 * 设计原则：
 * - 单一职责：每个组件专注于一个功能区域
 * - 可复用性：组件通过 Props 和 Emits 与父组件通信
 * - 类型安全：所有接口都有完整的 TypeScript 类型定义
 *
 * 包含的组件：
 *
 * 1. MallTopBar - 顶部栏（返回按钮、搜索框、用户信息）
 * 2. FloorSelector - 楼层选择器
 * 3. StorePanel - 店铺详情面板
 * 4. MiniMap - 迷你地图
 * 5. ControlsHint - 操作提示
 * 6. ImportSuccessToast - 导入成功提示
 * 7. MallInfoPanel - 商城信息面板（AI 生成商城信息展示）
 */

export { default as MallTopBar } from './MallTopBar.vue'
export type { SearchResult, MallTopBarProps, MallTopBarEmits } from './MallTopBar.vue'

export { default as FloorSelector } from './FloorSelector.vue'
export type { Floor, FloorSelectorProps, FloorSelectorEmits } from './FloorSelector.vue'

export { default as StorePanel } from './StorePanel.vue'
export type { StoreDetail, StorePanelProps, StorePanelEmits } from './StorePanel.vue'

export { default as MiniMap } from './MiniMap.vue'
export type { MiniMapProps, MiniMapEmits } from './MiniMap.vue'

export { default as ControlsHint } from './ControlsHint.vue'
export type { ControlHint, ControlsHintProps } from './ControlsHint.vue'

export { default as ImportSuccessToast } from './ImportSuccessToast.vue'
export type { ImportSuccessToastProps, ImportSuccessToastEmits } from './ImportSuccessToast.vue'

export { default as MallInfoPanel } from './MallInfoPanel.vue'
export type { MallData, MallInfoPanelProps, MallInfoPanelEmits } from './MallInfoPanel.vue'
