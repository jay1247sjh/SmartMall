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
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'
import type { UserInfo, UserListParams } from '@/api/admin.api'
import UserDetailDrawer from '@/components/admin/UserDetailDrawer.vue'
import { UserSearchForm, UserTable } from '@/components/user'
import type { UserSearchParams } from '@/components/user'
import type { SelectOption } from '@/types/ui'

const { t } = useI18n()

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
const userTypeOptions = computed<SelectOption[]>(() => [
  { label: t('admin.userMgmt.all'), value: 'ALL' },
  { label: t('roles.admin'), value: 'ADMIN' },
  { label: t('roles.merchant'), value: 'MERCHANT' },
  { label: t('roles.user'), value: 'USER' },
])

// 用户状态选项
const statusOptions = computed<SelectOption[]>(() => [
  { label: t('admin.userMgmt.all'), value: 'ALL' },
  { label: t('admin.userMgmt.statusActive'), value: 'ACTIVE' },
  { label: t('admin.userMgmt.statusFrozen'), value: 'FROZEN' },
  { label: t('admin.userMgmt.statusDeleted'), value: 'DELETED' },
])

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
    error.value = (e as Error).message || t('admin.userMgmt.loadUsersFailed')
    console.error('Load user list failed:', e)
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
  searchParams.userType = params.userType as UserSearchParams['userType']
  searchParams.status = params.status as UserSearchParams['status']
}

/**
 * 搜索
 */
function handleSearch() {
  // 同步搜索参数到 searchForm
  searchForm.keyword = searchParams.keyword
  searchForm.userType = searchParams.userType as UserListParams['userType']
  searchForm.status = searchParams.status as UserListParams['status']
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
  // 防御性校验：禁止冻结管理员账户（即使 UI 已隐藏按钮）
  if (user.userType === 'ADMIN') {
    ElMessage.error(t('admin.userMgmt.cannotOperateAdmin'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('admin.userMgmt.confirmFreezeMsg', { username: user.username }),
      t('admin.userMgmt.confirmFreeze'),
      { type: 'warning' }
    )
    await adminApi.freezeUser(user.userId)
    ElMessage.success(t('admin.userMgmt.userFrozen'))
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(t('admin.userMgmt.operationFailed') + ((e as Error).message || t('admin.userMgmt.unknownError')))
    }
  }
}

/**
 * 激活用户
 */
async function handleActivateUser(user: UserInfo) {
  // 防御性校验：禁止操作管理员账户（即使 UI 已隐藏按钮）
  if (user.userType === 'ADMIN') {
    ElMessage.error(t('admin.userMgmt.cannotOperateAdmin'))
    return
  }
  try {
    await ElMessageBox.confirm(
      t('admin.userMgmt.confirmActivateMsg', { username: user.username }),
      t('admin.userMgmt.confirmActivate'),
      { type: 'info' }
    )
    await adminApi.activateUser(user.userId)
    ElMessage.success(t('admin.userMgmt.userActivated'))
    await loadUsers()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(t('admin.userMgmt.operationFailed') + ((e as Error).message || t('admin.userMgmt.unknownError')))
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
      :current-page="searchForm.page ?? 1"
      :page-size="searchForm.pageSize ?? 10"
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
