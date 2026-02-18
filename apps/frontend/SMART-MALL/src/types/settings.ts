/**
 * 全局设置类型定义与常量
 *
 * 定义 Smart Mall 全局设置面板的类型、默认值和常量映射。
 * Requirements: 2.1, 3.1, 4.1, 6.2, 8.3
 */

// ============================================================================
// 类型定义
// ============================================================================

/** 主题类型 */
export type ThemeType = 'dark' | 'light'

/** 支持的语言代码 */
export type SupportedLocale = 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'es' | 'fr' | 'de'

/** 渲染质量 */
export type RenderQuality = 'low' | 'medium' | 'high'

/** Toast 时长 */
export type ToastDuration = 'short' | 'medium' | 'long'

/** 设置状态 */
export interface SettingsState {
  theme: ThemeType
  language: SupportedLocale
  renderQuality: RenderQuality
  showGrid: boolean
  showAxes: boolean
  aiAssistantEnabled: boolean
  notificationsEnabled: boolean
  toastDuration: ToastDuration
}

// ============================================================================
// 默认值与常量
// ============================================================================

/** 默认设置 */
export const DEFAULT_SETTINGS: SettingsState = {
  theme: 'dark',
  language: 'en',
  renderQuality: 'medium',
  showGrid: false,
  showAxes: false,
  aiAssistantEnabled: true,
  notificationsEnabled: true,
  toastDuration: 'medium',
}

/** Toast 时长映射（毫秒） */
export const TOAST_DURATION_MAP: Record<ToastDuration, number> = {
  short: 2000,
  medium: 3000,
  long: 5000,
}

/** localStorage 存储键名 */
export const SETTINGS_STORAGE_KEY = 'smart-mall-settings'

// ============================================================================
// 选项数组（用于校验和 UI 渲染）
// ============================================================================

/** 支持的语言列表 */
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de']

/** 主题选项 */
export const THEME_OPTIONS: ThemeType[] = ['dark', 'light']

/** 渲染质量选项 */
export const RENDER_QUALITY_OPTIONS: RenderQuality[] = ['low', 'medium', 'high']

/** Toast 时长选项 */
export const TOAST_DURATION_OPTIONS: ToastDuration[] = ['short', 'medium', 'long']

/** 语言显示名称映射 */
export const LOCALE_DISPLAY_NAMES: Record<SupportedLocale, string> = {
  'en': 'English',
  'zh-CN': '中文（简体）',
  'zh-TW': '中文（繁體）',
  'ja': '日本語',
  'ko': '한국어',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
}
