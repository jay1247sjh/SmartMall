/**
 * 角色模型缩略图生成 composable
 *
 * 利用 Three.js 在运行时渲染 GLB 模型为缩略图 dataURL，
 * 结果缓存到内存 + localStorage，无需预生成图片文件。
 */
import { ref, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { CharacterModelName } from '@/types/settings'

const THUMB_SIZE = 128
const CACHE_KEY = 'smart-mall-character-thumbs'
const GLB_BASE = '/models/kenney_mini-characters/Models/GLB format/'

// 模块级缓存（跨组件共享，页面生命周期内有效）
const memoryCache = new Map<string, string>()

// 尝试从 localStorage 恢复
function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>
      for (const [k, v] of Object.entries(parsed)) {
        memoryCache.set(k, v)
      }
    }
  } catch { /* ignore */ }
}

function saveToStorage(): void {
  try {
    const obj: Record<string, string> = {}
    memoryCache.forEach((v, k) => { obj[k] = v })
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
  } catch { /* quota exceeded — ignore */ }
}

// 初始化时加载
loadFromStorage()

// 单例渲染器（懒创建，所有实例共享）
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let loader: GLTFLoader | null = null
let refCount = 0

function ensureRenderer() {
  if (renderer) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setSize(THUMB_SIZE, THUMB_SIZE)
  renderer.setPixelRatio(1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // 不挂载到 DOM — 纯离屏渲染

  scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const dir = new THREE.DirectionalLight(0xffffff, 1.2)
  dir.position.set(2, 3, 2)
  scene.add(dir)
  const fill = new THREE.DirectionalLight(0xffffff, 0.4)
  fill.position.set(-2, 1, -1)
  scene.add(fill)

  camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  loader = new GLTFLoader()
}

function disposeRenderer() {
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  loader = null
}

// 渲染队列（串行，避免 WebGL 冲突）
let queue: Promise<void> = Promise.resolve()

function renderModel(model: CharacterModelName): Promise<string> {
  return new Promise((resolve, reject) => {
    queue = queue.then(() => new Promise<void>((done) => {
      ensureRenderer()
      loader!.load(
        GLB_BASE + model + '.glb',
        (gltf) => {
          const obj = gltf.scene
          const box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // 聚焦上半身
          const headY = center.y + size.y * 0.15
          camera!.position.set(center.x + 0.3, headY + 0.2, center.z + 1.2)
          camera!.lookAt(center.x, headY, center.z)

          // 清除旧模型（保留灯光）
          const toRemove: THREE.Object3D[] = []
          scene!.traverse((child) => {
            if (child.type !== 'AmbientLight' && child.type !== 'DirectionalLight' && child !== scene) {
              toRemove.push(child)
            }
          })
          toRemove.forEach(c => c.parent?.remove(c))

          scene!.add(obj)
          renderer!.render(scene!, camera!)
          const dataUrl = renderer!.domElement.toDataURL('image/png')
          scene!.remove(obj)

          // 释放 GLB 资源
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose()
            if ((child as THREE.Mesh).material) {
              const mat = (child as THREE.Mesh).material
              if (Array.isArray(mat)) mat.forEach(m => m.dispose())
              else mat.dispose()
            }
          })

          memoryCache.set(model, dataUrl)
          resolve(dataUrl)
          done()
        },
        undefined,
        (err) => { reject(err); done() },
      )
    }))
  })
}

/**
 * 获取角色缩略图 composable
 *
 * 返回一个响应式 Map<model, dataUrl>，
 * 调用 generate() 后异步渲染所有模型。
 */
export function useCharacterThumbnails() {
  const thumbnails = ref(new Map<string, string>(memoryCache))
  let disposed = false

  refCount++

  async function generate(models: CharacterModelName[]) {
    for (const model of models) {
      if (disposed) break
      if (memoryCache.has(model)) {
        thumbnails.value.set(model, memoryCache.get(model)!)
        continue
      }
      try {
        const url = await renderModel(model)
        if (!disposed) {
          thumbnails.value = new Map(thumbnails.value.set(model, url))
        }
      } catch (e) {
        console.warn(`[CharacterThumbnail] Failed to render ${model}:`, e)
      }
    }
    saveToStorage()
  }

  function getThumbnail(model: CharacterModelName): string | undefined {
    return thumbnails.value.get(model)
  }

  onBeforeUnmount(() => {
    disposed = true
    refCount--
    if (refCount <= 0) {
      disposeRenderer()
      refCount = 0
    }
  })

  return { thumbnails, generate, getThumbnail }
}
