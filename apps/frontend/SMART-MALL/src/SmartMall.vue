<script setup lang="ts">
/**
 * Smart Mall 根组件
 * 使用 Element Plus 组件
 */
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <ElConfigProvider :locale="zhCn">
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
