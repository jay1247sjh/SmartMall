# Requirements Document

## Introduction

增强商城建模器，支持管理员自定义商城的整体结构，包括商城外轮廓、楼层平面形状、以及更灵活的区域划分方式。当前版本仅支持在固定矩形网格上绘制区域，本需求旨在提供更专业的建模能力。

## Glossary

- **Mall_Builder**: 商城建模器，用于创建和编辑商城3D布局的工具
- **Mall_Outline**: 商城外轮廓，定义整个商城的边界形状
- **Floor_Shape**: 楼层形状，每层楼的平面轮廓（可以不同于商城外轮廓）
- **Area**: 区域，楼层内的商铺或功能区域
- **Grid_System**: 网格系统，用于辅助绘制和对齐的参考线

## Requirements

### Requirement 1: 商城外轮廓定义

**User Story:** As an administrator, I want to define the overall shape of the mall, so that I can model malls with non-rectangular footprints.

#### Acceptance Criteria

1. WHEN the administrator starts a new mall project, THE Mall_Builder SHALL provide options to choose outline type (rectangle, L-shape, polygon, or import from file)
2. WHEN the administrator selects polygon mode, THE Mall_Builder SHALL allow drawing a custom closed polygon as the mall boundary
3. WHEN the administrator draws the mall outline, THE Mall_Builder SHALL display real-time dimensions and area calculations
4. WHEN the mall outline is defined, THE Mall_Builder SHALL constrain all floor shapes and areas within this boundary
5. WHEN the administrator modifies the mall outline, THE Mall_Builder SHALL warn if existing areas would be outside the new boundary

### Requirement 2: 楼层形状自定义

**User Story:** As an administrator, I want to define different shapes for each floor, so that I can model malls where upper floors have different footprints than lower floors.

#### Acceptance Criteria

1. WHEN the administrator creates a new floor, THE Mall_Builder SHALL offer to inherit the mall outline or define a custom shape
2. WHEN the administrator chooses custom shape, THE Mall_Builder SHALL allow drawing a polygon that fits within the mall outline
3. WHEN displaying multiple floors, THE Mall_Builder SHALL show floor boundaries with different visual styles
4. THE Mall_Builder SHALL validate that each floor shape is contained within the mall outline

### Requirement 3: 灵活的区域绘制

**User Story:** As an administrator, I want to draw areas with various shapes, so that I can accurately represent real-world store layouts.

#### Acceptance Criteria

1. WHEN drawing areas, THE Mall_Builder SHALL support rectangle, polygon, and freeform shapes
2. WHEN the administrator draws a polygon area, THE Mall_Builder SHALL allow adding/removing vertices after creation
3. WHEN areas overlap, THE Mall_Builder SHALL highlight the conflict and prevent saving
4. THE Mall_Builder SHALL snap area vertices to grid points when snap-to-grid is enabled
5. WHEN an area extends beyond the floor boundary, THE Mall_Builder SHALL clip or warn the administrator

### Requirement 4: 预设模板

**User Story:** As an administrator, I want to start from common mall layout templates, so that I can quickly create standard configurations.

#### Acceptance Criteria

1. WHEN starting a new project, THE Mall_Builder SHALL offer template options (rectangular, L-shaped, U-shaped, circular)
2. WHEN a template is selected, THE Mall_Builder SHALL generate the mall outline and suggested floor divisions
3. THE Mall_Builder SHALL allow full customization after template application

### Requirement 5: 导入外部平面图

**User Story:** As an administrator, I want to import architectural floor plans, so that I can trace over existing designs.

#### Acceptance Criteria

1. WHEN the administrator imports an image file, THE Mall_Builder SHALL display it as a background layer
2. WHEN the background image is loaded, THE Mall_Builder SHALL allow scaling and positioning to match the grid
3. THE Mall_Builder SHALL support common image formats (PNG, JPG, SVG)
4. WHEN tracing over the image, THE Mall_Builder SHALL allow adjusting image opacity

### Requirement 6: 3D 预览增强

**User Story:** As an administrator, I want to see a realistic 3D preview of my mall design, so that I can verify the layout before publishing.

#### Acceptance Criteria

1. WHEN viewing the 3D preview, THE Mall_Builder SHALL render floors with proper height separation
2. WHEN the administrator adjusts floor height, THE Mall_Builder SHALL update the 3D view in real-time
3. THE Mall_Builder SHALL allow rotating and zooming the 3D view from any angle
4. WHEN hovering over an area in 3D view, THE Mall_Builder SHALL highlight it and show its properties

