/**
 * ============================================================================
 * 设置状态 Store (Settings Store)
 * ============================================================================
 *
 * 【业务职责】
 * 管理 Smart Mall 全局设置面板的所有状态，包括主题、语言、
 * 3D 场景、AI 助手、通知等设置项，并持久化到 localStorage。
 *
 * Requirements: 2.2, 2.3, 2.5, 2.6, 3.5, 3.6, 3.7, 4.2,
 *               5.2, 5.3, 5.4, 6.3, 8.1, 8.2, 8.3
 * ============================================================================
 */

import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import en from 'element-plus/es/locale/lang/en'
import type { Language } from 'element-plus/es/locale'
import type {
  ThemeType,
  SupportedLocale,
  RenderQuality,
  ToastDuration,
  SettingsState,
  CharacterModelName,
} from '@/types/settings'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '@/types/settings'
import { useSystemStore } from './system.store'
import i18n from '@/i18n'

// ============================================================================
// 语言包动态加载映射
// ============================================================================

const elementPlusLocaleMap: Record<SupportedLocale, () => Promise<any>> = {
  'en': () => import('element-plus/es/locale/lang/en'),
  'zh-CN': () => import('element-plus/es/locale/lang/zh-cn'),
  'zh-TW': () => import('element-plus/es/locale/lang/zh-tw'),
  'ja': () => import('element-plus/es/locale/lang/ja'),
  'ko': () => import('element-plus/es/locale/lang/ko'),
  'es': () => import('element-plus/es/locale/lang/es'),
  'fr': () => import('element-plus/es/locale/lang/fr'),
  'de': () => import('element-plus/es/locale/lang/de'),
}

const i18nLocaleMap: Record<SupportedLocale, () => Promise<any>> = {
  'en': () => import('@/i18n/locales/en.json'),
  'zh-CN': () => import('@/i18n/locales/zh-CN.json'),
  'zh-TW': () => import('@/i18n/locales/zh-TW.json'),
  'ja': () => import('@/i18n/locales/ja.json'),
  'ko': () => import('@/i18n/locales/ko.json'),
  'es': () => import('@/i18n/locales/es.json'),
  'fr': () => import('@/i18n/locales/fr.json'),
  'de': () => import('@/i18n/locales/de.json'),
}

// ============================================================================
// localStorage 持久化辅助函数
// ============================================================================

function saveToStorage(state: SettingsState): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('Failed to save settings:', e)
  }
}

function loadFromStorage(): SettingsState | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SettingsState
  } catch (e) {
    console.warn('Failed to load settings:', e)
    return null
  }
}

// ============================================================================
// Store 定义
// ============================================================================

