<script setup lang="ts">
/**
 * 用户详情抽屉组件
 *
 * 展示用户的详细信息，包括基本信息、账户状态等。
 *
 * Props:
 * - visible: 抽屉是否可见
 * - userId: 要查看的用户 ID
 *
 * Emits:
 * - update:visible: 更新可见状态
 * - close: 关闭抽屉
 */
import { ref, watch } from 'vue'
import {
  ElDrawer,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
  ElSkeleton,
  ElEmpty,
  ElButton,
} from 'element-plus'
import { adminApi } from '@/api'
import type { UserDetail } from '@/api/admin.api'

const props = defineProps<{
  visible: boolean
  userId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const user = ref<UserDetail | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 监听 userId 变化，加载用户详情
watch(
  () => props.userId,
  async (newUserId) => {
    if (newUserId) {
      await loadUserDetail(newUserId)
    } else {
      user.value = null
    }
  },
  { immediate: true }
)

// 加载用户详情
async function loadUserDetail(userId: string) {
  isLoading.value = true
  error.value = null
  try {
    user.value = await adminApi.getUserDetail(userId)
  } catch (e) {
    error.value = (e as Error).message || '加载用户详情失败'
    console.error('加载用户详情失败:', e)
  } finally {
    isLoading.value = false
  }
}

// 关闭抽屉
function handleClose() {
  emit('update:visible', false)
  emit('close')
}

// 格式化日期时间
function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取用户类型标签类型
function getUserTypeTagType(userType: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (userType) {
    case 'ADMIN': return 'danger'
    case 'MERCHANT': return 'warning'
    case 'USER': return 'info'
    default: return ''
  }
}

// 获取用户类型显示文本
function getUserTypeLabel(userType: string): string {
  switch (userType) {
    case 'ADMIN': return '管理员'
    case 'MERCHANT': return '商家'
    case 'USER': return '普通用户'
    default: return userType
  }
}

// 获取状态标签类型
function getStatusTagType(status: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'FROZEN': return 'warning'
    case 'DELETED': return 'danger'
    default: return ''
  }
}

// 获取状态显示文本
function getStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE': return '正常'
    case 'FROZEN': return '冻结'
    case 'DELETED': return '已删除'
    default: return status
  }
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    title="用户详情"
    size="400px"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
  >
    <!-- 加载状态 -->
    <ElSkeleton v-if="isLoading" :rows="10" animated />

    <!-- 错误状态 -->
    <ElEmpty v-else-if="error" :description="error">
      <ElButton v-if="props.userId" type="primary" @click="loadUserDetail(props.userId)">重试</ElButton>
    </ElEmpty>

    <!-- 用户详情 -->
    <ElDescriptions v-else-if="user" :column="1" border>
      <ElDescriptionsItem label="用户 ID">
        {{ user.userId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户名">
        {{ user.username }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="邮箱">
        {{ user.email }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="手机号">
        {{ user.phone || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="用户类型">
        <ElTag :type="getUserTypeTagType(user.userType)" size="small">
          {{ getUserTypeLabel(user.userType) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <ElTag :type="getStatusTagType(user.status)" size="small">
          {{ getStatusLabel(user.status) }}
        </ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="注册时间">
        {{ formatDateTime(user.createdAt) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="最后登录">
        {{ formatDateTime(user.lastLoginTime) }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 无数据 -->
    <ElEmpty v-else description="请选择用户" />
  </ElDrawer>
</template>

<style scoped lang="scss">
:deep(.el-descriptions) {
  .el-descriptions__label {
    width: 100px;
    font-weight: 500;
  }
}
</style>
