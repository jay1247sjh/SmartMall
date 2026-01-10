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
 */
import { ref, reactive, onMounted } from 'vue'
import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElMessage,
  ElMessageBox,
  ElSkeleton,
  ElEmpty,
  ElSpace,
} from 'element-plus'
import { Search, Refresh, User } from '@element-plus/icons-vue'
import { adminApi } from '@/api'
import type { UserInfo, UserListParams } from '@/api/admin.api'
import UserDetailDrawer from '@/components/admin/UserDetailDrawer.vue'

// 用户列表数据
const users = ref<UserInfo[]>([])
const total = ref(0)
const isLoading = ref(false)
const error = ref<string | null>(null)

// 搜索表单
const searchForm = reactive<UserListParams>({
  keyword: '',
  userType: 'ALL',
  status: 'ALL',
  page: 1,
  pageSize: 10,
})

// 详情抽屉
const detailDrawerVisible = ref(false)
const selectedUserId = ref<string | null>(null)

// 用户类型选项
const userTypeOptions = [
  { label: '全部', value: 'ALL' },
  { label: '管理员', value: 'ADMIN' },
  { label: '商家', value: 'MERCHANT' },
  { label: '普通用户', value: 'USER' },
]

// 用户状态选项
const statusOptions = [
  { label: '全部', value: 'ALL' },
  { label: '正常', value: 'ACTIVE' },
  { label: '冻结', value: 'FROZEN' },
  { label: '已删除', value: 'DELETED' },
]

// 加载用户列表
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

// 搜索
function handleSearch() {
  searchForm.page = 1
  loadUsers()
}

// 重置搜索
function handleReset() {
  searchForm.keyword = ''
  searchForm.userType = 'ALL'
  searchForm.status = 'ALL'
  searchForm.page = 1
  loadUsers()
}

// 分页变更
function handlePageChange(page: number) {
  searchForm.page = page
  loadUsers()
}

// 每页数量变更
function handleSizeChange(size: number) {
  searchForm.pageSize = size
  searchForm.page = 1
  loadUsers()
}

// 点击行查看详情
function handleRowClick(row: UserInfo) {
  selectedUserId.value = row.userId
  detailDrawerVisible.value = true
}

// 冻结用户
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

// 激活用户
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

// 关闭详情抽屉
function closeDetailDrawer() {
  detailDrawerVisible.value = false
  selectedUserId.value = null
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <article class="user-manage">
    <!-- 搜索筛选区域 -->
    <ElCard shadow="never" class="search-card">
      <ElForm :model="searchForm" inline>
        <ElFormItem label="关键词">
          <ElInput
            v-model="searchForm.keyword"
            placeholder="搜索用户名或邮箱"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>
        <ElFormItem label="用户类型">
          <ElSelect v-model="searchForm.userType" style="width: 120px">
            <ElOption
              v-for="opt in userTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" style="width: 120px">
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

    <!-- 用户列表区域 -->
    <ElCard shadow="never" class="table-card">
      <!-- 加载状态 -->
      <ElSkeleton v-if="isLoading" :rows="8" animated />

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <ElEmpty :description="error">
          <ElButton type="primary" @click="loadUsers">重试</ElButton>
        </ElEmpty>
      </div>

      <!-- 用户表格 -->
      <template v-else>
        <ElTable
          :data="users"
          stripe
          highlight-current-row
          class="user-table"
          @row-click="handleRowClick"
        >
          <ElTableColumn prop="username" label="用户名" width="150" />
          <ElTableColumn prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
          <ElTableColumn prop="userType" label="用户类型" width="120">
            <template #default="{ row }">
              <ElTag :type="getUserTypeTagType(row.userType)" size="small">
                {{ getUserTypeLabel(row.userType) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="status" label="状态" width="100">
            <template #default="{ row }">
              <ElTag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="createdAt" label="注册时间" width="120">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElSpace>
                <ElButton
                  v-if="row.status === 'ACTIVE'"
                  type="warning"
                  size="small"
                  text
                  @click.stop="handleFreezeUser(row)"
                >
                  冻结
                </ElButton>
                <ElButton
                  v-if="row.status === 'FROZEN'"
                  type="success"
                  size="small"
                  text
                  @click.stop="handleActivateUser(row)"
                >
                  激活
                </ElButton>
              </ElSpace>
            </template>
          </ElTableColumn>

          <template #empty>
            <ElEmpty description="暂无用户数据" />
          </template>
        </ElTable>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <ElPagination
            v-model:current-page="searchForm.page"
            v-model:page-size="searchForm.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </template>
    </ElCard>

    <!-- 用户详情抽屉 -->
    <UserDetailDrawer
      v-model:visible="detailDrawerVisible"
      :user-id="selectedUserId"
      @close="closeDetailDrawer"
    />
  </article>
</template>

<style scoped lang="scss">
.user-manage {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .search-card {
    border-radius: 12px;
    background: rgba(17, 17, 19, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

  .table-card {
    border-radius: 12px;
    background: rgba(17, 17, 19, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.06);

    .error-state {
      padding: 40px 0;
    }

    .user-table {
      :deep(.el-table__row) {
        cursor: pointer;
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
