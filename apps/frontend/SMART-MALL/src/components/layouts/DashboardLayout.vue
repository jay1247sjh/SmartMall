<script setup lang="ts">
/**
 * DashboardLayout - 仪表盘布局组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'
import {
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElButton,
  ElAvatar,
  ElIcon,
  ElTooltip,
} from 'element-plus'
import {
  House,
  Setting,
  Shop,
  Document,
  Timer,
  Goods,
  Edit,
  Tools,
  User,
  SwitchButton,
  ArrowLeft,
  ArrowRight,
  Back,
} from '@element-plus/icons-vue'

interface Props {
  pageTitle: string
  showBackButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showBackButton: false,
})

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)

interface MenuItem {
  title: string
  path: string
  icon: typeof House
  roles?: string[]
}

const menuConfig: MenuItem[] = [
  { title: '返回商城', path: '/mall', icon: House },
  { title: '管理中心', path: '/admin/dashboard', icon: Setting, roles: ['ADMIN'] },
  { title: '商城管理', path: '/admin/mall', icon: Shop, roles: ['ADMIN'] },
  { title: '区域审批', path: '/admin/area-approval', icon: Document, roles: ['ADMIN'] },
  { title: '版本管理', path: '/admin/layout-version', icon: Timer, roles: ['ADMIN'] },
  { title: '工作台', path: '/merchant/dashboard', icon: Goods, roles: ['MERCHANT'] },
  { title: '店铺配置', path: '/merchant/store-config', icon: Edit, roles: ['MERCHANT'] },
  { title: '区域申请', path: '/merchant/area-apply', icon: Document, roles: ['MERCHANT'] },
  { title: '建模工具', path: '/merchant/builder', icon: Tools, roles: ['MERCHANT'] },
  { title: '个人中心', path: '/user/profile', icon: User },
]

const filteredMenuItems = computed(() => {
  const userRole = userStore.role
  return menuConfig.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return userRole ? item.roles.includes(userRole) : false
  })
})

const roleDisplayName = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: '管理员',
    MERCHANT: '商家',
    USER: '用户',
  }
  return roleMap[userStore.role || ''] || '用户'
})

const avatarLetter = computed(() => 
  userStore.currentUser?.username?.charAt(0).toUpperCase() || 'U'
)

function navigateTo(path: string) {
  router.push(path)
}

function goBack() {
  router.back()
}

function handleLogout() {
  userStore.clearUser()
  router.push('/login')
}
</script>

<template>
  <ElContainer class="dashboard-layout">
    <!-- 侧边栏 -->
    <ElAside :width="sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <header class="sidebar-header">
        <div class="logo" @click="navigateTo('/mall')">
          <ElAvatar :size="36" class="logo-icon">
            <span>S</span>
          </ElAvatar>
          <span v-show="!sidebarCollapsed" class="logo-text">Smart Mall</span>
        </div>
        <ElButton
          :icon="sidebarCollapsed ? ArrowRight : ArrowLeft"
          circle
          size="small"
          class="collapse-btn"
          @click="sidebarCollapsed = !sidebarCollapsed"
        />
      </header>

      <nav class="sidebar-nav">
        <ElMenu
          :default-active="route.path"
          :collapse="sidebarCollapsed"
          :collapse-transition="false"
          background-color="transparent"
          text-color="#9aa0a6"
          active-text-color="#8ab4f8"
        >
          <ElTooltip
            v-for="item in filteredMenuItems"
            :key="item.path"
            :content="item.title"
            :disabled="!sidebarCollapsed"
            placement="right"
          >
            <ElMenuItem :index="item.path" @click="navigateTo(item.path)">
              <ElIcon><component :is="item.icon" /></ElIcon>
              <template #title>{{ item.title }}</template>
            </ElMenuItem>
          </ElTooltip>
        </ElMenu>
      </nav>

      <footer class="sidebar-footer">
        <ElTooltip content="退出登录" :disabled="!sidebarCollapsed" placement="right">
          <ElButton
            type="danger"
            :text="!sidebarCollapsed"
            :icon="SwitchButton"
            class="logout-btn"
            @click="handleLogout"
          >
            <span v-show="!sidebarCollapsed">退出登录</span>
          </ElButton>
        </ElTooltip>
      </footer>
    </ElAside>

    <!-- 主内容区 -->
    <ElContainer direction="vertical" class="main-container">
      <ElHeader class="topbar" height="64px">
        <div class="topbar-left">
          <ElButton
            v-if="showBackButton"
            :icon="Back"
            circle
            @click="goBack"
          />
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        
        <div class="topbar-right">
          <ElAvatar :size="36" class="user-avatar">
            {{ avatarLetter }}
          </ElAvatar>
          <div class="user-details">
            <strong class="user-name">{{ userStore.currentUser?.username }}</strong>
            <small class="user-role">{{ roleDisplayName }}</small>
          </div>
        </div>
      </ElHeader>

      <ElMain class="content">
        <slot />
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
.dashboard-layout {
  min-height: 100vh;
  background: #0a0a0a;
  color: #e8eaed;
  position: relative;

  // 背景装饰
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
  }
}

.sidebar {
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  transition: width 0.2s;
  position: relative;
  z-index: 10;

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 4px;
      border-radius: 8px;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .logo-icon {
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }

      .logo-text {
        font-size: 15px;
        font-weight: 600;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        white-space: nowrap;
      }
    }

    .collapse-btn {
      flex-shrink: 0;
      color: #9aa0a6;
      border-color: rgba(255, 255, 255, 0.1);
      background: transparent;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #e8eaed;
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    :deep(.el-menu) {
      border-right: none;
      background: transparent;
    }

    :deep(.el-menu-item) {
      border-radius: 8px;
      margin-bottom: 4px;
      color: #9aa0a6;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #e8eaed;
      }

      &.is-active {
        background: rgba(138, 180, 248, 0.1);
        color: #8ab4f8;
      }
    }
  }

  .sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);

    .logout-btn {
      width: 100%;
      justify-content: flex-start;
    }
  }
}

.main-container {
  min-width: 0;
  position: relative;
  z-index: 1;

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    background: rgba(17, 17, 19, 0.6);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .page-title {
        font-size: 18px;
        font-weight: 500;
        margin: 0;
        color: #e8eaed;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-avatar {
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #8ab4f8;
        font-weight: 600;
      }

      .user-details {
        display: flex;
        flex-direction: column;

        .user-name {
          font-size: 14px;
          color: #e8eaed;
        }

        .user-role {
          font-size: 12px;
          color: #9aa0a6;
        }
      }
    }
  }

  .content {
    padding: 24px;
    overflow-y: auto;
  }
}

@media (max-width: 768px) {
  .main-container {
    .topbar {
      .topbar-right {
        .user-details {
          display: none;
        }
      }
    }

    .content {
      padding: 16px;
    }
  }
}
</style>
