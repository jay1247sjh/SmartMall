/**
 * 消息提示 Composable
 * 统一管理页面内的消息提示状态
 */
import { onScopeDispose, ref } from 'vue'

export type MessageType = 'success' | 'error' | 'warning' | 'info'

export interface Message {
  type: MessageType
  text: string
}

export function useMessage(autoHideDelay = 3000) {
  const message = ref<Message | null>(null)
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function clearHideTimer() {
    if (hideTimer !== null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function showMessage(type: MessageType, text: string) {
    clearHideTimer()
    message.value = { type, text }
    if (autoHideDelay > 0) {
      hideTimer = setTimeout(() => {
        message.value = null
        hideTimer = null
      }, autoHideDelay)
    }
  }

  function clearMessage() {
    clearHideTimer()
    message.value = null
  }

  onScopeDispose(() => {
    clearHideTimer()
  })

  const success = (text: string) => showMessage('success', text)
  const error = (text: string) => showMessage('error', text)
  const warning = (text: string) => showMessage('warning', text)
  const info = (text: string) => showMessage('info', text)

  return {
    message,
    showMessage,
    clearMessage,
    success,
    error,
    warning,
    info,
  }
}
