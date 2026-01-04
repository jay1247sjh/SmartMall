# 状态管理学习指南

## 学习目标

通过本章学习，你将掌握：
- Pinia 状态管理基础
- Store 的设计模式
- 状态持久化
- 跨组件状态共享

---

## 苏格拉底式问答

### 问题 1：为什么需要状态管理？

**思考**：如果没有状态管理，组件之间如何共享数据？

```
         App
        /   \
    Header  Main
      |       |
   UserInfo  Mall3D
```

如果 `UserInfo` 和 `Mall3D` 都需要用户信息，怎么办？

<details>
<summary>点击查看答案</summary>

**没有状态管理的方案**：
1. **Props 逐层传递**：App → Header → UserInfo
   - 问题：层级深时非常繁琐（Props Drilling）
2. **事件向上传递**：子组件 emit，父组件监听
   - 问题：跨多层组件时复杂
3. **全局变量**：`window.user = {...}`
   - 问题：不响应式，难以追踪变化

**状态管理的优势**：
```typescript
// 任何组件都可以直接访问
const userStore = useUserStore();
console.log(userStore.user.name);
```

- 集中管理，单一数据源
- 响应式更新
- 可追踪、可调试

</details>

### 问题 2：Pinia 和 Vuex 有什么区别？

<details>
<summary>点击查看答案</summary>

| 特性 | Vuex | Pinia |
|------|------|-------|
| API 风格 | Options API | Composition API |
| TypeScript | 需要额外配置 | 原生支持 |
| Mutations | 必须通过 mutation 修改 | 可直接修改 state |
| 模块 | 需要 modules 配置 | 每个 store 独立 |
| 体积 | ~10KB | ~1KB |

```typescript
// Vuex 修改状态
store.commit('SET_USER', user);

// Pinia 修改状态
userStore.user = user;  // 直接修改
```

</details>

### 问题 3：什么时候应该使用 Store？

<details>
<summary>点击查看答案</summary>

**适合放在 Store 的数据**：
- 用户信息（登录状态、权限）
- 全局配置（主题、语言）
- 跨页面共享的数据

**不适合放在 Store 的数据**：
- 组件内部状态（表单输入）
- 临时数据（加载状态）
- 只在父子组件间传递的数据

</details>

---

## 核心代码解析

### 1. 用户 Store

```typescript
// stores/user.store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  
  // Getters
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  
  // Actions
  async function login(username: string, password: string) {
    const result = await authApi.login({ username, password });
    token.value = result.token;
    user.value = result.user;
    localStorage.setItem('token', result.token);
  }
  
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }
  
  return { user, token, isLoggedIn, isAdmin, login, logout };
});
```

### 2. 商城 Store

```typescript
// stores/mall.store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { mallApi } from '@/api';

export const useMallStore = defineStore('mall', () => {
  const currentMall = ref<Mall | null>(null);
  const floors = ref<Floor[]>([]);
  const selectedFloor = ref<Floor | null>(null);
  
  async function loadMall(mallId: string) {
    currentMall.value = await mallApi.getMall(mallId);
    floors.value = currentMall.value.floors;
  }
  
  function selectFloor(floor: Floor) {
    selectedFloor.value = floor;
  }
  
  return { currentMall, floors, selectedFloor, loadMall, selectFloor };
});
```

### 3. 建模器 Store

```typescript
// stores/builder.store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useBuilderStore = defineStore('builder', () => {
  // 当前项目
  const project = ref<MallProject | null>(null);
  
  // 编辑状态
  const selectedObject = ref<SemanticObject | null>(null);
  const isDirty = ref(false);
  
  // 历史记录（撤销/重做）
  const history = ref<HistoryEntry[]>([]);
  const historyIndex = ref(-1);
  
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);
  
  function undo() {
    if (canUndo.value) {
      historyIndex.value--;
      applyHistoryState(history.value[historyIndex.value]);
    }
  }
  
  function redo() {
    if (canRedo.value) {
      historyIndex.value++;
      applyHistoryState(history.value[historyIndex.value]);
    }
  }
  
  return { project, selectedObject, isDirty, canUndo, canRedo, undo, redo };
});
```

---

## 关键文件

| 文件 | 说明 | 跳转 |
|------|------|------|
| user.store.ts | 用户信息、登录状态 | [查看](../../apps/frontend/SMART-MALL/src/stores/user.store.ts) |
| mall.store.ts | 商城数据、楼层选择 | [查看](../../apps/frontend/SMART-MALL/src/stores/mall.store.ts) |
| builder.store.ts | 建模器状态、历史记录 | [查看](../../apps/frontend/SMART-MALL/src/stores/builder.store.ts) |
| system.store.ts | 系统配置、主题 | [查看](../../apps/frontend/SMART-MALL/src/stores/system.store.ts) |
| index.ts | Store 模块导出 | [查看](../../apps/frontend/SMART-MALL/src/stores/index.ts) |

---

## 延伸阅读

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
