/**
 * 背景图片组合式函数
 * 
 * 管理背景图片的导入、变换和显示
 */

import { ref, computed, readonly } from 'vue'
import type { Transform2D } from '../geometry/types'
import type { BackgroundImage } from '../types/mall-project'

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 图片变换操作
 */
export interface ImageTransformOps {
  /** 平移 */
  translate: (dx: number, dy: number) => void
  /** 缩放 */
  scale: (factor: number, centerX?: number, centerY?: number) => void
  /** 旋转 */
  rotate: (angle: number, centerX?: number, centerY?: number) => void
  /** 重置变换 */
  reset: () => void
  /** 设置透明度 */
  setOpacity: (opacity: number) => void
}

/**
 * 支持的图片格式
 */
export const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

/**
 * 最大图片大小（字节）
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

// ============================================================================
// 组合式函数
// ============================================================================

/**
 * 背景图片组合式函数
 */
export function useBackgroundImage() {
  // 状态
  const image = ref<BackgroundImage | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // 计算属性
  const hasImage = computed(() => image.value !== null)
  const opacity = computed(() => image.value?.opacity ?? 1)
  const isLocked = computed(() => image.value?.locked ?? false)
  
  // 创建默认变换矩阵
  function createDefaultTransform(): Transform2D {
    return {
      a: 1,  // scale x
      b: 0,  // skew y
      c: 0,  // skew x
      d: 1,  // scale y
      tx: 0, // translate x
      ty: 0, // translate y
    }
  }
  
  // 导入图片
  async function importImage(file: File): Promise<boolean> {
    error.value = null
    
    // 验证文件类型
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
      error.value = `不支持的图片格式: ${file.type}。支持的格式: PNG, JPG, SVG, WebP`
      return false
    }
    
    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      error.value = `图片文件过大。最大支持 ${MAX_IMAGE_SIZE / 1024 / 1024}MB`
      return false
    }
    
    isLoading.value = true
    
    try {
      const dataUrl = await readFileAsDataUrl(file)
      
      image.value = {
        src: dataUrl,
        transform: createDefaultTransform(),
        opacity: 0.5,
        locked: false,
      }
      
      return true
    } catch (e) {
      error.value = `图片加载失败: ${e instanceof Error ? e.message : '未知错误'}`
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 从 URL 导入图片
  async function importImageFromUrl(url: string): Promise<boolean> {
    error.value = null
    isLoading.value = true
    
    try {
      // 验证 URL 是否可访问
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      
      if (!SUPPORTED_IMAGE_FORMATS.includes(blob.type)) {
        error.value = `不支持的图片格式: ${blob.type}`
        return false
      }
      
      const dataUrl = await readBlobAsDataUrl(blob)
      
      image.value = {
        src: dataUrl,
        transform: createDefaultTransform(),
        opacity: 0.5,
        locked: false,
      }
      
      return true
    } catch (e) {
      error.value = `图片加载失败: ${e instanceof Error ? e.message : '未知错误'}`
      return false
    } finally {
      isLoading.value = false
    }
  }
  
  // 移除图片
  function removeImage() {
    image.value = null
    error.value = null
  }
  
  // 变换操作
  const transform: ImageTransformOps = {
    translate(dx: number, dy: number) {
      if (!image.value || image.value.locked) return
      
      image.value.transform.tx += dx
      image.value.transform.ty += dy
    },
    
    scale(factor: number, centerX = 0, centerY = 0) {
      if (!image.value || image.value.locked) return
      
      const t = image.value.transform
      
      // 缩放变换
      t.a *= factor
      t.d *= factor
      
      // 调整平移以保持中心点
      t.tx = centerX + (t.tx - centerX) * factor
      t.ty = centerY + (t.ty - centerY) * factor
    },
    
    rotate(angle: number, centerX = 0, centerY = 0) {
      if (!image.value || image.value.locked) return
      
      const t = image.value.transform
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      
      // 旋转变换矩阵
      const newA = t.a * cos - t.b * sin
      const newB = t.a * sin + t.b * cos
      const newC = t.c * cos - t.d * sin
      const newD = t.c * sin + t.d * cos
      
      // 调整平移以保持中心点
      const dx = t.tx - centerX
      const dy = t.ty - centerY
      const newTx = centerX + dx * cos - dy * sin
      const newTy = centerY + dx * sin + dy * cos
      
      t.a = newA
      t.b = newB
      t.c = newC
      t.d = newD
      t.tx = newTx
      t.ty = newTy
    },
    
    reset() {
      if (!image.value || image.value.locked) return
      image.value.transform = createDefaultTransform()
    },
    
    setOpacity(newOpacity: number) {
      if (!image.value) return
      image.value.opacity = Math.max(0, Math.min(1, newOpacity))
    },
  }
  
  // 锁定/解锁
  function toggleLock() {
    if (!image.value) return
    image.value.locked = !image.value.locked
  }
  
  function setLocked(locked: boolean) {
    if (!image.value) return
    image.value.locked = locked
  }
  
  // 获取 CSS 变换字符串
  function getCssTransform(): string {
    if (!image.value) return ''
    
    const t = image.value.transform
    return `matrix(${t.a}, ${t.b}, ${t.c}, ${t.d}, ${t.tx}, ${t.ty})`
  }
  
  // 设置图片数据（用于加载保存的项目）
  function setImage(img: BackgroundImage | null) {
    image.value = img
  }
  
  return {
    // 状态（只读）
    image: readonly(image),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // 计算属性
    hasImage,
    opacity,
    isLocked,
    
    // 方法
    importImage,
    importImageFromUrl,
    removeImage,
    transform,
    toggleLock,
    setLocked,
    getCssTransform,
    setImage,
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 读取文件为 Data URL
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 读取 Blob 为 Data URL
 */
function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('数据读取失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 验证图片文件
 */
export function isValidImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(file.type) && file.size <= MAX_IMAGE_SIZE
}

/**
 * 获取图片文件扩展名
 */
export function getImageExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  }
  return extensions[mimeType] ?? 'unknown'
}
