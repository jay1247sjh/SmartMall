/**
 * 交互检测模块
 *
 * 这个模块提供 3D 场景中的交互检测能力，将底层的 Three.js 事件
 * 转换为语义化的场景事件，让上层代码更容易处理用户交互。
 *
 * 设计原则：
 * - 抽象层：隐藏 Three.js 射线检测的复杂性
 * - 语义化：将"鼠标点击"转换为"点击了哪个店铺"
 * - 发布-订阅：解耦事件产生和事件处理
 *
 * 包含的组件：
 *
 * 1. RaycasterManager（射线检测管理器）
 *    - 职责：将鼠标坐标转换为 3D 射线，检测与物体的交点
 *    - 功能：点击检测、悬停检测、地面交点计算
 *    - 原理：从相机发出射线，穿过鼠标位置，检测与场景物体的交点
 *
 * 2. SceneEventEmitter（场景事件发射器）
 *    - 职责：监听 DOM 事件，发出语义化的场景事件
 *    - 事件：click（点击）、hover（悬停）、hoverEnd（离开）
 *    - 模式：发布-订阅模式，支持多个订阅者
 *
 * 数据流示意：
 * ```
 * 鼠标点击 → DOM 事件 → SceneEventEmitter → RaycasterManager
 *                              ↓                    ↓
 *                        射线检测结果 ← ← ← ← ← 射线与物体交点
 *                              ↓
 *                        emit('click', { object, point })
 *                              ↓
 *                        订阅者收到事件
 * ```
 *
 * 使用示例：
 * ```typescript
 * import { RaycasterManager, SceneEventEmitter } from '@/engine/interaction'
 *
 * const raycaster = new RaycasterManager(camera, scene)
 * const emitter = new SceneEventEmitter(raycaster, container)
 *
 * // 订阅点击事件
 * emitter.on('click', (data) => {
 *   if (data.object) {
 *     console.log('点击了对象:', data.object.name)
 *   }
 * })
 * ```
 */

export * from './RaycasterManager'
export * from './SceneEventEmitter'
