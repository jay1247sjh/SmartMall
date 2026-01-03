# Design Document: Mall Builder Materials System

## Overview

本设计文档描述商城建模器材质系统的增强功能，包括预设公共区域材质、区域放置规则验证、垂直连接系统和 Orbit 观察模式。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MallBuilderView.vue                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Material    │  │ Canvas      │  │ Property Panel      │  │
│  │ Panel       │  │ Container   │  │ (existing)          │  │
│  │ (new)       │  │ (existing)  │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Builder Module                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ materials/      │  │ rules/          │                   │
│  │ - presets.ts    │  │ - placement.ts  │                   │
│  │ - types.ts      │  │ - validation.ts │                   │
│  └─────────────────┘  └─────────────────┘                   │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ connections/    │  │ types/          │                   │
│  │ - vertical.ts   │  │ - area-type.ts  │                   │
│  │ - rendering.ts  │  │ (updated)       │                   │
│  └─────────────────┘  └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Material Preset System

```typescript
// src/builder/materials/types.ts
interface MaterialPreset {
  id: string
  name: string
  description: string
  icon: string  // SVG path or icon name
  areaType: AreaType
  color: string
  category: MaterialCategory
  placementRules: PlacementRule
  isVerticalConnection: boolean
}

type MaterialCategory = 'circulation' | 'service' | 'common'

interface PlacementRule {
  allowedItems: AreaType[]  // empty array means no items allowed
  requiresFloorConnection: boolean
}
```

### 2. Placement Validation System

```typescript
// src/builder/rules/placement.ts
interface PlacementValidationResult {
  valid: boolean
  message?: string
}

function validatePlacement(
  targetArea: AreaDefinition,
  itemType: AreaType
): PlacementValidationResult

function getPlacementRules(areaType: AreaType): PlacementRule
```

### 3. Vertical Connection System

```typescript
// src/builder/connections/vertical.ts
interface VerticalConnection {
  id: string
  areaId: string
  connectedFloors: string[]  // floor IDs
  connectionType: 'elevator' | 'escalator' | 'stairs'
}

interface FloorConnection {
  fromFloorId: string
  toFloorId: string
  areaId: string
}
```

### 4. View Mode System

```typescript
// View mode state in MallBuilderView.vue
type ViewMode = 'edit' | 'orbit'

interface ViewModeState {
  currentMode: ViewMode
  savedCameraPosition?: THREE.Vector3
  savedCameraTarget?: THREE.Vector3
}
```

## Data Models

### Extended AreaDefinition

```typescript
interface AreaDefinition {
  // ... existing fields
  placementRules?: PlacementRule
  verticalConnection?: VerticalConnection
}
```

### Material Presets Data

```typescript
const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: 'corridor',
    name: '走廊',
    description: '人行通道，不可放置任何设施',
    icon: 'corridor-icon',
    areaType: 'corridor',
    color: '#9ca3af',
    category: 'circulation',
    placementRules: { allowedItems: [], requiresFloorConnection: false },
    isVerticalConnection: false,
  },
  {
    id: 'escalator',
    name: '扶梯',
    description: '自动扶梯，连接相邻楼层',
    icon: 'escalator-icon',
    areaType: 'escalator',
    color: '#14b8a6',
    category: 'circulation',
    placementRules: { allowedItems: ['escalator'], requiresFloorConnection: true },
    isVerticalConnection: true,
  },
  // ... more presets
]
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Placement Rule Validation

*For any* area with a defined placement rule and *for any* item type, the placement validation function should return `valid: true` if and only if the item type is in the area's `allowedItems` list.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 2: Material Preset Consistency

*For any* material preset, placing it should create an area with the exact `areaType` and `color` defined in the preset.

**Validates: Requirements 1.3**

### Property 3: Orbit Mode State Isolation

*For any* sequence of camera movements in orbit mode, switching back to edit mode should restore the camera to its position before entering orbit mode.

**Validates: Requirements 4.4**

### Property 4: Orbit Mode Control State

*For any* view mode state, camera controls should be enabled if and only if the mode is 'orbit' or the current tool is 'pan'.

**Validates: Requirements 4.2, 4.3**

### Property 5: Vertical Connection Rendering

*For any* area with a vertical connection, the rendering should produce a visual indicator connecting to all specified floors.

**Validates: Requirements 3.2, 3.3**

### Property 6: Vertical Connection Validation

*For any* vertical connection, all referenced floor IDs must exist in the project's floor list.

**Validates: Requirements 3.4**

## Error Handling

1. **Invalid Placement**: Display warning message "此区域不允许放置该类型的设施" and prevent placement
2. **Missing Floor Connection**: Display warning "请选择要连接的楼层" when creating vertical connection without selecting floors
3. **Invalid Floor Reference**: Display error "连接的楼层不存在" if referenced floor is deleted

## Testing Strategy

### Unit Tests
- Test `validatePlacement` function with various area types and item combinations
- Test `getPlacementRules` returns correct rules for each area type
- Test material preset data integrity

### Property-Based Tests
- Use fast-check to generate random area types and item types, verify placement rules
- Test orbit mode state transitions with random camera positions
- Test vertical connection validation with random floor configurations

### Integration Tests
- Test material panel selection and area creation flow
- Test orbit mode toggle and camera behavior
- Test vertical connection creation and rendering
