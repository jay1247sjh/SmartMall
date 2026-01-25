/**
 * 漫游模式 Composable
 * 管理第三人称漫游控制
 */
import { ref } from 'vue'
import * as THREE from 'three'
import type { CharacterController } from '@/builder'
import type { ViewMode, SavedCameraState } from './useMallBuilderState'

export interface RoamingConfig {
  mouseSensitivity: number
  cameraDistance: number
  cameraHeight: number
}

export function useRoamingMode(config: RoamingConfig = {
  mouseSensitivity: 0.003,
  cameraDistance: 10,
  cameraHeight: 4,
}) {
  // 漫游控制器
  let characterController: CharacterController | null = null
  let roamAnimationId: number | null = null
  let prevTime = performance.now()

  // 相机角度
  const cameraPitch = ref(0.3)
  const cameraYaw = ref(0)

  // 指针锁定状态
  const isPointerLocked = ref(false)

  // 移动速度预设
  const walkSpeedPreset = ref<'slow' | 'normal' | 'fast'>('normal')
  const speedPresets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
  const speedPresetLabels: Record<'slow' | 'normal' | 'fast', string> = {
    slow: '慢速',
    normal: '正常',
    fast: '快速',
  }

  /**
   * 处理指针锁定状态变化
   */
  function handlePointerLockChange() {
    isPointerLocked.value = !!document.pointerLockElement
    if (document.pointerLockElement) {
      console.log('鼠标已锁定')
    } else {
      console.log('鼠标已解锁，点击画布可重新锁定')
    }
  }

  /**
   * 处理漫游模式的鼠标移动
   */
  function handleRoamMouseMove(e: MouseEvent) {
    if (!document.pointerLockElement) return

    const movementX = e.movementX || 0
    const movementY = e.movementY || 0

    if (movementX === 0 && movementY === 0) return

    // 更新相机偏航角（左右看）
    cameraYaw.value -= movementX * config.mouseSensitivity

    // 更新相机俯仰角（上下看）
    cameraPitch.value += movementY * config.mouseSensitivity
    cameraPitch.value = Math.max(-0.3, Math.min(1.0, cameraPitch.value))
  }

  /**
   * 处理画布点击以锁定鼠标
   */
  function handleCanvasClickForPointerLock(e: MouseEvent, canvas: HTMLCanvasElement) {
    if (document.pointerLockElement) return

    e.stopPropagation()
    e.preventDefault()

    canvas.requestPointerLock()
  }

  /**
   * 处理漫游模式的键盘按下
   */
  function handleRoamKeyDown(e: KeyboardEvent) {
    if (!characterController) return

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        characterController.moveForward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        characterController.moveBackward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        characterController.moveLeft = true
        break
      case 'KeyD':
      case 'ArrowRight':
        characterController.moveRight = true
        break
    }
  }

  /**
   * 处理漫游模式的键盘松开
   */
  function handleRoamKeyUp(e: KeyboardEvent) {
    if (!characterController) return

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        characterController.moveForward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        characterController.moveBackward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        characterController.moveLeft = false
        break
      case 'KeyD':
      case 'ArrowRight':
        characterController.moveRight = false
        break
    }
  }

  /**
   * 开始漫游动画循环
   */
  function startRoamLoop(camera: THREE.PerspectiveCamera) {
    prevTime = performance.now()

    function animateRoam() {
      roamAnimationId = requestAnimationFrame(animateRoam)

      if (!characterController) return

      const time = performance.now()
      const delta = (time - prevTime) / 1000
      prevTime = time

      // 更新角色
      characterController.update(delta, cameraYaw.value)

      // 计算相机位置（第三人称跟随）
      const charPos = characterController.getPosition()
      const yaw = cameraYaw.value
      const pitch = cameraPitch.value

      // 球面坐标计算相机位置
      const horizontalDist = config.cameraDistance * Math.cos(pitch)
      const verticalOffset = config.cameraDistance * Math.sin(pitch) + config.cameraHeight

      const cameraX = charPos.x + Math.sin(yaw) * horizontalDist
      const cameraY = charPos.y + verticalOffset
      const cameraZ = charPos.z + Math.cos(yaw) * horizontalDist

      camera.position.set(cameraX, cameraY, cameraZ)

      // 相机看向角色头部位置
      const lookAtPos = charPos.clone()
      lookAtPos.y += 1.5
      camera.lookAt(lookAtPos)
    }

    animateRoam()
  }

  /**
   * 停止漫游动画循环
   */
  function stopRoamLoop() {
    if (roamAnimationId !== null) {
      cancelAnimationFrame(roamAnimationId)
      roamAnimationId = null
    }
  }

  /**
   * 切换移动速度预设
   */
  function cycleWalkSpeed() {
    const presets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
    const currentIndex = presets.indexOf(walkSpeedPreset.value)
    const nextIndex = (currentIndex + 1) % presets.length
    walkSpeedPreset.value = presets[nextIndex]!

    if (characterController) {
      characterController.setMoveSpeed(walkSpeedPreset.value)
    }
  }

  /**
   * 设置移动速度预设
   */
  function setWalkSpeed(preset: 'slow' | 'normal' | 'fast') {
    walkSpeedPreset.value = preset
    if (characterController) {
      characterController.setMoveSpeed(preset)
    }
  }

  /**
   * 设置角色控制器
   */
  function setCharacterController(controller: CharacterController | null) {
    characterController = controller
  }

  /**
   * 获取角色控制器
   */
  function getCharacterController() {
    return characterController
  }

  /**
   * 清理资源
   */
  function dispose() {
    stopRoamLoop()
    if (characterController) {
      characterController.dispose()
      characterController = null
    }
  }

  return {
    // 状态
    cameraPitch,
    cameraYaw,
    isPointerLocked,
    walkSpeedPreset,
    speedPresets,
    speedPresetLabels,

    // 事件处理
    handlePointerLockChange,
    handleRoamMouseMove,
    handleCanvasClickForPointerLock,
    handleRoamKeyDown,
    handleRoamKeyUp,

    // 动画控制
    startRoamLoop,
    stopRoamLoop,

    // 速度控制
    cycleWalkSpeed,
    setWalkSpeed,

    // 角色控制器
    setCharacterController,
    getCharacterController,

    // 清理
    dispose,
  }
}
