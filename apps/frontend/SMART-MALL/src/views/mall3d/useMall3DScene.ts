/**
 * Mall3D 场景渲染 Composable
 * 封装 Three.js 场景创建、加载、渲染逻辑
 */
import { ref, type Ref } from 'vue'
import * as THREE from 'three'
import { ThreeEngine } from '@/engine'
import type { GeneratedMallData, GeneratedFloorData, GeneratedAreaData } from '@/domain/mall/mall.types'
import type { FloorOption, LoadingState } from '@/shared/types/ui.types'
import { AREA_HEIGHT_MAP, CATEGORY_NAMES, DEFAULT_FLOORS } from '@/domain/mall/mall.constants'

export interface UseMall3DSceneOptions {
  containerRef: Ref<HTMLElement | null>
}

export interface UseMall3DSceneReturn {
  engine: Ref<ThreeEngine | null>
  loading: Ref<LoadingState>
  floors: Ref<FloorOption[]>
  currentFloor: Ref<number>
  mallData: Ref<GeneratedMallData | null>
  showImportSuccess: Ref<boolean>
  initScene: () => Promise<void>
  switchFloor: (floorId: number) => Promise<void>
  clearMall: () => void
  dispose: () => void
}

/** 示例店铺位置配置 */
const STORE_POSITIONS = [
  { x: -15, z: -15, color: 0x60a5fa },
  { x: 0, z: -15, color: 0x34d399 },
  { x: 15, z: -15, color: 0xa78bfa },
  { x: -15, z: 0, color: 0xfbbf24 },
  { x: 15, z: 0, color: 0xf28b82 },
  { x: -15, z: 15, color: 0x60a5fa },
  { x: 0, z: 15, color: 0x34d399 },
  { x: 15, z: 15, color: 0xa78bfa },
]