export const useSettingsStore = defineStore('settings', () => {
  // ==========================================================================
  // 状态（每个设置项独立 ref，细粒度响应式）
  // ==========================================================================

  const theme = ref<ThemeType>(DEFAULT_SETTINGS.theme)
  const language = ref<SupportedLocale>(DEFAULT_SETTINGS.language)
  const renderQuality = ref<RenderQuality>(DEFAULT_SETTINGS.renderQuality)
  const showGrid = ref(DEFAULT_SETTINGS.showGrid)
  const showAxes = ref(DEFAULT_SETTINGS.showAxes)
  const aiAssistantEnabled = ref(DEFAULT_SETTINGS.aiAssistantEnabled)
  const notificationsEnabled = ref(DEFAULT_SETTINGS.notificationsEnabled)
  const toastDuration = ref<ToastDuration>(DEFAULT_SETTINGS.toastDuration)
  const characterModel = ref<CharacterModelName>(DEFAULT_SETTINGS.characterModel)

  /** Element Plus 语言包（动态切换，由 setLanguage 更新） */
  const elementPlusLocale: Ref<Language> = ref(en)

  // ==========================================================================
  // 内部辅助
  // ==========================================================================

  /** 收集当前状态为 SettingsState 对象 */
  function getState(): SettingsState {
    return {
      theme: theme.value,
      language: language.value,
      renderQuality: renderQuality.value,
      showGrid: showGrid.value,
      showAxes: showAxes.value,
      aiAssistantEnabled: aiAssistantEnabled.value,
      notificationsEnabled: notificationsEnabled.value,
      toastDuration: toastDuration.value,
      characterModel: characterModel.value,
    }
  }

  /** 将 SettingsState 应用到所有 ref */
  function applyState(state: SettingsState): void {
    theme.value = state.theme
    language.value = state.language
    renderQuality.value = state.renderQuality
    showGrid.value = state.showGrid
    showAxes.value = state.showAxes
    aiAssistantEnabled.value = state.aiAssistantEnabled
    notificationsEnabled.value = state.notificationsEnabled
    toastDuration.value = state.toastDuration
    characterModel.value = state.characterModel
  }

  /** 将主题和语言应用到 DOM */
  function applyToDOM(): void {
    document.documentElement.setAttribute('data-theme', theme.value)
    document.documentElement.lang = language.value
  }

  /** 持久化当前状态 */
  function persist(): void {
    saveToStorage(getState())
  }

  /** 同步 showGrid / showAxes 到 system.store */
  function syncToSystemStore(): void {
    const systemStore = useSystemStore()
    if (systemStore.showGrid !== showGrid.value) {
      systemStore.showGrid = showGrid.value
    }
    if (systemStore.showAxes !== showAxes.value) {
      systemStore.showAxes = showAxes.value
    }
  }

  // ==========================================================================
  // Actions
  // ==========================================================================

  /** 切换主题 */
  function setTheme(newTheme: ThemeType): void {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
    persist()
  }

  /** 切换语言，同步更新 vue-i18n locale 和 Element Plus 语言包 */
  async function setLanguage(locale: SupportedLocale): Promise<void> {
    language.value = locale
    document.documentElement.lang = locale

    // Load and set vue-i18n messages
    try {
      const messages = await i18nLocaleMap[locale]()
      i18n.global.setLocaleMessage(locale, messages.default || messages)
      ;(i18n.global.locale as unknown as { value: string }).value = locale
    } catch (e) {
      console.warn('Failed to load i18n locale:', locale, e)
      // Fallback: just switch locale (English is already loaded)
      ;(i18n.global.locale as unknown as { value: string }).value = locale
    }

    // Load and set Element Plus locale
    try {
      const epLocale = await elementPlusLocaleMap[locale]()
      elementPlusLocale.value = epLocale.default || epLocale
    } catch (e) {
      console.warn('Failed to load Element Plus locale:', locale, e)
    }

    persist()
  }

  /** 设置渲染质量 */
  function setRenderQuality(quality: RenderQuality): void {
    renderQuality.value = quality
    persist()
  }

  /** 切换网格显示 */
  function toggleGrid(): void {
    showGrid.value = !showGrid.value
    syncToSystemStore()
    persist()
  }

  /** 切换坐标轴显示 */
  function toggleAxes(): void {
    showAxes.value = !showAxes.value
    syncToSystemStore()
    persist()
  }

  /** 切换 AI 助手开关 */
  function toggleAiAssistant(): void {
    aiAssistantEnabled.value = !aiAssistantEnabled.value
    persist()
  }

  /** 设置通知开关 */
  function setNotificationsEnabled(enabled: boolean): void {
    notificationsEnabled.value = enabled
    persist()
  }

  /** 设置 Toast 时长 */
  function setToastDuration(duration: ToastDuration): void {
    toastDuration.value = duration
    persist()
  }

  /** 设置漫游角色模型 */
  function setCharacterModel(model: CharacterModelName): void {
    characterModel.value = model
    persist()
  }

  /** 从 localStorage 初始化设置 */
  async function initFromStorage(): Promise<void> {
    const stored = loadFromStorage()
    if (stored) {
      // 合并：以 DEFAULT_SETTINGS 为基础，覆盖已存储的值（防止缺少新字段）
      const merged: SettingsState = { ...DEFAULT_SETTINGS, ...stored }
      applyState(merged)
    } else {
      applyState(DEFAULT_SETTINGS)
    }
    applyToDOM()
    syncToSystemStore()

    // Apply saved language to i18n and Element Plus
    await setLanguage(language.value)
  }

  /** 重置为默认设置 */
  function resetToDefaults(): void {
    applyState(DEFAULT_SETTINGS)
    applyToDOM()
    syncToSystemStore()
    persist()
  }

  // ==========================================================================
  // 返回
  // ==========================================================================

  return {
    // 状态
    theme,
    language,
    renderQuality,
    showGrid,
    showAxes,
    aiAssistantEnabled,
    notificationsEnabled,
    toastDuration,
    characterModel,
    elementPlusLocale,

    // Actions
    setTheme,
    setLanguage,
    setRenderQuality,
    toggleGrid,
    toggleAxes,
    toggleAiAssistant,
    setNotificationsEnabled,
    setToastDuration,
    setCharacterModel,
    initFromStorage,
    resetToDefaults,
  }
})
