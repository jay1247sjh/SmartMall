/**
 * 消息提示 Composable
 * 统一管理页面内的消息提示状态
 */
import { ref } from 'vue'

export type MessageType = 'success' | 'error' | 'warning' | 'info'

export interface Message {
  type: MessageType
  text: string
}

export function useMessage(autoHideDelay = 3000) {
  const message = ref<Message | null>(null)

  function showMessage(type: MessageType, text: string) {
    message.value = { type, text }
    if (autoHideDelay > 0) {
      setTimeout(() => { message.value = null }, autoHideDelay)
    }
  }

  function clearMessage() {
    message.value = null
  }

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
