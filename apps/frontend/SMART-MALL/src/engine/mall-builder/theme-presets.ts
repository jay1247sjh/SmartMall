/**
 * ============================================================================
 * 3D 场景主题色预设 (Theme Presets)
 * ============================================================================
 *
 * 定义 light / dark 两套 3D 场景配色方案。
 * 引擎层不引用业务概念，仅提供纯色值配置。
 *
 * - dark: 深色中性灰，与前端 CSS 变量 bg-primary / bg-secondary 对齐
 * - light: 暖白色调，参考 Claude 风格的柔和米白
 */

export interface SceneThemePreset {
  /** scene.background */
  backgroundColor: number
  /** 地板颜色 */
  groundColor: number
  /** 网格中心线颜色 */
  gridCenterLineColor: number
  /** 网格普通线颜色 */
  gridLineColor: number
  /** envMap 顶部颜色 */
  envMapTopColor: number
  /** envMap 底部颜色 */
  envMapBottomColor: number
  /** 半球光天空色 */
  hemisphereSkyColor: number
  /** 半球光地面色 */
  hemisphereGroundColor: number
  /** 主光源强度 */
  keyLightIntensity: number
  /** 补光灯强度 */
  fillLightIntensity: number
  /** 轮廓光强度 */
  rimLightIntensity: number
  /** 半球光强度 */
  hemisphereLightIntensity: number
}

export type SceneTheme = 'dark' | 'light'

/**
 * 深色主题 — 中性灰，对齐 frontend-style-guide.md
 */
const DARK_PRESET: SceneThemePreset = {
  backgroundColor: 0x0a0a0b,
  groundColor: 0x111113,
  gridCenterLineColor: 0x3f3f46,
  gridLineColor: 0x27272a,
  envMapTopColor: 0x18181b,
  envMapBottomColor: 0x0a0a0b,
  hemisphereSkyColor: 0x3f3f46,
  hemisphereGroundColor: 0x27272a,
  keyLightIntensity: 1.8,
  fillLightIntensity: 0.8,
  rimLightIntensity: 0.5,
  hemisphereLightIntensity: 1.0,
}

/**
 * 浅色主题 — 暖白色调，Claude 风格柔和米白
 */
const LIGHT_PRESET: SceneThemePreset = {
  backgroundColor: 0xf5f0e8,
  groundColor: 0xebe5d9,
  gridCenterLineColor: 0xc8c0b4,
  gridLineColor: 0xd8d0c4,
  envMapTopColor: 0xe8e0d4,
  envMapBottomColor: 0xf5f0e8,
  hemisphereSkyColor: 0xf0ebe0,
  hemisphereGroundColor: 0xd8d0c4,
  keyLightIntensity: 1.4,
  fillLightIntensity: 0.6,
  rimLightIntensity: 0.3,
  hemisphereLightIntensity: 0.8,
}

export const SCENE_THEME_PRESETS: Record<SceneTheme, SceneThemePreset> = {
  dark: DARK_PRESET,
  light: LIGHT_PRESET,
}

/**
 * 获取指定主题的预设
 */
export function getSceneThemePreset(theme: SceneTheme): SceneThemePreset {
  return SCENE_THEME_PRESETS[theme]
}
