/**
 * 共享组件模块
 *
 * 这个模块包含跨页面复用的通用 UI 组件，用于构建一致的用户界面。
 *
 * 设计原则：
 * - 通用性：组件不依赖特定业务逻辑
 * - 可配置：通过 props 支持多种使用场景
 * - 一致性：统一的视觉风格和交互模式
 *
 * 包含的组件：
 *
 * 1. 数据展示组件
 *    - StatCard：统计卡片（数字 + 标题 + 趋势）
 *    - DataTable：数据表格（分页、排序、筛选）
 *    - StatusBadge：状态徽章
 *
 * 2. 交互组件
 *    - QuickActionCard：快捷操作卡片（图标 + 标题 + 点击）
 *    - Modal：模态对话框（确认、表单、提示）
 *    - ConfirmModal：带理由输入的确认弹窗
 *    - CustomSelect：自定义下拉选择器
 *    - ActionButton：表格行内操作按钮
 *
 * 3. 布局组件
 *    - FilterBar：筛选栏
 *    - MessageAlert：消息提示
 *
 * 使用示例：
 * ```vue
 * <template>
 *   <MessageAlert v-if="message" :type="message.type" :text="message.text" />
 *   <FilterBar :total="list.length">
 *     <CustomSelect v-model="filter" :options="options" />
 *   </FilterBar>
 *   <DataTable :columns="columns" :data="list">
 *     <template #status="{ value }">
 *       <StatusBadge :status="value" domain="approval" />
 *     </template>
 *   </DataTable>
 * </template>
 * ```
 */

// 数据展示
export { default as StatCard } from './StatCard.vue'
export { default as QuickActionCard } from './QuickActionCard.vue'
export { default as DataTable } from './DataTable.vue'
export { default as StatusBadge } from './StatusBadge.vue'

// 交互组件
export { default as Button } from './Button.vue'
export { default as Input } from './Input.vue'
export { default as Modal } from './Modal.vue'
export { default as ConfirmModal } from './ConfirmModal.vue'
export { default as CustomSelect } from '../common/CustomSelect.vue'
export { default as ActionButton } from './ActionButton.vue'

// 布局组件
export { default as FilterBar } from './FilterBar.vue'
export { default as MessageAlert } from './MessageAlert.vue'

// 加载状态组件
export { default as LoadingSpinner } from './LoadingSpinner.vue'
export { default as ErrorFallback } from './ErrorFallback.vue'
