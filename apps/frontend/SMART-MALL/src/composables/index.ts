/**
 * Composables 统一导出
 */

// 3D 引擎相关
export { useThreeEngine } from './useThreeEngine'
export { useProjectManagement } from './useProjectManagement'
export { useHistoryManagement } from './useHistoryManagement'
export { useFloorManagement } from './useFloorManagement'
export { useInteraction } from './useInteraction'
export { useDrawingTools } from './useDrawingTools'
export { useMaterialSystem } from './useMaterialSystem'
export { useVerticalConnections } from './useVerticalConnections'
export { usePropertyPanel } from './usePropertyPanel'

// 通用工具
export { useMessage, type MessageType, type Message } from './useMessage'
export { useFormatters } from './useFormatters'
export { useStatusConfig, STATUS_CONFIGS, type StatusConfig } from './useStatusConfig'

// 通用 Composables（Task 2 实现）
export {
  useForm,
  type UseFormOptions,
  type UseFormReturn,
  type FormErrors
} from './useForm'

export {
  useTable,
  type UseTableOptions,
  type UseTableReturn,
  type TableParams,
  type TableResponse
} from './useTable'

export {
  useModal,
  useModals,
  type UseModalOptions,
  type UseModalReturn,
  type UseModalsReturn
} from './useModal'

export {
  useAsync,
  type UseAsyncOptions,
  type UseAsyncReturn
} from './useAsync'

export {
  usePagination,
  type UsePaginationOptions,
  type UsePaginationReturn
} from './usePagination'

export {
  useSearch,
  type UseSearchOptions,
  type UseSearchReturn
} from './useSearch'

export {
  useLocalStorage,
  type UseLocalStorageOptions,
  type UseLocalStorageReturn,
  type Serializer
} from './useLocalStorage'

export {
  useKeyboard,
  type UseKeyboardOptions,
  type UseKeyboardReturn,
  type KeyboardShortcut
} from './useKeyboard'

export {
  useConfirm,
  createGlobalConfirm,
  getGlobalConfirm,
  type ConfirmOptions,
  type UseConfirmReturn
} from './useConfirm'

export {
  useErrorBoundary,
  createGlobalErrorBoundary,
  getGlobalErrorBoundary,
  classifyError,
  isRetryable,
  type ErrorType,
  type ApiError,
  type UseErrorBoundaryOptions,
  type UseErrorBoundaryReturn
} from './useErrorBoundary'

export {
  useNotification,
  createGlobalNotification,
  getGlobalNotification,
  type NotificationType,
  type Notification,
  type UseNotificationOptions,
  type UseNotificationReturn
} from './useNotification'