export function useMall3DScene(options: UseMall3DSceneOptions): UseMall3DSceneReturn {
  const { containerRef } = options

  // 状态
  const engine = ref<ThreeEngine | null>(null)
  const loading = ref<LoadingState>({ isLoading: true, progress: 0, text: '初始化引擎...' })
  const floors = ref<FloorOption[]>([...DEFAULT_FLOORS])
  const currentFloor = ref(1)
  const mallData = ref<GeneratedMallData | null>(null)
  const showImportSuccess = ref(false)

  /**
   * 更新加载状态
   */
  function updateLoading(progress: number, text: string) {
    loading.value.progress = progress
    loading.value.text = text
  }

  /**
   * 初始化 3D 场景
   */
  async function initScene() {
    if (!containerRef.value) return

    updateLoading(20, '创建 3D 场景...')

    engine.value = new ThreeEngine(containerRef.value, {
      backgroundColor: 0x0a0a0a,
      antialias: true,
      cameraMode: 'orbit',
    })

    updateLoading(40, '加载场景资源...')
    engine.value.addGridHelper(100, 100)

    updateLoading(60, '构建商城模型...')

    // 尝试加载 AI 生成的商城数据
    const savedData = localStorage.getItem('ai_generated_mall')
    if (savedData) {
      try {
        mallData.value = JSON.parse(savedData)
        await loadGeneratedMall(mallData.value!)
        showImportSuccess.value = true
        setTimeout(() => (showImportSuccess.value = false), 3000)
      } catch (e) {
        console.error('Failed to parse generated mall data:', e)
        await loadDefaultMall()
      }
    } else {
      await loadDefaultMall()
    }

    updateLoading(80, '初始化交互...')
    engine.value.start()

    updateLoading(100, '加载完成')
    setTimeout(() => (loading.value.isLoading = false), 500)
  }

  /**
   * 加载默认商城模型
   */
  async function loadDefaultMall() {
    await new Promise(resolve => setTimeout(resolve, 800))
    if (!engine.value) return

    const scene = engine.value.getScene()

    // 创建地板
    const floor = createFloor(80, 80)
    scene.add(floor)

    // 创建示例店铺
    STORE_POSITIONS.forEach(pos => {
      engine.value!.addBox(
        new THREE.Vector3(pos.x, 0, pos.z),
        { width: 8, height: 4, depth: 8 },
        pos.color
      )
    })

    engine.value.requestRender()
  }

  /**
   * 加载 AI 生成的商城数据
   */
  async function loadGeneratedMall(data: GeneratedMallData) {
    if (!engine.value || !data) return

    const scene = engine.value.getScene()

    // 计算商城尺寸
    let width = 100, height = 80
    if (data.outline?.vertices?.length && data.outline.vertices.length >= 2) {
      const xs = data.outline.vertices.map(v => v.x)
      const ys = data.outline.vertices.map(v => v.y)
      width = Math.max(...xs) - Math.min(...xs)
      height = Math.max(...ys) - Math.min(...ys)
    }

    // 创建地板
    const floor = createFloor(width + 20, height + 20)
    floor.position.set(width / 2, 0, height / 2)
    scene.add(floor)

    // 更新楼层数据
    if (data.floors?.length) {
      floors.value = data.floors.map((f, index) => ({
        id: f.level || index + 1,
        name: f.name || `${index + 1}F`,
        label: `${f.name || `${index + 1}F`} - ${getFloorDescription(f)}`,
      }))
    }

    // 渲染当前楼层
    const floorData = data.floors?.find(f => f.level === currentFloor.value) || data.floors?.[0]
    if (floorData?.areas) {
      await renderAreas(floorData.areas)
    }

    engine.value.requestRender()
  }

  /**
   * 创建地板网格
   */
  function createFloor(width: number, depth: number): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(width, depth)
    const material = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    return mesh
  }

  /**
   * 获取楼层描述
   */
  function getFloorDescription(floor: GeneratedFloorData): string {
    if (!floor.areas?.length) return '待规划'
    const storeCount = floor.areas.filter(a => a.type === 'store').length
    const types = [...new Set(floor.areas.map(a => a.properties?.category).filter(Boolean))]
    if (types.length > 0) {
      return types.map(t => CATEGORY_NAMES[t as string] || t).join('·')
    }
    return `${storeCount} 家店铺`
  }

  /**
   * 渲染区域列表
   */
  async function renderAreas(areas: GeneratedAreaData[]) {
    for (const area of areas) {
      await renderArea(area)
    }
  }

  /**
   * 渲染单个区域
   */
  async function renderArea(area: GeneratedAreaData) {
    if (!engine.value || !area.shape?.vertices?.length) return

    const scene = engine.value.getScene()
    const vertices = area.shape.vertices

    // 计算区域边界
    const xs = vertices.map(v => v.x)
    const ys = vertices.map(v => v.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const centerX = (minX + maxX) / 2
    const centerZ = (minY + maxY) / 2
    const areaWidth = maxX - minX
    const areaDepth = maxY - minY
    const areaHeight = AREA_HEIGHT_MAP[area.type] || 4

    // 解析颜色
    const color = area.color ? parseInt(area.color.replace('#', ''), 16) : 0x3b82f6

    if (area.type === 'corridor') {
      // 走廊：扁平透明
      const geometry = new THREE.BoxGeometry(areaWidth, 0.1, areaDepth)
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        transparent: true,
        opacity: 0.5,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(centerX, 0.05, centerZ)
      mesh.userData = { name: area.name, type: area.type, isArea: true }
      scene.add(mesh)
    } else {
      // 店铺：立体方块
      const geometry = new THREE.BoxGeometry(areaWidth - 1, areaHeight, areaDepth - 1)
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(centerX, areaHeight / 2, centerZ)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { name: area.name, type: area.type, isArea: true }
      scene.add(mesh)

      // 添加名称标签
      const sprite = createTextSprite(area.name)
      sprite.position.set(centerX, areaHeight + 1, centerZ)
      sprite.userData = { isArea: true }
      scene.add(sprite)
    }
  }

  /**
   * 创建文字 Sprite
   */
  function createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 256
    canvas.height = 64
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(8, 2, 1)
    return sprite
  }

  /**
   * 清除场景中的区域对象
   */
  function clearAreaObjects() {
    if (!engine.value) return
    const scene = engine.value.getScene()
    const toRemove: THREE.Object3D[] = []
    scene.traverse(obj => {
      if ((obj.type === 'Mesh' || obj.type === 'Sprite') && obj.userData?.isArea) {
        toRemove.push(obj)
      }
    })
    toRemove.forEach(obj => scene.remove(obj))
  }

  /**
   * 切换楼层
   */
  async function switchFloor(floorId: number) {
    currentFloor.value = floorId

    if (mallData.value && engine.value) {
      clearAreaObjects()

      const floorData = mallData.value.floors?.find(f => f.level === floorId)
      if (floorData?.areas) {
        await renderAreas(floorData.areas)
      }

      engine.value.requestRender()
    }
  }

  /**
   * 清除生成的商城，重置为默认
   */
  function clearMall() {
    localStorage.removeItem('ai_generated_mall')
    mallData.value = null
    floors.value = [...DEFAULT_FLOORS]

    if (engine.value) {
      const scene = engine.value.getScene()
      const toRemove: THREE.Object3D[] = []
      scene.traverse(obj => {
        if (obj.type === 'Mesh' || obj.type === 'Sprite') {
          toRemove.push(obj)
        }
      })
      toRemove.forEach(obj => scene.remove(obj))
      loadDefaultMall()
    }
  }

  /**
   * 销毁引擎
   */
  function dispose() {
    engine.value?.dispose()
  }

  return {
    engine,
    loading,
    floors,
    currentFloor,
    mallData,
    showImportSuccess,
    initScene,
    switchFloor,
    clearMall,
    dispose,
  }
}
