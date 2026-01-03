# Implementation Plan: Mall Builder Materials System

## Overview

实现商城建模器材质系统增强功能，包括预设材质、放置规则、垂直连接和 Orbit 观察模式。

## Tasks

- [x] 1. 创建材质预设系统
  - [x] 1.1 创建材质类型定义文件 `src/builder/materials/types.ts`
    - 定义 MaterialPreset, MaterialCategory, PlacementRule 接口
    - _Requirements: 1.1, 2.1, 2.2, 2.3_
  - [x] 1.2 创建材质预设数据文件 `src/builder/materials/presets.ts`
    - 定义走廊、扶梯、电梯、楼梯、洗手间、公共区域等预设
    - _Requirements: 1.1_
  - [x] 1.3 创建材质模块导出 `src/builder/materials/index.ts`
    - _Requirements: 1.1_

- [x] 2. 实现放置规则验证
  - [x] 2.1 创建放置规则验证文件 `src/builder/rules/placement.ts`
    - 实现 validatePlacement 函数
    - 实现 getPlacementRules 函数
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 编写放置规则属性测试
    - **Property 1: Placement Rule Validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  - [x] 2.3 创建规则模块导出 `src/builder/rules/index.ts`
    - _Requirements: 2.1_

- [x] 3. 实现 Orbit 观察模式
  - [x] 3.1 在 MallBuilderView.vue 中添加视图模式状态
    - 添加 viewMode ref 和 savedCameraState
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [x] 3.2 实现 toggleOrbitMode 函数
    - 保存/恢复相机位置
    - 切换 OrbitControls 启用状态
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 3.3 在工具栏添加 Orbit 模式切换按钮
    - 添加视觉指示器显示当前模式
    - _Requirements: 4.1, 4.5_
  - [ ] 3.4 编写 Orbit 模式属性测试
    - **Property 3: Orbit Mode State Isolation**
    - **Property 4: Orbit Mode Control State**
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 4. 实现材质面板 UI
  - [x] 4.1 在 MallBuilderView.vue 中添加材质面板组件
    - 左侧显示分类的预设材质
    - 支持选择和高亮
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 4.2 实现材质选择和放置逻辑
    - 选择材质后进入绘制模式
    - 放置时自动设置区域类型和颜色
    - _Requirements: 1.2, 1.3_
  - [ ] 4.3 编写材质预设一致性属性测试
    - **Property 2: Material Preset Consistency**
    - **Validates: Requirements 1.3**

- [x] 5. 实现垂直连接系统
  - [x] 5.1 创建垂直连接类型定义 `src/builder/connections/types.ts`
    - 定义 VerticalConnection, FloorConnection 接口
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 5.2 创建垂直连接管理 `src/builder/connections/vertical.ts`
    - 实现连接创建、验证、查询函数
    - _Requirements: 3.1, 3.4_
  - [x] 5.3 实现垂直连接渲染 `src/builder/connections/rendering.ts`
    - 渲染楼层间的连接指示线
    - _Requirements: 3.2, 3.3_
  - [x] 5.4 在 MallBuilderView.vue 中集成垂直连接
    - 创建扶梯/电梯时弹出楼层选择
    - 渲染连接指示
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 5.5 编写垂直连接属性测试
    - **Property 5: Vertical Connection Rendering**
    - **Property 6: Vertical Connection Validation**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 6. 更新 builder 模块导出
  - [x] 6.1 更新 `src/builder/index.ts` 导出新模块
    - 导出 materials, rules, connections 模块
    - _Requirements: 1.1, 2.1, 3.1_

- [x] 7. Checkpoint - 确保所有测试通过
  - 运行 `pnpm test` 确保所有测试通过 (104 tests passing)
  - 如有问题请询问用户

## Notes

- All tasks are required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
