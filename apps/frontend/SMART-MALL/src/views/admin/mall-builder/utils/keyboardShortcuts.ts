/**
 * 建模器键盘快捷键路由逻辑
 *
 * 纯函数，从 MallBuilderView.handleKeydown 中抽取，
 * 便于单元测试和属性测试。
 */

export type DrawingTool = 'select' | 'pan' | 'draw-rect' | 'draw-poly' | 'draw-outline'

export interface KeyboardContext {
  viewMode: 'edit' | 'orbit'
  isPreviewMode: boolean
  currentTool: DrawingTool
  showBottomDrawer: boolean
}

export type ShortcutAction =
  | { type: 'openInlineInput' }
  | { type: 'toggleBottomDrawer' }
  | { type: 'toggleCommandPalette' }
  | { type: 'none' }

const DRAW_TOOLS: DrawingTool[] = ['draw-rect', 'draw-poly', 'draw-outline']

/**
 * 判断 AI 相关快捷键应执行的动作。
 *
 * 规则：
 * - 漫游模式（orbit）：忽略所有 AI 快捷键 → 'none'
 * - 预览模式：忽略所有 AI 快捷键 → 'none'
 * - `/` 键：非绘制模式、BottomDrawer 未打开时 → 'openInlineInput'
 * - `Cmd+J` / `Ctrl+J`：→ 'toggleBottomDrawer'
 * - `Cmd+K` / `Ctrl+K`：→ 'toggleCommandPalette'（保持已有行为）
 */
export function resolveAiShortcut(
  key: string,
  metaOrCtrl: boolean,
  ctx: KeyboardContext,
): ShortcutAction {
  // 漫游模式下忽略 AI 快捷键
  if (ctx.viewMode === 'orbit') {
    return { type: 'none' }
  }

  // 预览模式下忽略 AI 快捷键
  if (ctx.isPreviewMode) {
    return { type: 'none' }
  }

  // Cmd+K / Ctrl+K → CommandPalette
  if (metaOrCtrl && key === 'k') {
    return { type: 'toggleCommandPalette' }
  }

  // Cmd+J / Ctrl+J → BottomDrawer
  if (metaOrCtrl && key === 'j') {
    return { type: 'toggleBottomDrawer' }
  }

  // `/` → InlineInput（非绘制模式、BottomDrawer 未打开）
  if (key === '/' && !ctx.showBottomDrawer) {
    if (!DRAW_TOOLS.includes(ctx.currentTool)) {
      return { type: 'openInlineInput' }
    }
  }

  return { type: 'none' }
}
