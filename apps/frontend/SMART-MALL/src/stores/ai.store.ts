/**
 * ============================================================================
 * AI 助手状态管理 (ai.store.ts)
 * ============================================================================
 * 
 * 【职责】
 * 管理全局 AI 助手「小智」的状态，包括：
 * - 面板显示/隐藏状态
 * - 对话历史
 * - 待确认操作
 * - 意图识别结果
 * 
 * 【全局可用】
 * 这个 store 在整个应用中共享，确保 AI 助手状态在页面切换时保持
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatResponse } from '@/api/intelligence.api'

/** 意图类型 */
export type IntentType = 
  | 'navigate'      // 页面导航
  | 'search'        // 搜索
  | 'action'        // 执行操作
  | 'query'         // 查询信息
  | 'chat'          // 普通对话

/** 意图识别结果 */
export interface IntentResult {
  type: IntentType
  target?: string           // 导航目标或搜索目标
  action?: string           // 操作名称
  params?: Record<string, unknown>
  confidence: number        // 置信度 0-1
}

export const useAiStore = defineStore('ai', () => {
  // ========================================
  // 状态
  // ========================================
  
  /** 面板是否可见 */
  const isPanelVisible = ref(false)
  
  /** 对话消息列表 */
  const messages = ref<ChatMessage[]>([])
  
  /** 是否正在发送消息 */
  const isSending = ref(false)
  
  /** 待确认的操作 */
  const pendingConfirmation = ref<{
    action: string
    args: Record<string, unknown>
    message: string
  } | null>(null)
  
  /** 最近的意图识别结果 */
  const lastIntent = ref<IntentResult | null>(null)
  
  /** 会话 ID */
  const sessionId = ref<string>(generateSessionId())
  
  // ========================================
  // 计算属性
  // ========================================
  
  /** 是否有未读消息 */
  const hasUnread = computed(() => {
    if (isPanelVisible.value) return false
    const lastMsg = messages.value[messages.value.length - 1]
    return lastMsg?.role === 'assistant'
  })
  
  /** 消息数量 */
  const messageCount = computed(() => messages.value.length)
  
  // ========================================
  // 方法
  // ========================================
  
  /** 生成会话 ID */
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
  
  /** 生成消息 ID */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
  
  /** 显示面板 */
  function showPanel() {
    isPanelVisible.value = true
  }
  
  /** 隐藏面板 */
  function hidePanel() {
    isPanelVisible.value = false
  }
  
  /** 切换面板显示状态 */
  function togglePanel() {
    isPanelVisible.value = !isPanelVisible.value
  }
  
  /** 添加消息 */
  function addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    messages.value.push({
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
    })
  }
  
  /** 清空消息 */
  function clearMessages() {
    messages.value = []
    sessionId.value = generateSessionId()
    pendingConfirmation.value = null
    lastIntent.value = null
  }
  
  /** 设置发送状态 */
  function setSending(sending: boolean) {
    isSending.value = sending
  }
  
  /** 设置待确认操作 */
  function setPendingConfirmation(confirmation: typeof pendingConfirmation.value) {
    pendingConfirmation.value = confirmation
  }
  
  /** 清除待确认操作 */
  function clearPendingConfirmation() {
    pendingConfirmation.value = null
  }
  
  /** 设置意图识别结果 */
  function setLastIntent(intent: IntentResult | null) {
    lastIntent.value = intent
  }
  
  /** 处理 AI 响应 */
  function handleResponse(response: ChatResponse) {
    console.log('[AI Store] handleResponse:', response.type, response)
    
    if (response.type === 'navigate' && response.navigateTo) {
      // 导航类型响应 - 由后端识别的导航意图
      console.log('[AI Store] Adding navigate message')
      addMessage({
        role: 'assistant',
        content: response.content || `正在为您打开「${response.navigateLabel}」...`,
        type: 'navigate',
        navigateTo: response.navigateTo,
        navigateLabel: response.navigateLabel,
      })
      // 设置意图结果，让组件执行导航
      setLastIntent({
        type: 'navigate',
        target: response.navigateTo,
        params: { label: response.navigateLabel },
        confidence: response.confidence || 0.9,
      })
    } else if (response.type === 'mall_generated') {
      // 商城布局生成成功
      addMessage({
        role: 'assistant',
        content: response.content || '商城布局已生成！',
        type: 'mall_generated',
        action: response.action,
        args: response.args,
      })
      // 设置意图结果，让组件可以处理生成的数据
      setLastIntent({
        type: 'action',
        action: 'MALL_GENERATED',
        params: response.args,
        confidence: 1.0,
      })
    } else if (response.type === 'confirmation_required' || response.type === 'confirm') {
      setPendingConfirmation({
        action: response.action!,
        args: response.args!,
        message: response.message || '确认执行此操作吗？',
      })
      addMessage({
        role: 'assistant',
        content: response.message || '确认执行此操作吗？',
        type: response.type,
        action: response.action,
        args: response.args,
      })
    } else if (response.type === 'error') {
      addMessage({
        role: 'assistant',
        content: response.content || response.message || '抱歉，处理时出现错误，请重试。',
        type: 'error',
      })
    } else {
      addMessage({
        role: 'assistant',
        content: response.content || '',
        tool_results: response.toolResults,
      })
    }
  }
  
  /** 初始化欢迎消息 */
  function initWelcomeMessage() {
    if (messages.value.length === 0) {
      addMessage({
        role: 'assistant',
        content: '你好！我是小智，Smart Mall 的 AI 助手。有什么可以帮您的吗？\n\n您可以问我：\n• 帮我打开商品管理\n• 创建一个3层商城，1楼Nike/Adidas，2楼星巴克\n• 推荐一家好吃的餐厅\n• 查看今日订单',
      })
    }
  }
  
  return {
    // 状态
    isPanelVisible,
    messages,
    isSending,
    pendingConfirmation,
    lastIntent,
    sessionId,
    
    // 计算属性
    hasUnread,
    messageCount,
    
    // 方法
    showPanel,
    hidePanel,
    togglePanel,
    addMessage,
    clearMessages,
    setSending,
    setPendingConfirmation,
    clearPendingConfirmation,
    setLastIntent,
    handleResponse,
    initWelcomeMessage,
  }
})
