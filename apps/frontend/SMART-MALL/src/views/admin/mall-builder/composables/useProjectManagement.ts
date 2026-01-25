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
  generateId,
} from '@/builder'

export function useProjectManagement() {
  const router = useRouter()
  const route = useRoute()

  // 服务器项目状态
  const serverProjectId = ref<string | null>(null)
  const isSaving = ref(false)
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

  // 未保存更改跟踪
  const hasUnsavedChanges = ref(false)
  const lastSavedState = ref<string | null>(null)

  /**
   * 创建新项目（从模板）
   */
  function createFromTemplate(
    template: MallTemplate,
    projectName: string
  ): MallProject {
    const project = createProjectFromTemplate(template, projectName)
    router.replace({ params: { projectId: project.id } })
    return project
  }

  /**
   * 创建自定义项目
   */
  function createCustomProject(projectName: string): MallProject {
    const project = createEmptyProject(projectName)
    project.floors.push(createDefaultFloor(1, '1F'))
    router.replace({ params: { projectId: project.id } })
    return project
  }

  /**
   * 标记有未保存的更改
   */
  function markUnsaved() {
    hasUnsavedChanges.value = true
  }

  /**
   * 标记已保存
   */
  function markSaved(project: MallProject) {
    hasUnsavedChanges.value = false
    lastSavedState.value = JSON.stringify(project)
  }

  /**
   * 检查是否有未保存的更改
   */
  function checkUnsavedChanges(project: MallProject | null): boolean {
    if (!project) return false
    if (!lastSavedState.value) return hasUnsavedChanges.value
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

      const isNewProject = !serverProjectId.value
      let response

      if (serverProjectId.value) {
        response = await mallBuilderApi.updateProject(
          serverProjectId.value,
          toUpdateRequest(project)
        )
      } else {
        response = await mallBuilderApi.createProject(toCreateRequest(project))
      }

      const savedProject = toMallProject(response)
      serverProjectId.value = response.projectId
      project.version = savedProject.version

      if (isNewProject) {
        router.replace({ params: { projectId: response.projectId } })
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

      serverProjectId.value = response.projectId
      router.replace({ params: { projectId: response.projectId } })
      showProjectListModal.value = false
      markSaved(loadedProject)

      return loadedProject
    } catch (err) {
      console.error('加载项目失败:', err)
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
   * 获取 URL 中的项目 ID
   */
  function getProjectIdFromUrl(): string | undefined {
    return route.params.projectId as string | undefined
  }

  return {
    // 状态
    serverProjectId,
    isSaving,
    saveMessage,
    showProjectListModal,
    projectList,
    isLoadingProjects,
    hasUnsavedChanges,
    lastSavedState,

    // 方法
    createFromTemplate,
    createCustomProject,
    markUnsaved,
    markSaved,
    checkUnsavedChanges,
    saveToServer,
    loadProjectList,
    loadFromServer,
    deleteFromServer,
    exportData,
    importData,
    getProjectIdFromUrl,
  }
}
