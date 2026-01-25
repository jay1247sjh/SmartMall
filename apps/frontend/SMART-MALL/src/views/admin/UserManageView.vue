<script setup lang="ts">
/**
 * 用户管理视图
 *
 * 管理员用户管理页面，提供用户列表展示、搜索筛选、状态管理等功能。
 *
 * 业务职责：
 * - 展示系统所有用户列表（分页）
 * - 支持按用户名/邮箱搜索
 * - 支持按用户类型和状态筛选
 * - 支持冻结/激活用户账户
 * - 查看用户详细信息
 *
 * 用户角色：
 * - 仅管理员（ADMIN）可访问
 *
 * 组件结构：
 * - UserSearchForm: 搜索和筛选表单
 * - UserTable: 用户列表表格和分页
 * - UserDetailDrawer: 用户详情抽屉
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import type { UserInfo, UserListParams } from '@/api/admin.api'
import UserDetailDrawer from '@/components/admin/UserDetailDrawer.vue'
import { UserSearchForm, UserTable } from '@/components/user'
import type { UserSearchParams } from '@/components/user'
import type { SelectOption } from '@/types/ui'

// ============================================================================
// 用户列表数据
// ============================================================================

const users = ref<UserInfo[]>([])
const total = ref(0)
const isLoading = ref(false)
const error = ref<string | null>(null)

// ============================================================================
// 搜索表单
// ============================================================================

const searchForm = reactive<UserListParams>({
  keyword: '',
  userType: 'ALL',
  status: 'ALL',
  page: 1,
  pageSize: 10,
})

// 搜索参数（用于 UserSearchForm 组件）
const searchParams = reactive<UserSearchParams>({
  keyword: '',
  userType: 'ALL',
  status: 'ALL',
})

// ============================================================================
// 详情抽屉
// ============================================================================

const detailDrawerVisible = ref(false)
const selectedUserId = ref<string | null>(null)

// ============================================================================
// 选项配置
// ============================================================================

// 用户类型选项
const userTypeOptions: SelectOption[] = [
  { label: '全部', value: 'ALL' },
  { label: '管理员', value: 'ADMIN' },
  { label: '商家', value: 'MERCHANT' },
  { label: '普通用户', value: 'USER' },
]

// 用户状态选项
const statusOptions: SelectOption[] = [
  { label: '全部', value: 'ALL' },
  { label: '正常', value: 'ACTIVE' },
  { label: '冻结', value: 'FROZEN' },
  { label: '已删除', value: 'DELETED' },
]

// ============================================================================
// 数据加载
// ============================================================================

/**
 * 加载用户列表
 */
async function loadUsers() {
  isLoading.value = true
  error.value = null
  try {
    const res = await adminApi.getUserList(searchForm)
    users.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = (e as Error).message || '加载用户列表失败'
    console.error('加载用户列表失败:', e)
  } finally {
    isLoading.value = false
  }
}

// ============================================================================
// 搜索表单事件处理
// ============================================================================

/**
 * 更新搜索参数
 */
function handleSearchParamsUpdate(params: UserSearchParams) {
  searchParams.keyword = params.keyword
  searchParams.userType = params.userType
  searchParams.status = params.status
}

/**
 * 搜索
 */
function handleSearch() {
  // 同步搜索参数到 searchForm
  searchForm.keyword = searchParams.keyword
  searchForm.userType = searchParams.userType
  searchForm.status = searchParams.status
  searchForm.page = 1
  loadUsers()
}

/**
 * 重置搜索
 */
function handleReset() {
  // 重置搜索参数
  searchParams.keyword = ''
  searchParams.userType = 'ALL'
  searchParams.status = 'ALL'
  // 同步到 searchForm
  Object.assign(searchForm, { keyword: '', userType: 'ALL', status: 'ALL', page: 1 })
  loadUsers()
}

// ============================================================================
// 表格事件处理
// ============================================================================

/**
 * 分页变更
 */
function handlePageChange(page: number) {
  searchForm.page = page
  loadUsers()
}

/**
 * 每页数量变更
 */
function handleSizeChange(size: number) {
  searchForm.pageSize = size
  searchForm.page = 1
  loadUsers()
}

/**
 * 点击行查看详情
 */
function handleRowClick(user: UserInfo) {
  selectedUserId.value = user.userId
  detailDrawerVisible.value = true
}

/**
 * 冻结用户
 */
async function handleFreezeUser(user: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要冻结用户 "${user.username}" 吗？冻结后该用户将无法登录系统。`,
      '确认冻结',
      { type: 'warning' }
    )
    await adminApi.freezeUser(user.userId)
    ElMessage.success('用户已冻结')
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败：' + ((e as Error).message || '未知错误'))
    }
  }
}

/**
 * 激活用户
 */
async function handleActivateUser(user: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要激活用户 "${user.username}" 吗？激活后该用户可以正常登录系统。`,
      '确认激活',
      { type: 'info' }
    )
    await adminApi.activateUser(user.userId)
    ElMessage.success('用户已激活')
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败：' + ((e as Error).message || '未知错误'))
    }
  }
}

/**
 * 重试加载
 */
function handleRetry() {
  loadUsers()
}

// ============================================================================
// 详情抽屉
// ============================================================================

/**
 * 关闭详情抽屉
 */
function closeDetailDrawer() {
  detailDrawerVisible.value = false
  selectedUserId.value = null
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <article class="user-manage">
    <!-- 搜索筛选区域 -->
    <UserSearchForm
      :model-value="searchParams"
      :user-type-options="userTypeOptions"
      :status-options="statusOptions"
      @update:model-value="handleSearchParamsUpdate"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 用户列表区域 -->
    <UserTable
      :users="users"
      :loading="isLoading"
      :total="total"
      :current-page="searchForm.page"
      :page-size="searchForm.pageSize"
      :error="error"
      @row-click="handleRowClick"
      @freeze="handleFreezeUser"
      @activate="handleActivateUser"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @retry="handleRetry"
    />

    <!-- 用户详情抽屉 -->
    <UserDetailDrawer
      v-model:visible="detailDrawerVisible"
      :user-id="selectedUserId"
      @close="closeDetailDrawer"
    />
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;

.user-manage {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
</style>
