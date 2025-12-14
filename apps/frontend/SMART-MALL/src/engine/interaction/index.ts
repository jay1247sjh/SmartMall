/**
 * 交互检测模块
 *
 * 提供 3D 场景中的交互检测能力：
 * - 射线检测（点击、悬停）
 * - 地面交点计算
 * - 场景事件抽象层（将 Three.js 事件转换为语义事件）
 */

export * from './RaycasterManager'
export * from './SceneEventEmitter'
