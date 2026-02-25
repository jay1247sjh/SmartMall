/**
 * 漫游模式 Composable
 * 管理第三人称漫游控制
 *
 * 重构后职责：业务协调（WASD 键盘输入、速度控制、角色控制器生命周期）
 * 相机控制已统一到引擎层 CameraController
 */
import { ref } from 'vue'
import * as THREE from 'three'
import type { CharacterController } from '@/builder'
import type { ThreeEngine } from '@/engine/ThreeEngine'
import type { ThirdPersonCameraConfig } from '@/engine/camera'

export interface RoamingConfig {
  mouseSensitivity: number
  cameraDistance: number
  cameraHeight: number
  smoothness: number
  /**
   * 未锁定且角色静止时，是否自动将镜头缓慢对齐到角色背后
   * 在建模器漫游中容易造成“视角被拉回”的体感，建议按需关闭
   */
  autoAlignWhenUnlocked?: boolean
  /**
   * 自动回背延迟（毫秒）
   * 防止 pointer lock 短暂抖动时立即触发回背
   */
  autoAlignDelayMs?: number
  /**
   * 是否启用 yaw 扇形限制
   */
  yawConstraintEnabled?: boolean
  /**
   * yaw 扇形半角（度）
   */
  yawConstraintHalfAngleDeg?: number
  /**
   * yaw 扇形中心偏移（度，相对角色朝向）
   */
  yawConstraintCenterOffsetDeg?: number
}

export function useRoamingMode(config: RoamingConfig = {
  mouseSensitivity: 0.003,
  cameraDistance: 10,
  cameraHeight: 4,
  smoothness: 1,
  autoAlignWhenUnlocked: true,
  autoAlignDelayMs: 200,
  yawConstraintEnabled: false,
  yawConstraintHalfAngleDeg: 45,
  yawConstraintCenterOffsetDeg: 180,
}) {
  // 漫游控制器
  let characterController: CharacterController | null = null

  // 引擎引用
  let engine: ThreeEngine | null = null
  let unregisterRenderCallback: (() => void) | null = null
  let idleUnlockedSince: number | null = null
  const shouldAutoAlignWhenUnlocked = config.autoAlignWhenUnlocked ?? true
  const autoAlignDelayMs = config.autoAlignDelayMs ?? 200

  // 移动速度预设
  const walkSpeedPreset = ref<'slow' | 'normal' | 'fast'>('normal')
  const speedPresets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
  const speedPresetLabels: Record<'slow' | 'normal' | 'fast', string> = {
    slow: '慢速',
    normal: '正常',
    fast: '快速',
  }

  /**
   * 统一构建 follow 相机配置，避免多处散落配置造成行为分叉。
   */
  function buildFollowCameraConfig(): Partial<ThirdPersonCameraConfig> {
    return {
      distance: config.cameraDistance,
      lookAtHeightOffset: config.cameraHeight,
      smoothness: config.smoothness,
      mouseSensitivity: config.mouseSensitivity,
      pitchLimit: { min: -0.3, max: 1.0 },
      yawConstraint: {
        enabled: config.yawConstraintEnabled ?? false,
        halfAngle: THREE.MathUtils.degToRad(config.yawConstraintHalfAngleDeg ?? 45),
        centerOffset: THREE.MathUtils.degToRad(config.yawConstraintCenterOffsetDeg ?? 180),
      },
    }
  }

  /**
   * 启动漫游模式
   * 1. 切换相机模式到 follow
   * 2. 设置跟随目标，映射 RoamingConfig → ThirdPersonCameraConfig
   * 3. 注册角色更新回调（通过 onRender）
   *
   * 注意：Pointer lock 不在此处请求，由调用方在 canvas click handler 中触发，
   * 以满足浏览器要求的"用户手势触发"约束。
   */
  function startRoaming(eng: ThreeEngine, target: THREE.Object3D): void {
    if (!eng) {
      console.warn('[useRoamingMode] startRoaming: engine is null')
      return
    }
    engine = eng
    idleUnlockedSince = null

    // 1. 切换相机模式到 follow
    engine.setCameraMode('follow')

    // 2. 设置跟随目标
    engine.setFollowTarget(target, buildFollowCameraConfig())

    // 3. 注册角色更新回调
    unregisterRenderCallback = engine.onRender((delta: number) => {
      if (!characterController) return
      // 从引擎获取当前 yaw 角度，传给角色控制器
      const yaw = engine!.getCameraYaw()
      characterController.update(delta, yaw)

      // 当指针未锁定且角色静止时，相机自动校正到角色背后
      // 仅在角色不移动时校正，避免移动中的反馈环路：
      // camera yaw → 移动方向 → 角色旋转 → 校正 camera yaw → 循环
      const isCharacterMoving = characterController.moveForward
        || characterController.moveBackward
        || characterController.moveLeft
        || characterController.moveRight
      const pointerLocked = engine!.isPointerLocked()
      if (shouldAutoAlignWhenUnlocked && !pointerLocked && !isCharacterMoving) {
        const now = performance.now()
        if (idleUnlockedSince === null) {
          idleUnlockedSince = now
        }
        if (now - idleUnlockedSince < autoAlignDelayMs) {
          engine!.requestRender()
          return
        }

        const characterYaw = characterController.getRotationY()
        // 相机需要在角色背后：目标 yaw = characterYaw + π
        const targetYaw = characterYaw + Math.PI
        const currentYaw = engine!.getCameraYaw()
        // 计算角度差并规范化到 [-π, π]
        const diff = Math.atan2(
          Math.sin(targetYaw - currentYaw),
          Math.cos(targetYaw - currentYaw)
        )
        // 平滑插值跟随（每帧 1.5% 靠近目标角度，柔和校正）
        // 直接在当前 yaw 上加 diff，保持同一"圈数"，避免跨圈跳变
        if (Math.abs(diff) > 0.01) {
          const currentPitch = engine!.getCameraPitch()
          engine!.setCameraAngles(currentYaw + diff * 0.015, currentPitch)
        }
      } else {
        idleUnlockedSince = null
      }

      // 确保持续渲染
      engine!.requestRender()
    })
  }

  /**
   * 停止漫游模式
   * 1. 注销角色更新回调
   * 2. 清除跟随目标
   * 3. 退出指针锁定
   * 4. 切换相机模式回 orbit
   */
  function stopRoaming(): void {
    // 1. 注销角色更新回调
    if (unregisterRenderCallback) {
      unregisterRenderCallback()
      unregisterRenderCallback = null
    }

    if (!engine) {
      idleUnlockedSince = null
      return
    }

    // 2. 清除跟随目标
    engine.clearFollowTarget()

    // 3. 退出指针锁定
    engine.exitPointerLock()

    // 4. 切换相机模式回 orbit
    engine.setCameraMode('orbit')
    idleUnlockedSince = null

    engine = null
  }

  /**
   * 重绑跟随目标（例如漫游中切楼层后替换角色实例）
   */
  function rebindFollowTarget(target: THREE.Object3D): void {
    if (!engine) {
      console.warn('[useRoamingMode] rebindFollowTarget: engine is null')
      return
    }
    engine.setFollowTarget(target, buildFollowCameraConfig())
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
    stopRoaming()
    if (characterController) {
      characterController.dispose()
      characterController = null
    }
  }

  return {
    // 状态
    walkSpeedPreset,
    speedPresets,
    speedPresetLabels,

    // 漫游控制
    startRoaming,
    stopRoaming,
    rebindFollowTarget,

    // 键盘事件
    handleRoamKeyDown,
    handleRoamKeyUp,

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
