<script setup lang="ts">
/**
 * 商家建模工具页面
 * 商家只能编辑自己授权的区域
 */
import { useUserStore } from '@/stores'

const userStore = useUserStore()
</script>

<template>
  <article class="builder-view">
    <header class="builder-header">
      <h2>建模工具</h2>
    </header>

    <section class="info-card">
      <h3>您已授权的区域</h3>
      <ul v-if="userStore.authorizedAreaIds.length" class="area-list">
        <li v-for="areaId in userStore.authorizedAreaIds" :key="areaId" class="area-item">
          <span class="area-icon">📍</span>
          <span class="area-id">{{ areaId }}</span>
        </li>
      </ul>
      <p v-else class="empty">暂无授权区域，请先申请</p>
    </section>

    <section class="placeholder-card">
      <span class="placeholder-icon">🏗️</span>
      <p class="placeholder-text">3D 建模工具开发中...</p>
    </section>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.builder-view {
  display: flex;
  flex-direction: column;
  gap: $space-5;
  padding: $space-6;
  height: 100%;
}

.builder-header {
  h2 {
    margin: 0;
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }
}

.info-card {
  @include card-base;
  padding: $space-5;

  h3 {
    margin: 0 0 $space-4 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }
}

.area-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.area-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: $color-bg-hover;
  border-radius: $radius-md;
  transition: background $duration-normal $ease-default;

  &:hover {
    background: rgba($color-white, 0.06);
  }

  .area-icon {
    font-size: $font-size-base;
  }

  .area-id {
    font-size: $font-size-base;
    color: $color-text-primary;
    font-family: monospace;
  }
}

.empty {
  margin: 0;
  @include text-muted;
  font-size: $font-size-base;
}

.placeholder-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $space-4;
  background: $color-bg-secondary;
  border: 1px dashed $color-border-muted;
  border-radius: $radius-lg;
  min-height: 200px;

  .placeholder-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  .placeholder-text {
    margin: 0;
    @include text-muted;
    font-size: $font-size-lg;
  }
}
</style>
