/**
 * 项目管理 Composable
 * 
 * 职责：
 * - 项目的创建、加载、保存
 * - 导入导出功能
 * - 未保存更改跟踪
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MallProject, MallTemplate } from '@/builder'
import {
  createEmptyProject,
  createDefaultFloor,
  createProjectFromTemplate,
  getAllTemplates,
  exportProject,
  importProject,
} from '@/builder'

export function useProjectManagement() {
  const router = useRouter()

  // 项目数据
  const project = ref<MallProject | null>(null)
  const serverProjectId = ref<string | null>(null)
  
  // 向导状态
  const showWizard = ref(true)
  const selectedTemplate = ref<MallTemplate | null>(null)
  const newProjectName = ref('我的商城')
  
  // 保存状态
  const isSaving = ref(false)
  const saveMessage = ref<string | null>(null)
  const hasUnsavedChanges = ref(false)
  const lastSavedState = ref<string | null>(null)
  
  // 项目列表
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
  
  // 离开确认
  const showLeaveConfirm = ref(false)
  const pendingNavigation = ref<(() => void) | null>(null)
  
  // 模板列表
  const templates = computed(() => getAllTemplates())

  /**
   * 创建新项目（从模板）
   */
  function createNewProject(onSuccess?: (project: MallProject) => void) {
    if (!selectedTemplate.value) return

    project.value = createProjectFromTemplate(
      selectedTemplate.value,
      newProjectName.value
    )

    // 更新 URL
    router.replace({ params: { projectId: project.value.id } })

    showWizard.value = false
    
    if (onSuccess) {
      onSuccess(project.value)
    }
  }

  /**
   * 创建自定义项目
   */
  function createCustomProject(onSuccess?: (project: MallProject) => void) {
    project.value = createEmptyProject(newProjectName.value)
    project.value.floors.push(createDefaultFloor(1, '1F'))
    
    // 更新 URL
    router.replace({ params: { projectId: project.value.id } })
    
    showWizard.value = false
    
    if (onSuccess) {
      onSuccess(project.value)
    }
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
  function markSaved() {
    hasUnsavedChanges.value = false
    if (project.value) {
      lastSavedState.value = JSON.stringify(project.value)
    }
  }

  /**
   * 检查是否有未保存的更改
   */
  function checkUnsavedChanges(): boolean {
    if (!project.value) return false
    if (!lastSavedState.value) return hasUnsavedChanges.value
    return JSON.stringify(project.value) !== lastSavedState.value
  }

  /**
   * 保存项目到服务器
   */
  async function saveToServer() {
    if (!project.value || isSaving.value) return
    
    isSaving.value = true
    saveMessage.value = null
    
    try {
      const { mallBuilderApi, toCreateRequest, toUpdateRequest, toMallProject } = await import('@/api/mall-builder.api')
      
      const isNewProject = !serverProjectId.value
      let response
      if (serverProjectId.value) {
        response = await mallBuilderApi.updateProject(serverProjectId.value, toUpdateRequest(project.value))
      } else {
        response = await mallBuilderApi.createProject(toCreateRequest(project.value))
      }
      
      const savedProject = toMallProject(response)
      serverProjectId.value = response.projectId
      project.value.version = savedProject.version
      
      if (isNewProject) {
        router.replace({ params: { projectId: response.projectId } })
      }
      
      markSaved()
      
      saveMessage.value = '保存成功'
      setTimeout(() => { saveMessage.value = null }, 2000)
    } catch (err: unknown) {
      console.error('保存失败:', err)
      const errorMessage = err instanceof Error ? err.message : '保存失败，请重试'
      saveMessage.value = errorMessage
      setTimeout(() => { saveMessage.value = null }, 3000)
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 加载项目列表
   */
  async function loadProjectList() {
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
  async function loadFromServer(
    projectId: string,
    onSuccess?: (project: MallProject, firstFloorId: string | null) => void
  ) {
    try {
      const { mallBuilderApi, toMallProject } = await import('@/api/mall-builder.api')
      const response = await mallBuilderApi.getProject(projectId)
      const loadedProject = toMallProject(response)
      
      project.value = loadedProject
      serverProjectId.value = response.projectId
      const firstFloorId = loadedProject.floors[0]?.id || null
      
      router.replace({ params: { projectId: response.projectId } })
      
      showWizard.value = false
      showProjectListModal.value = false
      
      markSaved()
      
      if (onSuccess) {
        onSuccess(loadedProject, firstFloorId)
      }
    } catch (err) {
      console.error('加载项目失败:', err)
    }
  }

  /**
   * 删除服务器上的项目
   */
  async function deleteFromServer(projectId: string) {
    if (!confirm('确定要删除此项目吗？此操作不可恢复。')) return
    
    try {
      const { mallBuilderApi } = await import('@/api/mall-builder.api')
      await mallBuilderApi.deleteProject(projectId)
      await loadProjectList()
    } catch (err) {
      console.error('删除项目失败:', err)
    }
  }

  /**
   * 导出项目为 JSON
   */
  function exportData() {
    if (!project.value) return
    const json = exportProject(project.value)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.value.name}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 导入项目从 JSON
   */
  function handleImport(
    event: Event,
    onSuccess?: (project: MallProject, firstFloorId: string | null) => void
  ) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const result = importProject(json)
        if (result.success && result.project) {
          project.value = result.project
          const firstFloorId = result.project.floors[0]?.id || null
          showWizard.value = false
          
          if (onSuccess) {
            onSuccess(result.project, firstFloorId)
          }
        }
      } catch (err) {
        console.error('导入失败:', err)
      }
    }
    reader.readAsText(file)
  }

  /**
   * 处理离开确认 - 保存并离开
   */
  async function handleSaveAndLeave() {
    await saveToServer()
    showLeaveConfirm.value = false
    if (pendingNavigation.value) {
      pendingNavigation.value()
      pendingNavigation.value = null
    }
  }

  /**
   * 处理离开确认 - 不保存直接离开
   */
  function handleLeaveWithoutSave() {
    hasUnsavedChanges.value = false
    showLeaveConfirm.value = false
    if (pendingNavigation.value) {
      pendingNavigation.value()
      pendingNavigation.value = null
    }
  }

  /**
   * 处理离开确认 - 取消
   */
  function handleCancelLeave() {
    showLeaveConfirm.value = false
    pendingNavigation.value = null
  }

  return {
    // 状态
    project,
    serverProjectId,
    showWizard,
    selectedTemplate,
    newProjectName,
    isSaving,
    saveMessage,
    hasUnsavedChanges,
    showProjectListModal,
    projectList,
    isLoadingProjects,
    showLeaveConfirm,
    pendingNavigation,
    templates,
    
    // 方法
    createNewProject,
    createCustomProject,
    markUnsaved,
    markSaved,
    checkUnsavedChanges,
    saveToServer,
    loadProjectList,
    loadFromServer,
    deleteFromServer,
    exportData,
    handleImport,
    handleSaveAndLeave,
    handleLeaveWithoutSave,
    handleCancelLeave,
  }
}
