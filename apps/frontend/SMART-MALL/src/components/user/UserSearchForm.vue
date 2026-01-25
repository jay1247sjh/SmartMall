<script setup lang="ts">
/**
 * UserSearchForm 组件
 *
 * 用户管理页面的搜索和筛选表单组件。
 *
 * 功能：
 * - 关键词搜索：支持按用户名或邮箱搜索
 * - 用户类型筛选：支持按用户类型（管理员/商家/普通用户）筛选
 * - 状态筛选：支持按用户状态（正常/冻结/已删除）筛选
 * - 搜索和重置操作
 *
 * @example
 * ```vue
 * <UserSearchForm
 *   v-model="searchParams"
 *   :userTypeOptions="userTypeOptions"
 *   :statusOptions="statusOptions"
 *   @search="handleSearch"
 *   @reset="handleReset"
 * />
 * ```
 */
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElSpace,
} from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import type { SelectOption } from '@/types/ui'

// ============================================================================
// 类型定义
// ============================================================================

export interface UserSearchParams {
  /** 搜索关键词（用户名或邮箱） */
  keyword: string
  /** 用户类型筛选 */
  userType: string
  /** 用户状态筛选 */
  status: string
}

export interface UserSearchFormProps {
  /** 搜索参数（v-model） */
  modelValue: UserSearchParams
  /** 用户类型选项列表 */
  userTypeOptions: SelectOption[]
  /** 用户状态选项列表 */
  statusOptions: SelectOption[]
}

export interface UserSearchFormEmits {
  (e: 'update:modelValue', value: UserSearchParams): void
  (e: 'search'): void
  (e: 'reset'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<UserSearchFormProps>(), {
  userTypeOptions: () => [],
  statusOptions: () => [],
})

const emit = defineEmits<UserSearchFormEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 更新关键词
 */
function handleKeywordChange(value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    keyword: value,
  })
}

/**
 * 更新用户类型
 */
function handleUserTypeChange(value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    userType: value,
  })
}

/**
 * 更新状态
 */
function handleStatusChange(value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    status: value,
  })
}

/**
 * 触发搜索
 */
function handleSearch() {
  emit('search')
}

/**
 * 触发重置
 */
function handleReset() {
  emit('reset')
}

/**
 * 回车键搜索
 */
function handleKeyupEnter() {
  emit('search')
}
</script>

<template>
  <ElCard shadow="never" class="search-card">
    <ElForm :model="modelValue" inline>
      <ElFormItem label="关键词">
        <ElInput
          :model-value="modelValue.keyword"
          placeholder="搜索用户名或邮箱"
          clearable
          style="width: 200px"
          @update:model-value="handleKeywordChange"
          @keyup.enter="handleKeyupEnter"
        />
      </ElFormItem>
      <ElFormItem label="用户类型">
        <ElSelect
          :model-value="modelValue.userType"
          style="width: 120px"
          @update:model-value="handleUserTypeChange"
        >
          <ElOption
            v-for="opt in userTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect
          :model-value="modelValue.status"
          style="width: 120px"
          @update:model-value="handleStatusChange"
        >
          <ElOption
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElSpace>
          <ElButton type="primary" :icon="Search" @click="handleSearch">搜索</ElButton>
          <ElButton :icon="Refresh" @click="handleReset">重置</ElButton>
        </ElSpace>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.search-card {
  @include card-base;
  border-radius: $radius-lg;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}
</style>
