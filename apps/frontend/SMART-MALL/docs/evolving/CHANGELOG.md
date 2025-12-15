# 变更日志（CHANGELOG.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端变更日志
> 
> 本文档为 **变更日志（Changelog）**，用于记录版本变更历史，遵循 Keep a Changelog 格式规范。

---

## [Unreleased] - 2024-12-14

### Added - 新增功能

#### P2. 渲染引擎层 (Three Core)

**2.1 核心引擎类**
- ✅ 实现 `ThreeEngine` 核心类 (`src/engine/ThreeEngine.ts`)
  - Scene、Camera、Renderer 完整初始化
  - 渲染循环控制（start/stop）
  - 按需渲染策略（needsRender 标志位 + requestRender 方法）
  - 窗口 resize 自适应处理
  - 完整的资源释放机制（dispose 方法）
  - 支持双相机模式切换（orbit/follow）
  - 每帧回调注册机制（onRender）

**2.2 相机控制**
- ✅ 实现 `OrbitController` 轨道控制器 (`src/engine/camera/OrbitController.ts`)
  - 相机初始化（PerspectiveCamera）
  - 轨道视角控制（鼠标拖拽旋转、滚轮缩放）
  - 相机动画（animateTo 方法，平滑过渡）
  - 相机约束（边界限制、缩放范围限制）
  - 阻尼惯性效果

**2.3 对象管理**
- ✅ 实现基础对象管理功能（ThreeEngine 中）
  - addBox 方法：添加方块到场景
  - addGridHelper 方法：添加地板网格辅助线
  - 对象阴影支持（castShadow/receiveShadow）

**2.5 交互检测**
- ✅ 实现 `RaycasterManager` 射线检测管理器 (`src/engine/interaction/RaycasterManager.ts`)
  - 射线检测核心功能
  - 鼠标点击检测
  - 鼠标悬停检测

- ✅ 实现 `SceneEventEmitter` 事件抽象层 (`src/engine/interaction/SceneEventEmitter.ts`)
  - 发布-订阅模式（on/off 方法）
  - 点击事件处理（handleClick）
  - 悬停事件处理（handleMouseMove）
  - 悬停状态变化检测（hover/hoverEnd）
  - 事件触发机制（emit）
  - 资源清理（dispose）
  - 将 Three.js 底层事件转换为语义化场景事件

**2.4 材质与效果**
- ✅ 实现 `MaterialManager` 材质管理器 (`src/engine/materials/MaterialManager.ts`)
  - 标准材质创建（MeshStandardMaterial）
  - 基础材质创建（MeshBasicMaterial）
  - 材质缓存机制（相同配置复用实例）
  - 缓存键生成（配置对象转字符串）
  - 资源清理（dispose 释放 GPU 资源）
  - 缓存统计（getCacheSize）

- ✅ 实现 `HighlightEffect` 高亮效果管理器 (`src/engine/effects/HighlightEffect.ts`)
  - 悬停高亮（setHover/clearHover）- 灰色发光效果
  - 选中高亮（setSelected/clearSelected）- 橙黄色发光效果
  - 原始材质状态保存与恢复（saveOriginalState/restoreOriginalState）
  - 使用 emissive 自发光属性实现高亮
  - 支持 MeshStandardMaterial 材质
  - 完整的资源清理（dispose）
  - 可配置的高亮颜色和强度

### Technical Details - 技术细节

**架构设计**
- 采用分层架构，渲染引擎层不包含业务逻辑
- 支持相机模式动态切换（orbit 建模模式 / follow 运行时模式）
- 实现按需渲染优化，静止时暂停渲染节省性能
- 完整的资源生命周期管理，防止内存泄漏

**性能优化**
- 按需渲染策略：只在需要时渲染帧
- 像素比率限制：最大 2x，平衡清晰度和性能
- 阴影优化：使用 PCFSoftShadowMap 柔和阴影
- 事件监听器正确注销

**代码质量**
- 完整的 TypeScript 类型定义
- 详细的代码注释和文档
- 清晰的职责分离

### Progress - 进度统计

**P2 渲染引擎层完成度**: 13/16 任务 (81.25%)
- ✅ 2.1.1 ThreeEngine 核心类
- ✅ 2.1.2 按需渲染策略
- ✅ 2.1.3 资源释放机制
- ✅ 2.2.1 OrbitController 相机控制器
- ✅ 2.2.2 相机动画
- ✅ 2.2.3 相机约束
- ✅ 2.3.1 基础对象管理
- ✅ 2.3.2 ObjectPool 对象池
- ✅ 2.3.3 GeometryFactory 几何体工厂
- ✅ 2.4.1 MaterialManager 材质管理器
- ✅ 2.4.2 HighlightEffect 高亮效果管理器
- ✅ 2.5.1 RaycasterManager 射线检测
- ✅ 2.5.2 SceneEventEmitter 事件抽象层

**待完成任务**:
- ⏳ 2.6.0 渲染引擎层检查点

---
