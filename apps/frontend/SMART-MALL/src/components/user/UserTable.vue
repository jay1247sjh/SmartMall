<script setup lang="ts">
/**
 * UserTable 组件
 *
 * 用户管理页面的用户列表表格组件。
 *
 * 功能：
 * - 用户列表展示：显示用户名、邮箱、类型、状态、注册时间
 * - 行点击：点击行查看用户详情
 * - 操作按钮：冻结/激活用户
 * - 分页：支持分页和每页数量切换
 * - v-memo 优化：使用 v-memo 指令优化列表渲染性能
 *
 * 性能优化：
 * - 使用 v-memo 指令缓存用户行渲染，只有当用户数据变化时才重新渲染
 * - Requirements: 25.2, 25.5
 *
 * @example
 * ```vue
 * <UserTable
 *   :users="users"
 *   :loading="isLoading"
 *   :total="total"
 *   :currentPage="currentPage"
 *   :pageSize="pageSize"
 *   @rowClick="handleRowClick"
 *   @freeze="handleFreeze"
 *   @activate="handleActivate"
 *   @pageChange="handlePageChange"
 *   @sizeChange="handleSizeChange"
 * />
 * ```
 */
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElButton,
  ElSkeleton,
  ElEmpty,
  ElSpace,
} from 'element-plus'
import type { UserInfo } from '@/api/admin.api'
import { useFormatters, useStatusConfig } from '@/composables'

// ============================================================================
// 类型定义
// ============================================================================

export interface UserTableProps {
  /** 用户列表数据 */
  users: UserInfo[]
  /** 加载状态 */
  loading: boolean
  /** 总记录数 */
  total: number
  /** 当前页码 */
  currentPage: number
  /** 每页数量 */
  pageSize: number
  /** 错误信息 */
  error?: string | null
}

export interface UserTableEmits {
  (e: 'rowClick', user: UserInfo): void
  (e: 'freeze', user: UserInfo): void
  (e: 'activate', user: UserInfo): void
  (e: 'pageChange', page: number): void
  (e: 'sizeChange', size: number): void
  (e: 'retry'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<UserTableProps>(), {
  users: () => [],
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  error: null,
})

const emit = defineEmits<UserTableEmits>()

// ============================================================================
// Composables
// ============================================================================

const { formatDate } = useFormatters()
const { getStatusConfig } = useStatusConfig()

// ============================================================================
// 用户类型配置
// ============================================================================

const userTypeConfig: Record<string, { label: string; tagType: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  ADMIN: { label: '管理员', tagType: 'danger' },
  MERCHANT: { label: '商家', tagType: 'warning' },
  USER: { label: '普通用户', tagType: 'info' },
}

// ============================================================================
// 方法
// ============================================================================

/**
 * 获取用户类型配置
 */
function getUserTypeConfig(userType: string) {
  return userTypeConfig[userType] || { label: userType, tagType: '' as const }
}

/**
 * 获取用户状态配置
 */
function getUserStatusConfig(status: string) {
  return getStatusConfig(status, 'user')
}

/**
 * 处理行点击
 */
function handleRowClick(row: UserInfo) {
  emit('rowClick', row)
}

/**
 * 处理冻结用户
 */
function handleFreeze(user: UserInfo, event: MouseEvent) {
  event.stopPropagation()
  emit('freeze', user)
}

/**
 * 处理激活用户
 */
function handleActivate(user: UserInfo, event: MouseEvent) {
  event.stopPropagation()
  emit('activate', user)
}

/**
 * 处理页码变更
 */
function handlePageChange(page: number) {
  emit('pageChange', page)
}

/**
 * 处理每页数量变更
 */
function handleSizeChange(size: number) {
  emit('sizeChange', size)
}

/**
 * 处理重试
 */
function handleRetry() {
  emit('retry')
}
</script>

<template>
  <ElCard shadow="never" class="table-card">
    <!-- 加载状态 -->
    <ElSkeleton v-if="loading" :rows="8" animated />

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <ElEmpty :description="error">
        <ElButton type="primary" @click="handleRetry">重试</ElButton>
      </ElEmpty>
    </div>

    <!-- 用户表格 -->
    <template v-else>
      <!-- 
        使用自定义表格实现 v-memo 优化
        v-memo 指令缓存行渲染，只有当指定的依赖项变化时才重新渲染
        Requirements: 25.2, 25.5
      -->
      <div class="user-table-wrapper">
        <table class="user-table-custom">
          <thead>
            <tr>
              <th style="width: 150px">用户名</th>
              <th style="min-width: 200px">邮箱</th>
              <th style="width: 120px">用户类型</th>
              <th style="width: 100px">状态</th>
              <th style="width: 120px">注册时间</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- 
              v-memo 优化：只有当用户的关键属性变化时才重新渲染该行
              依赖项：id, username, email, userType, status, createdAt
            -->
            <tr
              v-for="user in users"
              :key="user.id"
              v-memo="[user.id, user.username, user.email, user.userType, user.status, user.createdAt]"
              class="user-row"
              @click="handleRowClick(user)"
            >
              <td>{{ user.username }}</td>
              <td class="email-cell" :title="user.email">{{ user.email }}</td>
              <td>
                <ElTag :type="getUserTypeConfig(user.userType).tagType" size="small">
                  {{ getUserTypeConfig(user.userType).label }}
                </ElTag>
              </td>
              <td>
                <ElTag :type="getUserStatusConfig(user.status).tagType" size="small">
                  {{ getUserStatusConfig(user.status).label }}
                </ElTag>
              </td>
              <td>{{ formatDate(user.createdAt, 'date') }}</td>
              <td>
                <ElSpace>
                  <ElButton
                    v-if="user.status === 'ACTIVE'"
                    type="warning"
                    size="small"
                    text
                    @click.stop="handleFreeze(user, $event)"
                  >
                    冻结
                  </ElButton>
                  <ElButton
                    v-if="user.status === 'FROZEN'"
                    type="success"
                    size="small"
                    text
                    @click.stop="handleActivate(user, $event)"
                  >
                    激活
                  </ElButton>
                </ElSpace>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 空状态 -->
        <div v-if="users.length === 0" class="empty-state">
          <ElEmpty description="暂无用户数据" />
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <ElPagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </template>
  </ElCard>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.table-card {
  @include card-base;
  border-radius: $radius-lg;

  .error-state {
    @include table-empty-state;
  }

  .pagination-wrapper {
    @include pagination;
    justify-content: flex-end;
    margin-top: $space-4;
  }
}

// ============================================================================
// 自定义表格样式（支持 v-memo 优化）
// ============================================================================

.user-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.user-table-custom {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: $space-3 $space-4;
    text-align: left;
    border-bottom: 1px solid $color-border-subtle;
  }

  thead {
    th {
      background-color: $color-bg-secondary;
      color: $color-text-secondary;
      font-weight: $font-weight-medium;
      white-space: nowrap;
    }
  }

  tbody {
    .user-row {
      cursor: pointer;
      transition: background-color $duration-normal;

      &:hover {
        background-color: $color-bg-hover;
      }

      &:nth-child(even) {
        background-color: $color-bg-tertiary;

        &:hover {
          background-color: $color-bg-hover;
        }
      }
    }

    .email-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.empty-state {
  @include table-empty-state;
  padding: $space-8;
}
</style>
