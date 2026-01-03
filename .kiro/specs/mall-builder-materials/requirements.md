# Requirements Document

## Introduction

商城建模器材质系统增强功能，为管理员提供预设的公共区域材质（如走廊、扶梯、楼梯等），并实现区域类型的放置规则验证。同时增加 Orbit 观察模式，允许管理员自由观察商城内部结构。

## Glossary

- **Material_System**: 材质系统，管理预设的公共区域材质和放置规则
- **Area_Type**: 区域类型，定义区域的用途（走廊、扶梯、电梯等）
- **Placement_Rule**: 放置规则，定义某种区域类型可以放置的内容
- **Vertical_Connection**: 垂直连接，扶梯/电梯/楼梯等连接多层楼的通道
- **Orbit_Mode**: 轨道观察模式，允许自由旋转、缩放、平移视角观察商城

## Requirements

### Requirement 1: 预设公共区域材质

**User Story:** 作为管理员，我希望有预设的公共区域材质可以快速放置，以便高效地规划商城布局。

#### Acceptance Criteria

1. THE Material_System SHALL provide preset materials for common area types including: corridor (走廊), elevator (电梯), escalator (扶梯), stairs (楼梯), restroom (洗手间), common (公共区域)
2. WHEN an administrator selects a preset material, THE Material_System SHALL display a preview of the material before placement
3. WHEN a preset material is placed, THE Material_System SHALL automatically set the correct area type and color

### Requirement 2: 区域放置规则

**User Story:** 作为管理员，我希望系统能验证区域放置规则，以确保商城布局的合理性。

#### Acceptance Criteria

1. WHEN an area type is "corridor", THE Placement_Rule SHALL prevent any sub-items from being placed inside
2. WHEN an area type is "escalator" or "stairs", THE Placement_Rule SHALL only allow escalator or stairs items to be placed
3. WHEN an area type is "elevator", THE Placement_Rule SHALL only allow elevator items to be placed
4. IF a user attempts to place an invalid item in a restricted area, THEN THE Material_System SHALL display a warning message and prevent the placement

### Requirement 3: 垂直连接系统

**User Story:** 作为管理员，我希望扶梯和电梯能自动连接多层楼，以便正确表示商城的垂直交通。

#### Acceptance Criteria

1. WHEN an escalator or elevator area is created, THE Vertical_Connection SHALL prompt the user to select connected floors
2. THE Vertical_Connection SHALL visually indicate the connection between floors with a vertical line or indicator
3. WHEN viewing a floor, THE Vertical_Connection SHALL highlight areas that connect to other floors
4. THE Vertical_Connection SHALL validate that connected areas exist on the target floors

### Requirement 4: Orbit 观察模式

**User Story:** 作为管理员，我希望能切换到 Orbit 模式自由观察商城内部结构，以便更好地理解空间布局。

#### Acceptance Criteria

1. THE Orbit_Mode SHALL provide a toggle button in the toolbar to switch between edit mode and orbit mode
2. WHILE in Orbit_Mode, THE System SHALL enable full camera rotation, zoom, and pan controls
3. WHILE in Orbit_Mode, THE System SHALL disable all editing operations (drawing, selecting, modifying)
4. WHEN switching from Orbit_Mode to edit mode, THE System SHALL restore the previous camera position
5. THE Orbit_Mode SHALL display a visual indicator showing the current mode

### Requirement 5: 材质面板 UI

**User Story:** 作为管理员，我希望有一个直观的材质面板来选择和放置预设材质。

#### Acceptance Criteria

1. THE Material_System SHALL display a material panel on the left side with categorized preset materials
2. WHEN a material is selected, THE Material_System SHALL highlight the selected material in the panel
3. THE Material_System SHALL display material name, icon, and brief description for each preset
4. WHEN hovering over a material, THE Material_System SHALL show a tooltip with detailed information
