/**
 * 相机控制模块
 *
 * 这个模块提供 3D 场景中的相机控制能力，包含两种控制器：
 *
 * 1. OrbitController（轨道控制器）
 *    - 用途：编辑模式、预览模式
 *    - 交互：鼠标拖拽旋转、滚轮缩放、右键平移
 *    - 场景：商城建模器、自由浏览
 *
 * 2. CameraController（相机控制器）
 *    - 用途：漫游模式、第三人称跟随
 *    - 交互：键盘移动、鼠标视角、相机动画
 *    - 场景：用户在商城中漫游、导航动画
 *
 * 业务场景对应：
 * - BuilderView（建模器）→ OrbitController
 * - Mall3DView（3D浏览）→ OrbitController
 * - RoamingMode（漫游模式）→ CameraController
 *
 * 使用示例：
 * ```typescript
 * import { OrbitController, CameraController } from '@/engine/camera'
 *
 * // 编辑模式：使用轨道控制器
 * const orbitController = new OrbitController(camera, container)
 *
 * // 漫游模式：使用相机控制器
 * const cameraController = new CameraController(container)
 * cameraController.setFollowTarget(playerCharacter)
 * ```
 */

export * from './CameraController'
export * from './OrbitController'
