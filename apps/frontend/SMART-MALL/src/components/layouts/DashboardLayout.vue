<script setup lang="ts">
/**
 * DashboardLayout - 仪表盘布局组件
 * 提供统一的侧边栏导航和顶部栏布局
 * Gemini 风格 - 专业深色主题
 */
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores'

// ============================================================================
// Props
// ============================================================================

interface Props {
  pageTitle: string
  showBackButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBackButton: false,
})

// ============================================================================
// State
// ============================================================================

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)

// ============================================================================
// Menu Configuration
// ============================================================================

interface MenuItem {
  title: string
  path: string
  roles?: string[]
}

const menuConfig: MenuItem[] = [
  { title: '首页', path: '/mall' },
  // Admin
  { title: '管理中心', path: '/admin/dashboard', roles: ['ADMIN'] },
  { title: '商城管理', path: '/admin/mall', roles: ['ADMIN'] },
  { title: '区域审批', path: '/admin/area-approval', roles: ['ADMIN'] },
  { title: '版本管理', path: '/admin/layout-version', roles: ['ADMIN'] },
  // Merchant
  { title: '工作台', path: '/merchant/dashboard', roles: ['MERCHANT'] },
  { title: '店铺配置', path: '/merchant/store-config', roles: ['MERCHANT'] },
  { title: '区域申请', path: '/merchant/area-apply', roles: ['MERCHANT'] },
  { title: '建模工具', path: '/merchant/builder', roles: ['MERCHANT'] },
  // Common
  { title: '个人中心', path: '/user/profile' },
]

// ============================================================================
// Computed
// ============================================================================

/** 根据用户角色过滤菜单项 */
const filteredMenuItems = computed(() => {
  const userRole = userStore.role
  return menuConfig.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true
    }
    return userRole ? item.roles.includes(userRole) : false
  })
})

/** 角色显示名称 */
const roleDisplayName = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: '管理员',
    MERCHANT: '商家',
    USER: '用户',
  }
  return roleMap[userStore.role || ''] || '用户'
})

/** 检查菜单项是否激活 */
function isMenuActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}

// ============================================================================
// Actions
// ============================================================================

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

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
  <div class="dashboard-layout">
    <!-- 背景装饰 -->
    <div class="layout-bg">
      <div class="bg-gradient"></div>
    </div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <span v-if="!sidebarCollapsed" class="logo-text">Smart Mall</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="sidebarCollapsed" d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            <path v-else d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in filteredMenuItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isMenuActive(item.path) }"
          :title="sidebarCollapsed ? item.title : ''"
          @click="navigateTo(item.path)"
        >
          <span class="nav-text">{{ item.title }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button
          class="nav-item logout"
          :title="sidebarCollapsed ? '退出登录' : ''"
          @click="handleLogout"
        >
          <span class="nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <button v-if="showBackButton" class="back-btn" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <div class="user-info">
            <div class="user-avatar">
              {{ userStore.currentUser?.username?.charAt(0).toUpperCase() }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ userStore.currentUser?.username }}</span>
              <span class="user-role">{{ roleDisplayName }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- 内容区 -->
      <div class="content">
        <slot />
      </div>
    </main>
  </div>
</template>


<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  background: #0a0a0a;
  color: #e8eaed;
  position: relative;
}

.layout-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 50% 30% at 70% 10%, rgba(59, 130, 246, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 30% 90%, rgba(168, 85, 247, 0.03) 0%, transparent 50%);
}

/* ========================================
 * Sidebar
 * ======================================== */
.sidebar {
  width: 220px;
  background: rgba(17, 17, 19, 0.8);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.logo-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #8ab4f8;
  flex-shrink: 0;
}

.logo-icon svg {
  width: 18px;
  height: 18px;
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

.collapse-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #5f6368;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #9aa0a6;
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
}

.sidebar.collapsed .collapse-btn {
  margin-left: auto;
  margin-right: auto;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #9aa0a6;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e8eaed;
}

.nav-item.active {
  background: rgba(138, 180, 248, 0.1);
  color: #8ab4f8;
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .nav-text {
  display: none;
}

.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.nav-item.logout:hover {
  background: rgba(242, 139, 130, 0.1);
  color: #f28b82;
}

/* ========================================
 * Main Content
 * ======================================== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  background: rgba(17, 17, 19, 0.6);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9aa0a6;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e8eaed;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.page-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8eaed;
}

.user-role {
  font-size: 12px;
  color: #9aa0a6;
}

/* ========================================
 * Content Area
 * ======================================== */
.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

/* ========================================
 * Responsive
 * ======================================== */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
}

@media (max-width: 600px) {
  .content {
    padding: 16px;
  }

  .topbar {
    padding: 12px 16px;
  }

  .user-details {
    display: none;
  }
}
</style>
