/**
 * ============================================================================
 * 工具处理器集中注册 (tool-handlers.ts)
 * ============================================================================
 *
 * 【职责】
 * 集中注册所有内置工具处理器。
 * Python 新增工具时，仅需在此文件添加一行 register() 即可。
 *
 * 【使用】
 * 在 App 启动时调用 initToolHandlers(router)
 * ============================================================================
 */

import type { Router } from 'vue-router'
import type { NavigationTargetType } from '@/api/mall-manage.api'
import { useBuilderNavigationStore } from '@/stores'
import { useAiStore } from '@/stores/ai.store'
import { extractNavigationKeyword, resolveNavigationExecutionPreference } from './navigation-intent'
import { toolHandlerRegistry } from './tool-handler-registry'

function isNavigationExecutionRoute(path: string): boolean {
  return path.startsWith('/mall/3d') || path.startsWith('/admin/builder') || path.startsWith('/builder')
}

function generateIntentId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function resolveLatestUserMessageContent(): string {
  const aiStore = useAiStore()
  for (let i = aiStore.messages.length - 1; i >= 0; i -= 1) {
    const msg = aiStore.messages[i]
    if (msg?.role === 'user' && typeof msg.content === 'string') {
      return msg.content
    }
  }
  return ''
}

function enqueueBuilderNavigationIntent(
  targetType: NavigationTargetType,
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  keywordFields: string[],
): boolean {
  const keyword = extractNavigationKeyword(args, result, keywordFields)
  if (!keyword) {
    return false
  }

  const latestUserMessage = resolveLatestUserMessageContent()
  const executionPreference = resolveNavigationExecutionPreference(latestUserMessage)

  const builderNavigationStore = useBuilderNavigationStore()
  builderNavigationStore.setPendingIntent({
    intentId: generateIntentId(),
    targetType,
    targetKeyword: keyword,
    executionPreference,
    source: 'ai-tool',
    rawArgs: args,
    rawResult: result,
    createdAt: Date.now(),
  })
  builderNavigationStore.clearError()
  return true
}

/**
 * 初始化内置工具处理器
 * 在 App 启动时调用一次，传入 router 实例
 */
export function initToolHandlers(router: Router): void {
  toolHandlerRegistry.register('navigate_to_store', async (_fn, args, result) => {
    if (!result.success) {
      return
    }

    const currentPath = router.currentRoute.value.path
    const queued = enqueueBuilderNavigationIntent(
      'store',
      args,
      result,
      ['store_name', 'storeName', 'keyword', 'query', 'name'],
    )
    if (!queued) {
      return
    }

    if (!isNavigationExecutionRoute(currentPath)) {
      await router.push('/mall/3d')
    }
  })

  toolHandlerRegistry.register('navigate_to_area', async (_fn, args, result) => {
    if (!result.success) {
      return
    }

    const currentPath = router.currentRoute.value.path
    const queued = enqueueBuilderNavigationIntent(
      'area',
      args,
      result,
      ['area_name', 'areaName', 'keyword', 'query', 'name'],
    )
    if (!queued) {
      return
    }

    if (!isNavigationExecutionRoute(currentPath)) {
      await router.push('/mall/3d')
    }
  })

  // 纯信息类工具（search_products, recommend_products, get_store_info 等）
  // 无需注册 handler — LLM 生成的文本回复已自动显示在聊天面板中
  // 未来如需特殊 UI 交互，只需在此处添加 register() 即可
}
