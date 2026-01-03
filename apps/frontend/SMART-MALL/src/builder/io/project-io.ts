/**
 * 项目导入/导出模块
 * 
 * 支持项目的序列化和反序列化
 * 格式版本管理和向后兼容
 */

import type { MallProject, ProjectExport } from '../types/mall-project'
import { createDefaultSettings, generateId } from '../types/mall-project'

/** 当前格式版本 */
export const FORMAT_VERSION = '1.0.0'

// ============================================================================
// 导出函数
// ============================================================================

/**
 * 导出项目为JSON字符串
 */
export function exportProject(project: MallProject): string {
  const exportData: ProjectExport = {
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    project: structuredClone(project),
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * 导出项目为Blob（用于下载）
 */
export function exportProjectAsBlob(project: MallProject): Blob {
  const json = exportProject(project)
  return new Blob([json], { type: 'application/json' })
}

/**
 * 触发项目下载
 */
export function downloadProject(project: MallProject, filename?: string): void {
  const blob = exportProjectAsBlob(project)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename ?? `${project.name}.mall.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// 导入函数
// ============================================================================

/**
 * 导入项目结果
 */
export interface ImportResult {
  success: boolean
  project?: MallProject
  error?: string
  warnings?: string[]
}

/**
 * 从JSON字符串导入项目
 */
export function importProject(json: string): ImportResult {
  try {
    const data = JSON.parse(json)
    return parseProjectData(data)
  } catch (e) {
    return {
      success: false,
      error: `JSON解析失败: ${e instanceof Error ? e.message : '未知错误'}`,
    }
  }
}

/**
 * 从文件导入项目
 */
export async function importProjectFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    return importProject(text)
  } catch (e) {
    return {
      success: false,
      error: `文件读取失败: ${e instanceof Error ? e.message : '未知错误'}`,
    }
  }
}

/**
 * 解析项目数据
 */
function parseProjectData(data: unknown): ImportResult {
  const warnings: string[] = []
  
  // 检查是否为对象
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: '无效的项目数据格式' }
  }
  
  const obj = data as Record<string, unknown>
  
  // 检查是否为导出格式
  if ('formatVersion' in obj && 'project' in obj) {
    const exportData = obj as ProjectExport
    
    // 版本检查
    if (exportData.formatVersion !== FORMAT_VERSION) {
      warnings.push(`文件版本 ${exportData.formatVersion} 与当前版本 ${FORMAT_VERSION} 不同，可能存在兼容性问题`)
    }
    
    const projectResult = validateAndMigrateProject(exportData.project)
    if (!projectResult.success) {
      return projectResult
    }
    
    return {
      success: true,
      project: projectResult.project,
      warnings: [...warnings, ...(projectResult.warnings ?? [])],
    }
  }
  
  // 尝试直接解析为项目
  if ('outline' in obj && 'floors' in obj) {
    return validateAndMigrateProject(obj as MallProject)
  }
  
  return { success: false, error: '无法识别的项目格式' }
}

/**
 * 验证并迁移项目数据
 */
function validateAndMigrateProject(project: MallProject): ImportResult {
  const warnings: string[] = []
  const migrated = structuredClone(project)
  
  // 确保有ID
  if (!migrated.id) {
    migrated.id = generateId()
    warnings.push('项目缺少ID，已自动生成')
  }
  
  // 确保有名称
  if (!migrated.name) {
    migrated.name = '未命名项目'
    warnings.push('项目缺少名称，已设置默认值')
  }
  
  // 确保有时间戳
  const now = new Date().toISOString()
  if (!migrated.createdAt) {
    migrated.createdAt = now
  }
  migrated.updatedAt = now
  
  // 确保有版本号
  if (typeof migrated.version !== 'number') {
    migrated.version = 1
  }
  
  // 验证轮廓
  if (!migrated.outline || !Array.isArray(migrated.outline.vertices)) {
    return { success: false, error: '项目缺少有效的轮廓数据' }
  }
  
  if (migrated.outline.vertices.length < 3) {
    return { success: false, error: '轮廓至少需要3个顶点' }
  }
  
  // 确保轮廓闭合
  if (migrated.outline.isClosed === undefined) {
    migrated.outline.isClosed = true
  }
  
  // 确保有楼层数组
  if (!Array.isArray(migrated.floors)) {
    migrated.floors = []
    warnings.push('项目缺少楼层数据，已初始化为空')
  }
  
  // 验证每个楼层
  for (let i = 0; i < migrated.floors.length; i++) {
    const floor = migrated.floors[i]
    
    if (!floor.id) {
      floor.id = generateId()
    }
    
    if (!floor.name) {
      floor.name = `${floor.level ?? i + 1}F`
    }
    
    if (typeof floor.level !== 'number') {
      floor.level = i + 1
    }
    
    if (typeof floor.height !== 'number') {
      floor.height = 4
    }
    
    if (floor.inheritOutline === undefined) {
      floor.inheritOutline = true
    }
    
    if (!Array.isArray(floor.areas)) {
      floor.areas = []
    }
    
    if (floor.visible === undefined) {
      floor.visible = true
    }
    
    if (floor.locked === undefined) {
      floor.locked = false
    }
  }
  
  // 确保有设置
  if (!migrated.settings) {
    migrated.settings = createDefaultSettings()
    warnings.push('项目缺少设置，已使用默认值')
  } else {
    // 合并默认设置
    migrated.settings = {
      ...createDefaultSettings(),
      ...migrated.settings,
      display: {
        ...createDefaultSettings().display,
        ...migrated.settings.display,
      },
    }
  }
  
  return {
    success: true,
    project: migrated,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 检查是否为有效的项目文件
 */
export function isValidProjectFile(filename: string): boolean {
  return filename.endsWith('.mall.json') || filename.endsWith('.json')
}

/**
 * 获取建议的文件名
 */
export function getSuggestedFilename(project: MallProject): string {
  const safeName = project.name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 50)
  
  return `${safeName}.mall.json`
}
