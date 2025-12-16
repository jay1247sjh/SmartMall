/**
 * 渲染引擎层 - 统一导出
 *
 * 职责：
 * - 封装 Three.js 核心功能
 * - 提供纯渲染能力，不包含业务逻辑
 * - 可被替换为其他渲染引擎
 *
 * 包含模块：
 * - ThreeEngine: 核心渲染引擎
 * - camera: 相机控制（OrbitController、CameraController）
 * - interaction: 交互检测（RaycasterManager、SceneEventEmitter）
 * - effects: 视觉效果（HighlightEffect）
 * - materials: 材质管理（MaterialManager）
 * - objects: 对象管理（GeometryFactory、ObjectPool）
 */

// 核心引擎
export * from './ThreeEngine'

// 相机控制
export * from './camera'

// 交互检测
export * from './interaction'

// 视觉效果
export * from './effects'

// 材质管理
export * from './materials'

// 对象管理
export * from './objects'
