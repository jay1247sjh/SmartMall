/**
 * 项目管理 Composable
 * 处理项目的创建、保存、加载、导入导出
 */
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { MallProject, MallTemplate } from '@/builder'
import {
  createEmptyProject,
  createDefaultFloor,
  createProjectFromTemplate,
  exportProject,
  importProject,
} from '@/builder'

export function useProjectManagement() {
  const router = useRouter()
  const route = useRoute()

  // 服务器项目状态
  const serverProjectId = ref<string | null>(null)
  const isSaving = ref(false)
  const isPublishing = ref(false)
  const saveMessage = ref<string | null>(null)
  const showProjectListModal = ref(false)
  const projectList = ref<{
    projectId: string
    name: string
    description?: string
    floorCount: number
    areaCount: number
    createdAt: string
    updatedAt: string
  }[]>([])
  const isLoadingProjects = ref(false)

  // 未保存更改跟踪（纯数据比较，无布尔标志）
  const lastSavedState = ref<string | null>(null)

  function isServerProjectId(projectId?: string | null): boolean {
    if (!projectId) return false
    return /^[a-fA-F0-9]{32}$/.test(projectId)
  }

  function resolveServerProjectIdFromResponse(response: unknown): string | null {
    if (!response || typeof response !== 'object') return null
    const data = response as { projectId?: unknown; id?: unknown }
    if (typeof data.projectId === 'string' && data.projectId) return data.projectId
    if (typeof data.id === 'string' && data.id) return data.id
    return null
  }

  function isDuplicateDataError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err)
    return /数据已存在|请勿重复操作|duplicate|Duplicate entry/i.test(message)
  }

  function stripNestedIdsFromUpdateRequest<T extends { floors?: Array<{ floorId?: string; areas?: Array<{ areaId?: string }> }> }>(
    request: T
  ): T {
    return {
      ...request,
      floors: request.floors?.map(floor => ({
        ...floor,
        floorId: undefined,
        areas: floor.areas?.map(area => ({
          ...area,
          areaId: undefined,
        })),
      })),
    }
  }

  function getEffectiveServerProjectId(): string | null {
    if (serverProjectId.value) return serverProjectId.value
    const routeProjectId = getProjectIdFromUrl()
    if (isServerProjectId(routeProjectId)) return routeProjectId ?? null
    return null
  }

  /**
   * 创建新项目（从模板）
   */
  function createFromTemplate(
    template: MallTemplate,
    projectName: string
  ): MallProject {
    const project = createProjectFromTemplate(template, projectName)
    serverProjectId.value = null
    lastSavedState.value = null
    router.replace({ params: { projectId: project.id } })
    return project
  }

  /**
   * 创建自定义项目
   */
  function createCustomProject(projectName: string): MallProject {
    const project = createEmptyProject(projectName)
    project.floors.push(createDefaultFloor(1, '1F'))
    serverProjectId.value = null
    lastSavedState.value = null
    router.replace({ params: { projectId: project.id } })
    return project
  }

  /**
   * 标记已保存（快照当前状态）
   */
  function markSaved(project: MallProject) {
    lastSavedState.value = JSON.stringify(project)
  }

  /**
   * 检查是否有未保存的更改（纯数据比较）
   */
  function checkUnsavedChanges(project: MallProject | null): boolean {
    if (!project) return false
    if (!lastSavedState.value) return true
    return JSON.stringify(project) !== lastSavedState.value
  }
  /**
   * 保存项目到服务器
   */
  async function saveToServer(project: MallProject): Promise<boolean> {
    if (isSaving.value) return false

    isSaving.value = true
    saveMessage.value = null

    try {
      const { mallBuilderApi, toCreateRequest, toUpdateRequest, toMallProject } = 
        await import('@/api/mall-builder.api')

      const existingProjectId = getEffectiveServerProjectId()
      const isNewProject = !existingProjectId
      let response

      try {
        if (existingProjectId) {
          response = await mallBuilderApi.updateProject(
            existingProjectId,
            toUpdateRequest(project)
          )
        } else {
          response = await mallBuilderApi.createProject(toCreateRequest(project))
        }
      } catch (err: unknown) {
        if (!isDuplicateDataError(err)) {
          throw err
        }

        const retryProjectId = existingProjectId || (isServerProjectId(project.id) ? project.id : null)
        if (!retryProjectId) {
          throw err
        }

        // 后端更新流程是“软删除后重建”，保留旧 floorId/areaId 会触发唯一键冲突。
        // 出现重复错误时，移除嵌套 ID 再重试一次更新。
        const fallbackRequest = stripNestedIdsFromUpdateRequest(toUpdateRequest(project))
        response = await mallBuilderApi.updateProject(retryProjectId, fallbackRequest)
      }

      const savedProject = toMallProject(response)
      const resolvedProjectId =
        resolveServerProjectIdFromResponse(response) ??
        savedProject.id ??
        existingProjectId

      if (!resolvedProjectId) {
        throw new Error('保存成功但未返回项目ID')
      }

      serverProjectId.value = resolvedProjectId
      project.id = resolvedProjectId
      project.version = savedProject.version

      if (isNewProject) {
        router.replace({ params: { projectId: resolvedProjectId } })
      }

      markSaved(project)
      saveMessage.value = '保存成功'
      setTimeout(() => { saveMessage.value = null }, 2000)
      return true
    } catch (err: unknown) {
      console.error('保存失败:', err)
      const errorMessage = err instanceof Error ? err.message : '保存失败，请重试'
      saveMessage.value = errorMessage
      setTimeout(() => { saveMessage.value = null }, 3000)
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 加载项目列表
   */
  async function loadProjectList(): Promise<void> {
    isLoadingProjects.value = true
    try {
      const { mallBuilderApi } = await import('@/api/mall-builder.api')
      projectList.value = await mallBuilderApi.getProjectList()
      showProjectListModal.value = true
    } catch (err) {
      console.error('加载项目列表失败:', err)
    } finally {
      isLoadingProjects.value = false
    }
  }

  /**
   * 从服务器加载项目
   */
  async function loadFromServer(projectId: string): Promise<MallProject | null> {
    try {
      const { mallBuilderApi, toMallProject } = await import('@/api/mall-builder.api')
      const response = await mallBuilderApi.getProject(projectId)
      const loadedProject = toMallProject(response)
      const resolvedProjectId = resolveServerProjectIdFromResponse(response) ?? loadedProject.id

      serverProjectId.value = resolvedProjectId
      router.replace({ params: { projectId: resolvedProjectId } })
      showProjectListModal.value = false
      markSaved(loadedProject)

      return loadedProject
    } catch (err) {
      console.error('加载项目失败:', err)
      return null
    }
  }

  /**
   * 从版本快照加载项目（预览模式，只读）
   */
  async function loadFromVersionSnapshot(versionId: string): Promise<MallProject | null> {
    try {
      const { getVersionSnapshot } = await import('@/api/mall-manage.api')
      const { toMallProject } = await import('@/api/mall-builder.api')
      const snapshot = await getVersionSnapshot(versionId)
      return toMallProject(snapshot)
    } catch (err) {
      console.error('加载版本快照失败:', err)
      return null
    }
  }

  /**
   * 删除服务器上的项目
   */
  async function deleteFromServer(projectId: string): Promise<boolean> {
    if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return false

    try {
      const { mallBuilderApi } = await import('@/api/mall-builder.api')
      await mallBuilderApi.deleteProject(projectId)
      await loadProjectList()
      return true
    } catch (err) {
      console.error('删除项目失败:', err)
      return false
    }
  }

  /**
   * 导出项目为 JSON
   */
  function exportData(project: MallProject): void {
    const json = exportProject(project)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入项目
   */
  function importData(file: File): Promise<MallProject | null> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          const result = importProject(json)
          if (result.success && result.project) {
            resolve(result.project)
          } else {
            resolve(null)
          }
        } catch (err) {
          console.error('导入失败:', err)
          resolve(null)
        }
      }
      reader.readAsText(file)
    })
  }

  /**
   * 发布项目到服务器
   */
  async function publishToServer(projectId: string): Promise<boolean> {
    if (isPublishing.value) return false

    isPublishing.value = true
    saveMessage.value = null

    try {
      const { mallBuilderApi } = await import('@/api/mall-builder.api')
      await mallBuilderApi.publishProject(projectId)
      saveMessage.value = '发布成功'
      setTimeout(() => { saveMessage.value = null }, 2000)
      return true
    } catch (err: unknown) {
      console.error('发布失败:', err)
      const errorMessage = err instanceof Error ? err.message : '发布失败，请重试'
      saveMessage.value = errorMessage
      setTimeout(() => { saveMessage.value = null }, 3000)
      return false
    } finally {
      isPublishing.value = false
    }
  }

  /**
   * 获取 URL 中的项目 ID
   */
  function getProjectIdFromUrl(): string | undefined {
    return route.params.projectId as string | undefined
  }

  return {
    // 状态
    serverProjectId,
    isSaving,
    isPublishing,
    saveMessage,
    showProjectListModal,
    projectList,
    isLoadingProjects,
    lastSavedState,

    // 方法
    createFromTemplate,
    createCustomProject,
    markSaved,
    checkUnsavedChanges,
    saveToServer,
    loadProjectList,
    loadFromServer,
    loadFromVersionSnapshot,
    deleteFromServer,
    exportData,
    importData,
    publishToServer,
    getProjectIdFromUrl,
  }
}
