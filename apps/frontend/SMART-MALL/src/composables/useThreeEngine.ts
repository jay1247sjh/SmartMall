/**
 * Three.js 引擎管理 Composable
 * 
 * 职责：
 * - Three.js 场景、相机、渲染器、灯光的初始化和管理
 * - 渲染循环
 * - 窗口大小调整
 * - 场景对象清理
 */
import { ref, shallowRef, onMounted, onUnmounted, type Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export function useThreeEngine(containerRef: Ref<HTMLElement | null>) {
  // 状态
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)
  const isLoading = ref(true)
  const loadProgress = ref(0)

  /**
   * 初始化 Three.js 引擎
   */
  async function initEngine() {
    if (!containerRef.value) return

    loadProgress.value = 20

    // 创建场景
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color(0x0a0a0a)

    // 创建相机 - 使用更好的俯视角度
    const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
    camera.value = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
    camera.value.position.set(0, 100, 60)
    camera.value.lookAt(0, 0, 0)

    loadProgress.value = 40

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({ antialias: true })
    renderer.value.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.value.setPixelRatio(window.devicePixelRatio)
    renderer.value.shadowMap.enabled = true
    renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.value.appendChild(renderer.value.domElement)

    loadProgress.value = 60

    // 创建轨道控制器
    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05
    controls.value.screenSpacePanning = true
    controls.value.minDistance = 10
    controls.value.maxDistance = 500
    controls.value.maxPolarAngle = Math.PI / 2.2
    controls.value.target.set(0, 6, 0)
    controls.value.enabled = false
    controls.value.update()

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.value.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
    directionalLight.position.set(30, 80, 30)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.value.add(directionalLight)

    // 添加网格
    const gridHelper = new THREE.GridHelper(120, 120, 0x1f1f1f, 0x151515)
    gridHelper.position.y = -0.02
    gridHelper.name = 'grid-helper'
    scene.value.add(gridHelper)

    // 添加地板
    const floorGeometry = new THREE.PlaneGeometry(140, 140)
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0d0d0d,
      roughness: 0.95,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.03
    floor.receiveShadow = true
    floor.name = 'ground-floor'
    scene.value.add(floor)

    loadProgress.value = 80

    // 启动渲染循环
    animate()

    loadProgress.value = 100
    setTimeout(() => { isLoading.value = false }, 300)
  }

  /**
   * 渲染循环
   */
  function animate() {
    if (!renderer.value || !scene.value || !camera.value) return
    requestAnimationFrame(animate)
    
    if (controls.value) {
      controls.value.update()
    }
    
    renderer.value.render(scene.value, camera.value)
  }

  /**
   * 处理窗口大小调整
   */
  function handleResize() {
    if (!containerRef.value || !camera.value || !renderer.value) return
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  /**
   * 清除场景对象
   */
  function clearSceneObjects() {
    if (!scene.value) return
    const toRemove: THREE.Object3D[] = []
    scene.value.traverse(obj => {
      if (
        obj.userData.isArea || 
        obj.userData.isAreaLabel || 
        obj.name.startsWith('floor-') || 
        obj.name.startsWith('area-') || 
        obj.name.startsWith('label-') || 
        obj.name === 'mall-outline' || 
        obj.name === 'preview'
      ) {
        toRemove.push(obj)
      }
    })
    toRemove.forEach(obj => {
      scene.value!.remove(obj)
      // 递归清理子对象的几何体和材质
      obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          } else if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          }
        }
        // 清理 Sprite 材质和纹理
        if (child instanceof THREE.Sprite) {
          if (child.material.map) {
            child.material.map.dispose()
          }
          child.material.dispose()
        }
      })
    })
  }

  /**
   * 重置相机位置
   */
  function resetCamera() {
    if (!camera.value || !controls.value) return
    
    camera.value.position.set(0, 100, 60)
    controls.value.target.set(0, 6, 0)
    controls.value.update()
  }

  /**
   * 更新网格和地板位置
   */
  function updateSceneCenter(centerX: number, centerZ: number) {
    if (!scene.value) return

    const gridHelper = scene.value.getObjectByName('grid-helper')
    if (gridHelper) {
      gridHelper.position.x = centerX
      gridHelper.position.z = centerZ
    }
    
    const groundFloor = scene.value.getObjectByName('ground-floor')
    if (groundFloor) {
      groundFloor.position.x = centerX
      groundFloor.position.z = centerZ
    }

    if (controls.value) {
      controls.value.target.set(centerX, 6, centerZ)
      controls.value.update()
    }
  }

  /**
   * 清理资源
   */
  function dispose() {
    if (renderer.value && containerRef.value) {
      containerRef.value.removeChild(renderer.value.domElement)
      renderer.value.dispose()
    }
    if (controls.value) {
      controls.value.dispose()
    }
  }

  // 监听窗口大小变化
  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    dispose()
  })

  return {
    // 状态
    scene,
    camera,
    renderer,
    controls,
    isLoading,
    loadProgress,
    
    // 方法
    initEngine,
    animate,
    handleResize,
    clearSceneObjects,
    resetCamera,
    updateSceneCenter,
    dispose,
  }
}
