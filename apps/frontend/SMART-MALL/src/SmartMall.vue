<script setup lang="ts">
/**
 * Smart Mall 根组件
 *
 * 职责：
 * 1. 配置 Element Plus 国际化
 * 2. 提供全局布局容器
 * 3. 渲染路由出口（router-view）
 *
 * AI 助手和设置面板由各 Layout 组件自行集成，不在根组件挂载。
 */

import { onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import { useSettingsStore } from '@/stores'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.initFromStorage()
})
</script>

<template>
  <ElConfigProvider :locale="settingsStore.elementPlusLocale">
    <main class="smart-mall">
      <router-view />
    </main>
  </ElConfigProvider>
</template>

<style scoped lang="scss">
.smart-mall {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>
