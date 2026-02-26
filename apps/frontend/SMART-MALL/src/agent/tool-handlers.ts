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
import { toolHandlerRegistry } from './tool-handler-registry'
import { useBuilderNavigationStore } from '@/stores'
import type { NavigationTargetType } from '@/api/mall-manage.api'

function isBuilderRoute(path: string): boolean {
  return path.startsWith('/admin/builder') || path.startsWith('/builder')
}

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  return null
}

function resolveTargetKeyword(
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  fieldNames: string[],
): string | null {
  for (const name of fieldNames) {
    const fromArgs = asString(args[name])
    if (fromArgs) return fromArgs
    const fromResult = asString(result[name])
    if (fromResult) return fromResult
  }
  return null
}

function enqueueBuilderNavigationIntent(
  targetType: NavigationTargetType,
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  keywordFields: string[],
): boolean {
  const keyword = resolveTargetKeyword(args, result, keywordFields)
  if (!keyword) return false

  const builderNavigationStore = useBuilderNavigationStore()
  builderNavigationStore.setPendingIntent({
    targetType,
    targetKeyword: keyword,
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
  toolHandlerRegistry.register('navigate_to_store', (_fn, args, result) => {
    if (!result.success) return

    const currentPath = router.currentRoute.value.path
    if (isBuilderRoute(currentPath)) {
      const queued = enqueueBuilderNavigationIntent(
        'store',
        args,
        result,
        ['store_name', 'storeName', 'keyword', 'query', 'name'],
      )
      if (queued) return
    }

    if (!currentPath.startsWith('/mall')) {
      router.push('/mall')
    }
    // 3D 场景导航通过事件总线或 store 通知
  })

  toolHandlerRegistry.register('navigate_to_area', (_fn, args, result) => {
    if (!result.success) return

    const currentPath = router.currentRoute.value.path
    if (isBuilderRoute(currentPath)) {
      const queued = enqueueBuilderNavigationIntent(
        'area',
        args,
        result,
        ['area_name', 'areaName', 'keyword', 'query', 'name'],
      )
      if (queued) return
    }

    if (!currentPath.startsWith('/mall')) {
      router.push('/mall')
    }
  })

  // 纯信息类工具（search_products, recommend_products, get_store_info 等）
  // 无需注册 handler — LLM 生成的文本回复已自动显示在聊天面板中
  // 未来如需特殊 UI 交互，只需在此处添加 register() 即可
}
