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

/**
 * 初始化内置工具处理器
 * 在 App 启动时调用一次，传入 router 实例
 */
export function initToolHandlers(router: Router): void {
  toolHandlerRegistry.register('navigate_to_store', (_fn, _args, result) => {
    if (!result.success) return
    // 如果不在商城页面，先导航过去
    if (!router.currentRoute.value.path.startsWith('/mall')) {
      router.push('/mall')
    }
    // 3D 场景导航通过事件总线或 store 通知
  })

  // 纯信息类工具（search_products, recommend_products, get_store_info 等）
  // 无需注册 handler — LLM 生成的文本回复已自动显示在聊天面板中
  // 未来如需特殊 UI 交互，只需在此处添加 register() 即可
}
