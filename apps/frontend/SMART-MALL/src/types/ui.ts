/**
 * UI 组件类型定义
 * 
 * 定义 Smart Mall 系统的 UI 组件 Props 和事件类型
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { VNode } from 'vue'

// ============================================================================
// Button 组件类型
// ============================================================================

/**
 * Button 变体类型
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon' | 'ghost'

/**
 * Button 尺寸类型
 */
export type ButtonSize = 'small' | 'medium' | 'large'

/**
 * Button 组件 Props
 */
export interface ButtonProps {
  /** 按钮变体 */
  variant?: ButtonVariant
  /** 按钮尺寸 */
  size?: ButtonSize
  /** 加载状态 */
  loading?: boolean
  /** 禁用状态 */
  disabled?: boolean
  /** 图标名称 */
  icon?: string
  /** 是否块级按钮 */
  block?: boolean
}

// ============================================================================
// Modal 组件类型
// ============================================================================

/**
 * Modal 尺寸类型
 */
export type ModalSize = 'small' | 'medium' | 'large'

/**
 * Modal 组件 Props
 */
export interface ModalProps {
  /** 可见性（v-model） */
  modelValue: boolean
  /** 标题 */
  title?: string
  /** 尺寸 */
  size?: ModalSize
  /** 是否可关闭 */
  closable?: boolean
  /** 点击遮罩是否关闭 */
  maskClosable?: boolean
  /** 是否显示底部 */
  showFooter?: boolean
}

// ============================================================================
// Input 组件类型
// ============================================================================

/**
 * Input 类型
 */
export type InputType = 'text' | 'password' | 'number' | 'textarea'

/**
 * Input 组件 Props
 */
export interface InputProps {
  /** 输入值（v-model） */
  modelValue: string | number
  /** 输入类型 */
  type?: InputType
  /** 占位符 */
  placeholder?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 只读状态 */
  readonly?: boolean
  /** 是否可清除 */
  clearable?: boolean
  /** 错误信息 */
  error?: string
}

// ============================================================================
// Table 组件类型
// ============================================================================

/**
 * 表格对齐方式
 */
export type TableAlign = 'left' | 'center' | 'right'

/**
 * 表格列定义
 */
export interface TableColumn<T = any> {
  /** 列键名 */
  key: string
  /** 列标题 */
  title: string
  /** 列宽度 */
  width?: number | string
  /** 对齐方式 */
  align?: TableAlign
  /** 是否可排序 */
  sortable?: boolean
  /** 自定义渲染函数 */
  render?: (row: T, index: number) => VNode
}

/**
 * Table 组件 Props
 */
export interface TableProps<T = any> {
  /** 表格数据 */
  data: T[]
  /** 列定义 */
  columns: TableColumn<T>[]
  /** 加载状态 */
  loading?: boolean
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 是否显示边框 */
  border?: boolean
  /** 行唯一键 */
  rowKey?: string | ((row: T) => string)
}

// ============================================================================
// 通用事件处理器类型
// ============================================================================

/**
 * 点击事件处理器
 */
export type ClickHandler = (event: MouseEvent) => void

/**
 * 值变更事件处理器
 */
export type ChangeHandler<T = string> = (value: T) => void

/**
 * 表单提交事件处理器
 */
export type SubmitHandler<T = any> = (data: T) => void | Promise<void>

// ============================================================================
// Select 组件类型
// ============================================================================

/**
 * Select 选项
 */
export interface SelectOption<T = string> {
  /** 选项标签 */
  label: string
  /** 选项值 */
  value: T
  /** 是否禁用 */
  disabled?: boolean
}
