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
 *
 * 2. 交互组件
 *    - QuickActionCard：快捷操作卡片（图标 + 标题 + 点击）
 *    - Modal：模态对话框（确认、表单、提示）
 *    - CustomSelect：自定义下拉选择器
 *
 * 使用场景：
 * - 仪表盘页面：StatCard 展示关键指标
 * - 列表页面：DataTable 展示数据列表
 * - 操作确认：Modal 弹出确认对话框
 *
 * 使用示例：
 * ```vue
 * <template>
 *   <!-- 统计卡片 -->
 *   <StatCard title="今日访客" :value="1234" trend="+12%" />
 *
 *   <!-- 数据表格 -->
 *   <DataTable :columns="columns" :data="tableData" />
 *
 *   <!-- 模态框 -->
 *   <Modal v-model="showModal" title="确认删除">
 *     确定要删除这条记录吗？
 *   </Modal>
 * </template>
 * ```
 */
export { default as StatCard } from './StatCard.vue'
export { default as QuickActionCard } from './QuickActionCard.vue'
export { default as DataTable } from './DataTable.vue'
export { default as Modal } from './Modal.vue'
export { default as CustomSelect } from '../common/CustomSelect.vue'
