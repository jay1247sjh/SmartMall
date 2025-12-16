# 已知问题（KNOWN_ISSUES.md）

> 项目：智能商城导购系统（Smart Mall Guide System）  
> 范围：前端已知问题
> 
> 本文档为 **已知问题清单（Known Issues）**，用于记录当前存在的问题、限制及临时解决方案。
> 
> 最后更新：2024-12-14

---

## 问题状态说明

- 🔴 **Critical** - 严重问题，阻塞开发或影响核心功能
- 🟠 **Major** - 重要问题，需要尽快解决
- 🟡 **Minor** - 次要问题，可以延后处理
- 🟢 **Resolved** - 已解决

---

## 当前问题列表

### P2. 渲染引擎层

#### 🟡 ISSUE-001: 相机动画缺少 TWEEN 库支持

**描述：** OrbitController 的 `animateTo` 方法目前未实现，需要引入 TWEEN.js 或自定义插值逻辑。

**影响范围：** 相机平滑过渡动画

**临时方案：** 暂时使用直接设置相机位置的方式

**计划解决：** P3 领域场景层实现时一并处理

---

#### 🟡 ISSUE-002: 高亮效果仅支持 MeshStandardMaterial

**描述：** `HighlightEffect` 类使用 `emissive` 属性实现高亮，该属性仅在 `MeshStandardMaterial` 和 `MeshPhysicalMaterial` 上有效。

**影响范围：** 使用 `MeshBasicMaterial` 或其他材质的对象无法高亮

**临时方案：** 确保所有需要高亮的对象使用 `MeshStandardMaterial`

**计划解决：** 可考虑使用 OutlinePass 或其他后处理效果作为备选方案

---

#### 🟡 ISSUE-003: SceneEventEmitter 未实现 enter/leave 事件

**描述：** 当前 `SceneEventEmitter` 仅实现了 `click` 和 `hover` 事件，尚未实现区域进入/离开事件。

**影响范围：** 需求 11.3、11.4 的区域检测功能

**临时方案：** 暂无

**计划解决：** P3 领域场景层实现时添加区域检测逻辑

---

### P0. 项目基础设施

#### 🟡 ISSUE-004: 测试环境未配置

**描述：** Vitest 和 fast-check 属性测试框架尚未配置完成。

**影响范围：** 无法运行单元测试和属性测试

**临时方案：** 手动测试功能

**计划解决：** 在开始 P3 之前完成测试环境配置

---

## 已解决问题

暂无

---

## 技术债务

### TD-001: ThreeEngine 类职责过重

**描述：** 当前 `ThreeEngine` 类包含了场景管理、渲染循环、对象添加等多个职责，随着功能增加可能变得难以维护。

**建议：** 考虑将对象管理功能拆分到独立的 `ObjectManager` 类中。

**优先级：** 低

---

### TD-002: 缺少类型守卫函数

**描述：** `src/utils/guards.ts` 中的类型守卫函数尚未实现。

**影响：** 运行时类型检查不完善

**优先级：** 中

---