# 商城建模器持久化学习指南

## 学习目标

通过本章学习，你将掌握：
- 建模器数据的保存与加载
- 后端 API 设计
- 数据库表结构设计
- 前后端数据同步策略

---

## 苏格拉底式问答

### 问题 1：3D 场景数据如何存储？

**思考**：一个商城项目包含多个楼层、店铺、设施，这些数据应该如何组织？

<details>
<summary>点击查看答案</summary>

**数据结构**：
```
MallProject
├── id, name, description
├── floors[]
│   ├── id, level, name, height
│   └── objects[]
│       ├── id, type, name
│       ├── geometry (JSON)
│       └── properties (JSON)
```

**存储方案**：
1. **关系型数据库**：项目、楼层、对象分表存储
2. **JSON 字段**：几何数据和属性用 JSON 存储
3. **文件存储**：大型模型文件单独存储

</details>

### 问题 2：如何处理并发编辑？

<details>
<summary>点击查看答案</summary>

**乐观锁方案**：
```typescript
interface MallProject {
  id: string;
  version: number;  // 版本号
  // ...
}

// 保存时检查版本
async function saveProject(project: MallProject) {
  const result = await api.save({
    ...project,
    expectedVersion: project.version
  });
  
  if (result.code === 'VERSION_CONFLICT') {
    // 提示用户数据已被修改
  }
}
```

</details>


---

## 核心代码解析

### 1. 数据库表结构

```sql
-- 商城项目表
CREATE TABLE mall_projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id VARCHAR(36) NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 楼层表
CREATE TABLE mall_floors (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    level INTEGER NOT NULL,
    name VARCHAR(50),
    height DECIMAL(10,2) DEFAULT 4.0,
    FOREIGN KEY (project_id) REFERENCES mall_projects(id) ON DELETE CASCADE
);

-- 语义对象表
CREATE TABLE semantic_objects (
    id VARCHAR(36) PRIMARY KEY,
    floor_id VARCHAR(36) NOT NULL,
    type VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    geometry JSONB NOT NULL,
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (floor_id) REFERENCES mall_floors(id) ON DELETE CASCADE
);
```

### 2. 后端 API

```java
// MallBuilderController.java
@RestController
@RequestMapping("/api/mall-builder")
public class MallBuilderController {
    
    @GetMapping("/projects")
    public ApiResponse<List<MallProjectDTO>> getProjects() {
        return ApiResponse.success(service.getUserProjects());
    }
    
    @GetMapping("/projects/{id}")
    public ApiResponse<MallProjectDTO> getProject(@PathVariable String id) {
        return ApiResponse.success(service.getProject(id));
    }
    
    @PostMapping("/projects")
    public ApiResponse<MallProjectDTO> saveProject(
            @RequestBody @Valid SaveProjectRequest request) {
        return ApiResponse.success(service.saveProject(request));
    }
    
    @DeleteMapping("/projects/{id}")
    public ApiResponse<Void> deleteProject(@PathVariable String id) {
        service.deleteProject(id);
        return ApiResponse.success(null);
    }
}
```

### 3. 前端保存逻辑

```typescript
// composables/useMallBuilderPersistence.ts
export function useMallBuilderPersistence() {
  const builderStore = useBuilderStore();
  const { project, isDirty } = storeToRefs(builderStore);
  
  // 自动保存（防抖）
  const autoSave = useDebounceFn(async () => {
    if (isDirty.value && project.value) {
      await saveProject();
    }
  }, 5000);
  
  // 监听变化
  watch(() => builderStore.project, () => {
    isDirty.value = true;
    autoSave();
  }, { deep: true });
  
  async function saveProject() {
    const dto = serializeProject(project.value);
    const result = await mallBuilderApi.saveProject(dto);
    project.value.version = result.version;
    isDirty.value = false;
  }
  
  async function loadProject(id: string) {
    const dto = await mallBuilderApi.getProject(id);
    project.value = deserializeProject(dto);
    isDirty.value = false;
  }
  
  return { saveProject, loadProject, isDirty };
}
```

### 4. 数据序列化

```typescript
// utils/serialization.ts
export function serializeProject(project: MallProject): MallProjectDTO {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    floors: project.floors.map(floor => ({
      id: floor.id,
      level: floor.level,
      name: floor.name,
      height: floor.height,
      objects: floor.objects.map(obj => ({
        id: obj.id,
        type: obj.type,
        name: obj.name,
        geometry: JSON.stringify(obj.geometry),
        properties: obj.properties
      }))
    }))
  };
}

export function deserializeProject(dto: MallProjectDTO): MallProject {
  return {
    ...dto,
    floors: dto.floors.map(floor => ({
      ...floor,
      objects: floor.objects.map(obj => ({
        ...obj,
        geometry: JSON.parse(obj.geometry)
      }))
    }))
  };
}
```

---

## 延伸阅读

- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [乐观锁与悲观锁](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
