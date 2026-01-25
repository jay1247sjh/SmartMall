<script setup lang="ts">
/**
 * ============================================================================
 * Smart Mall 根组件 (SmartMall.vue)
 * ============================================================================
 * 
 * 【组件职责】
 * 这是整个应用的根组件，负责：
 * 1. 配置 Element Plus 国际化（中文）
 * 2. 提供全局布局容器
 * 3. 渲染路由出口（router-view）
 * 4. 提供全局 AI 助手「小智」
 * 
 * 【组件层级】
 * SmartMall.vue (根组件)
 *   └── ElConfigProvider (Element Plus 配置)
 *         ├── router-view (路由出口)
 *         │     └── 各个页面组件 (LoginView, MallView, etc.)
 *         └── GlobalAiAssistant (全局 AI 助手)
 * 
 * 【为什么需要 ElConfigProvider？】
 * Element Plus 默认是英文界面，需要通过 ElConfigProvider 配置中文：
 * - 日期选择器的"确定"、"取消"按钮
 * - 分页组件的"共 X 条"
 * - 表格的"暂无数据"
 * - 等等...
 * 
 * 【设计决策】
 * - 使用 <main> 语义化标签作为容器
 * - 全屏布局（100vw x 100vh）
 * - overflow: hidden 防止出现滚动条
 * - 全局 AI 助手在所有页面可用
 * 
 * ============================================================================
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import GlobalAiAssistant from '@/components/ai/GlobalAiAssistant.vue'

const route = useRoute()

/**
 * 是否显示全局 AI 助手
 * 
 * 【逻辑说明】
 * - 登录、注册、忘记密码等认证页面不显示
 * - 其他所有页面都显示
 */
const showAiAssistant = computed(() => {
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
  return !authPages.includes(route.path)
})
</script>

<template>
  <!--
    ============================================================================
    Element Plus 全局配置
    ============================================================================
    
    ElConfigProvider 用于配置 Element Plus 的全局选项：
    - locale: 国际化语言包（这里使用中文）
    - size: 组件默认尺寸（可选：large/default/small）
    - zIndex: 弹出层的 z-index 基准值
    - button: 按钮的全局配置
    
    所有子组件都会继承这些配置
  -->
  <ElConfigProvider :locale="zhCn">
    <!--
      ============================================================================
      应用主容器
      ============================================================================
      
      使用 HTML5 语义化标签 <main>：
      - 表示页面的主要内容区域
      - 有助于屏幕阅读器识别
      - 符合无障碍访问标准
      
      class="smart-mall" 用于应用全局样式
    -->
    <main class="smart-mall">
      <!--
        ============================================================================
        路由出口
        ============================================================================
        
        router-view 是 Vue Router 的核心组件：
        - 根据当前 URL 渲染对应的页面组件
        - 当 URL 变化时，自动切换显示的组件
        
        【路由匹配示例】
        - /login → LoginView.vue
        - /mall → MallView.vue
        - /admin/dashboard → AdminLayout.vue → DashboardView.vue
        - /merchant/store-config → MerchantLayout.vue → StoreConfigView.vue
      -->
      <router-view />
      
      <!--
        ============================================================================
        全局 AI 助手「小智」
        ============================================================================
        
        在所有页面（除认证页面外）显示的 AI 助手：
        - 悬浮按钮在右下角
        - 点击展开聊天面板
        - 支持意图识别和页面导航
      -->
      <GlobalAiAssistant v-if="showAiAssistant" />
    </main>
  </ElConfigProvider>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

/**
 * ============================================================================
 * 根组件样式
 * ============================================================================
 * 
 * 【设计目标】
 * 创建一个全屏容器，作为所有页面的基础布局
 * 
 * 【样式说明】
 * - width: 100vw - 视口宽度（viewport width）
 * - height: 100vh - 视口高度（viewport height）
 * - position: relative - 为子元素的绝对定位提供参考
 * - overflow: hidden - 隐藏溢出内容，防止出现滚动条
 * 
 * 【为什么用 vw/vh 而不是 100%？】
 * - 100% 是相对于父元素的尺寸
 * - 100vw/100vh 是相对于视口的尺寸
 * - 使用 vw/vh 可以确保容器始终占满整个屏幕
 */
.smart-mall {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>
