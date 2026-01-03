# Element Plus 组件学习指南

## 学习目标

通过本章学习，你将掌握：
- Element Plus 组件库使用
- 组件封装与复用
- 表单验证
- 主题定制

---

## 苏格拉底式问答

### 问题 1：为什么使用组件库？

**思考**：自己写一个 DatePicker 需要考虑哪些问题？

<details>
<summary>点击查看答案</summary>

自己实现需要考虑：
- 日历布局和计算
- 国际化（不同语言、日期格式）
- 键盘导航
- 无障碍访问（ARIA）
- 各种边界情况

使用组件库的好处：
1. 节省开发时间
2. 经过大量测试
3. 统一的设计风格
4. 持续维护更新

</details>

### 问题 2：如何封装业务组件？

<details>
<summary>点击查看答案</summary>

```vue
<!-- components/ShopSelector.vue -->
<template>
  <el-select
    v-model="modelValue"
    filterable
    remote
    :remote-method="searchShops"
    :loading="loading"
    placeholder="选择店铺"
  >
    <el-option
      v-for="shop in shops"
      :key="shop.id"
      :label="shop.name"
      :value="shop.id"
    />
  </el-select>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  floorId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>
```

封装原则：
1. 单一职责
2. 可配置
3. 类型安全

</details>


---

## 核心代码解析

### 1. 按需引入配置

```typescript
// main.ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const app = createApp(App);
app.use(ElementPlus, { locale: zhCn });
```

### 2. 表单验证

```vue
<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="form.password" type="password" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">登录</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';

const formRef = ref<FormInstance>();
const form = reactive({ username: '', password: '' });

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ]
};

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid) {
    // 提交表单
  }
}
</script>
```

### 3. 消息提示封装

```typescript
// utils/message.ts
import { ElMessage, ElMessageBox } from 'element-plus';

export const message = {
  success: (msg: string) => ElMessage.success(msg),
  error: (msg: string) => ElMessage.error(msg),
  warning: (msg: string) => ElMessage.warning(msg),
  
  confirm: (msg: string, title = '提示') => 
    ElMessageBox.confirm(msg, title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
};
```

---

## 常用组件

| 组件 | 用途 | 示例 |
|------|------|------|
| ElButton | 按钮 | 提交、取消 |
| ElInput | 输入框 | 表单输入 |
| ElSelect | 下拉选择 | 分类选择 |
| ElTable | 表格 | 数据列表 |
| ElDialog | 对话框 | 编辑弹窗 |
| ElForm | 表单 | 数据录入 |
| ElMessage | 消息提示 | 操作反馈 |

---

## 延伸阅读

- [Element Plus 官方文档](https://element-plus.org/)
- [Vue 3 组件设计模式](https://vuejs.org/guide/components/registration.html)
