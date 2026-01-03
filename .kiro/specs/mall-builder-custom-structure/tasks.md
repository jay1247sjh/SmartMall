# Implementation Plan: Mall Builder Custom Structure

## Overview

本实现计划将增强商城建模器，支持自定义商城结构。采用渐进式开发，先实现核心几何模块，再构建UI组件，最后集成3D预览。

## Tasks

- [x] 1. 创建几何计算核心模块
  - [x] 1.1 创建几何类型定义 (Point2D, Polygon, BoundingBox)
    - 创建 `src/builder/geometry/types.ts`
    - 定义所有几何相关的TypeScript接口
    - _Requirements: 1.2, 1.3, 3.1_

  - [x] 1.2 实现多边形基础操作
    - 创建 `src/builder/geometry/polygon.ts`
    - 实现 calculateArea (Shoelace公式)
    - 实现 calculatePerimeter
    - 实现 getBoundingBox
    - _Requirements: 1.3_

  - [x] 1.3 编写多边形面积计算属性测试
    - **Property 1: Polygon Area Calculation Correctness**
    - **Validates: Requirements 1.3**

  - [x] 1.4 实现点与多边形关系判断
    - 实现 isPointInside (射线法)
    - 实现 isContainedIn (多边形包含检测)
    - _Requirements: 1.4, 2.2_

  - [x] 1.5 编写包含关系验证属性测试
    - **Property 2: Containment Validation**
    - **Validates: Requirements 1.4, 2.2, 2.4**

  - [x] 1.6 实现多边形重叠检测
    - 实现 doPolygonsOverlap
    - 使用分离轴定理(SAT)或多边形裁剪算法
    - _Requirements: 3.3_

  - [x] 1.7 编写重叠检测属性测试
    - **Property 5: Overlap Detection**
    - **Validates: Requirements 3.3**

  - [x] 1.8 实现顶点操作
    - 实现 addVertex
    - 实现 removeVertex (保证最少3个顶点)
    - _Requirements: 3.2_

  - [x] 1.9 编写顶点操作属性测试
    - **Property 4: Polygon Vertex Operations**
    - **Validates: Requirements 3.2**

  - [x] 1.10 实现网格对齐
    - 实现 snapToGrid
    - _Requirements: 3.4_

  - [x] 1.11 编写网格对齐属性测试
    - **Property 6: Grid Snapping**
    - **Validates: Requirements 3.4**

- [x] 2. Checkpoint - 几何模块完成
  - 确保所有几何计算测试通过
  - 如有问题请询问用户

- [x] 3. 创建数据模型和模板系统
  - [x] 3.1 创建项目数据模型
    - 创建 `src/builder/types/mall-project.ts`
    - 定义 MallProject, FloorDefinition, AreaDefinition 接口
    - _Requirements: 1.1, 2.1_

  - [x] 3.2 创建模板系统
    - 创建 `src/builder/templates/mall-templates.ts`
    - 实现矩形、L形、U形、圆形模板
    - _Requirements: 4.1, 4.2_

  - [x] 3.3 编写模板生成有效性属性测试
    - **Property 7: Template Generation Validity**
    - **Validates: Requirements 4.2**

  - [x] 3.4 实现项目序列化/反序列化
    - 实现 exportProject / importProject
    - 支持JSON格式导出
    - _Requirements: 1.1_

- [x] 4. 创建绘制工具组合式函数
  - [x] 4.1 创建绘制状态管理
    - 创建 `src/builder/composables/useDrawingTool.ts`
    - 实现绘制状态机 (none → drawing → complete)
    - _Requirements: 1.2, 3.1_

  - [x] 4.2 实现矩形绘制模式
    - 两点确定矩形
    - 实时预览
    - _Requirements: 3.1_

  - [x] 4.3 实现多边形绘制模式
    - 点击添加顶点
    - 双击或回到起点完成
    - _Requirements: 1.2, 3.1_

  - [x] 4.4 实现边界验证集成
    - 绘制时实时检查是否超出边界
    - 超出时显示警告
    - _Requirements: 1.5, 3.5_

  - [x] 4.5 编写边界修改警告属性测试
    - **Property 3: Boundary Modification Warning**
    - **Validates: Requirements 1.5, 3.5**

- [x] 5. Checkpoint - 绘制工具完成
  - 确保绘制工具测试通过
  - 如有问题请询问用户

- [x] 6. 增强MallBuilderView UI
  - [x] 6.1 添加项目创建向导
    - 新建项目时显示模板选择
    - 支持选择预设或自定义
    - _Requirements: 1.1, 4.1_

  - [x] 6.2 添加商城轮廓绘制工具
    - 在工具栏添加"绘制轮廓"按钮
    - 集成多边形绘制功能
    - _Requirements: 1.2_

  - [x] 6.3 添加楼层形状编辑
    - 楼层面板添加"自定义形状"选项
    - 支持继承商城轮廓或自定义
    - _Requirements: 2.1, 2.2_

  - [x] 6.4 增强区域绘制工具
    - 支持矩形和多边形两种模式
    - 添加顶点编辑功能
    - _Requirements: 3.1, 3.2_

  - [x] 6.5 添加重叠检测UI反馈
    - 重叠区域高亮显示
    - 阻止保存并显示错误
    - _Requirements: 3.3_

- [x] 7. 实现背景图片功能
  - [x] 7.1 添加图片导入功能
    - 支持PNG、JPG、SVG格式
    - 文件选择器集成
    - _Requirements: 5.1, 5.3_

  - [x] 7.2 实现图片变换控制
    - 缩放、平移控制
    - 透明度调节滑块
    - _Requirements: 5.2, 5.4_

  - [x] 7.3 编写图片变换一致性属性测试
    - **Property 9: Image Transformation Consistency**
    - **Validates: Requirements 5.2, 5.4**

- [x] 8. 增强3D预览
  - [x] 8.1 实现多楼层3D渲染
    - 根据楼层高度计算Y位置
    - 不同楼层使用不同颜色
    - _Requirements: 6.1_

  - [x] 8.2 编写楼层高度定位属性测试
    - **Property 8: Floor Height Positioning**
    - **Validates: Requirements 6.1**

  - [x] 8.3 实现自定义形状3D渲染
    - 将多边形转换为Three.js Shape
    - 支持挤出生成3D几何体
    - _Requirements: 6.1_

  - [x] 8.4 添加区域悬停高亮
    - 鼠标悬停时高亮区域
    - 显示区域信息提示
    - _Requirements: 6.4_

- [x] 9. Checkpoint - 功能集成完成
  - 确保所有功能正常工作
  - 运行完整测试套件
  - 如有问题请询问用户

- [x] 10. 最终优化和文档
  - [x] 10.1 性能优化
    - 大量顶点时的渲染优化
    - 几何计算缓存
    - _Requirements: All_

  - [x] 10.2 添加使用提示
    - 工具栏添加快捷键提示
    - 首次使用引导
    - _Requirements: All_

## Notes

- 每个Checkpoint确保阶段性功能完整可用
- 属性测试使用 `fast-check` 库
- 几何模块独立于Vue，便于单元测试

