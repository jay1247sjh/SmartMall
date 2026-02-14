/**
 * Mall3D 第三人称漫游 Composable
 *
 * 整合：ThreeEngine 初始化 → API 数据获取 → 场景渲染 → 角色控制 → 输入/相机。
 *
 * 复用模块：
 * - useRendering（renderProject + createRoamingEnvironment）
 * - CharacterController（移动、碰撞、动画）
 * - useRoamingMode（键盘输入、角色更新循环、相机跟随协调）
 * - collision.ts（extractWallSegments、getOutlineBoundary、getInitialPosition）
 */
import { ref, type Ref } from 'vue'
import { ThreeEngine } from '@/engine'
import type { ThreeEngine as ThreeEngineType } from '@/engine'
import {
  CharacterController,
  extractWallSegments,
  getOutlineBoundary,
  getInitialPosition,
} from '@/builder'
import type { MallProject } from '@/builder'
import type { LoadingState } from '@/shared/types/ui.types'
import { mallApi } from '@/api/mall.api'
import { toMallProject } from '@/api/mall-builder.api'
import { useRendering, useRoamingMode } from '@/views/admin/mall-builder/composables'

// ============================================================================
// 类型定义
// ============================================================================

export interface UseMall3DRoamingOptions {
  containerRef: Ref<HTMLElement | null>
}

export interface UseMall3DRoamingReturn {
  /** 加载状态 */
  loading: Ref<LoadingState>
  /** 错误信息（null 表示无错误） */
  error: Ref<string | null>
  /** 商城项目数据 */
  mallProject: Ref<MallProject | null>
  /** Pointer Lock 是否激活 */
  isPointerLocked: Ref<boolean>

  /** 初始化场景（在 onMounted 中调用） */
  initScene: () => Promise<void>
  /** 销毁所有资源（在 onUnmounted 中调用） */
  dispose: () => void
}

// ============================================================================
// Composable 实现
// ============================================================================

export function useMall3DRoaming(options: UseMall3DRoamingOptions): UseMall3DRoamingReturn {
  const { containerRef } = options

  // 响应式状态
  const loading = ref<LoadingState>({ isLoading: true, progress: 0, text: '初始化引擎...' })
  const error = ref<string | null>(null)
  const mallProject = ref<MallProject | null>(null)
  const isPointerLocked = ref(false)

  // 内部引用（非响应式，避免不必要的 proxy 开销）
  let engine: ThreeEngineType | null = null
  let controller: CharacterController | null = null
  let canvasClickHandler: (() => void) | null = null
  let pointerLockChangeHandler: (() => void) | null = null

  // 复用 composables
  const { renderProject } = useRendering()
  const roamingMode = useRoamingMode({
    mouseSensitivity: 0.003,
    cameraDistance: 10,
    cameraHeight: 4,
    smoothness: 1,
  })

  // ============================================================================
  // 内部工具
  // ============================================================================

  function updateLoading(progress: number, text: string) {
    loading.value = { isLoading: true, progress, text }
  }

  // ============================================================================
  // 初始化流程
  // ============================================================================

  /**
   * 初始化场景（Phase 1）
   *
   * 调用顺序：
   * 1. 创建 ThreeEngine
   * 2. 获取 MallProject 数据
   * 3. renderProject 渲染完整商城
   * 4. 创建 CharacterController + 碰撞数据
   * 5. setCharacterController → startRoaming
   * 6. 注册键盘事件 + canvas click handler
   */
  async function initScene(): Promise<void> {
    if (!containerRef.value) return

    try {
      // Step 1: 创建引擎
      updateLoading(10, '创建 3D 引擎...')
      engine = new ThreeEngine(containerRef.value, {
        backgroundColor: 0x0a0a0a,
        antialias: true,
        cameraMode: 'orbit',
      })

      // 调整相机 FOV 为 50 度，与建模器一致（默认 60 度视角偏广）
      const camera = engine.getCamera()
      camera.fov = 50
      camera.updateProjectionMatrix()

      // Step 2: 获取商城数据
      updateLoading(30, '加载商城数据...')
      const project = await fetchMallData()
      if (!project) return // error 已在 fetchMallData 中设置

      mallProject.value = project

      // Step 3: 渲染场景
      updateLoading(50, '构建 3D 场景...')
      const scene = engine.getScene()
      const firstFloor = project.floors[0]
      if (!firstFloor) {
        error.value = '商城数据异常：无楼层信息'
        loading.value.isLoading = false
        return
      }

      renderProject(scene, project, firstFloor.id, null, [], {
        isRoamingMode: true,
        useFullHeight: true,
      })

      // Step 4: 创建角色 + 碰撞
      updateLoading(70, '初始化角色...')
      const initialPos = getInitialPosition(project.outline)
      controller = new CharacterController()
      controller.setPosition(initialPos.x, 0, -initialPos.y) // 2D y → 3D -z
      controller.setMoveSpeed('normal') // 使用 normal 预设（速度 3），与建模器一致
      controller.setBoundary(getOutlineBoundary(project.outline))
      controller.setWallSegments(extractWallSegments(firstFloor))
      scene.add(controller.character)

      // Step 5: 启动漫游模式
      updateLoading(85, '启动漫游模式...')
      roamingMode.setCharacterController(controller)
      roamingMode.startRoaming(engine, controller.character)

      // Step 6: 注册输入事件
      registerInputEvents()

      // 启动渲染循环
      engine.start()

      updateLoading(100, '加载完成')
      setTimeout(() => { loading.value.isLoading = false }, 300)
    } catch (e) {
      console.error('[useMall3DRoaming] 初始化失败:', e)
      error.value = '3D 场景初始化失败，请刷新页面重试'
      loading.value.isLoading = false
    }
  }

  /**
   * 获取已发布的商城数据
   */
  async function fetchMallData(): Promise<MallProject | null> {
    try {
      const data = await mallApi.getPublishedMall()
      // API 返回 ProjectResponse 格式（projectId/floorId/areaId），需转换为前端 MallProject 格式
      return toMallProject(data as any)
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } }
      if (err.response?.status === 404) {
        error.value = '暂无已发布的商城，请联系管理员'
      } else {
        error.value = '无法加载商城数据，请检查网络后重试'
      }
      loading.value.isLoading = false
      return null
    }
  }

  // ============================================================================
  // 输入事件
  // ============================================================================

  function registerInputEvents() {
    // 键盘事件
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Canvas click → Pointer Lock
    if (engine) {
      const canvas = engine.getRenderer().domElement
      canvasClickHandler = () => engine?.requestPointerLock()
      canvas.addEventListener('click', canvasClickHandler)
    }

    // 监听 Pointer Lock 状态变化
    pointerLockChangeHandler = () => {
      isPointerLocked.value = document.pointerLockElement !== null
    }
    document.addEventListener('pointerlockchange', pointerLockChangeHandler)
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Escape 退出 pointer lock（浏览器默认行为，这里只做状态同步）
    roamingMode.handleRoamKeyDown(e)
  }

  function handleKeyUp(e: KeyboardEvent) {
    roamingMode.handleRoamKeyUp(e)
  }

  // ============================================================================
  // 清理
  // ============================================================================

  function dispose() {
    // 移除键盘事件
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)

    // 移除 canvas click handler
    if (canvasClickHandler && engine) {
      const canvas = engine.getRenderer().domElement
      canvas.removeEventListener('click', canvasClickHandler)
      canvasClickHandler = null
    }

    // 移除 pointer lock 监听
    if (pointerLockChangeHandler) {
      document.removeEventListener('pointerlockchange', pointerLockChangeHandler)
      pointerLockChangeHandler = null
    }

    // 停止漫游
    roamingMode.dispose()

    // 销毁角色
    if (controller) {
      controller.dispose()
      controller = null
    }

    // 销毁引擎
    if (engine) {
      engine.dispose()
      engine = null
    }
  }

  return {
    loading,
    error,
    mallProject,
    isPointerLocked,
    initScene,
    dispose,
  }
}
