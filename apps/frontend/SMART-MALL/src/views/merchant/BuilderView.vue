<script setup lang="ts">
/**
 * 商家建模工具页面
 * 商家只能编辑自己授权的区域
 */
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores'

const { t } = useI18n()
const userStore = useUserStore()
</script>

<template>
  <article class="builder-view">
    <header class="builder-header">
      <h2>{{ t('merchant.builder.title') }}</h2>
    </header>

    <section class="info-card">
      <h3>{{ t('merchant.builder.authorizedAreas') }}</h3>
      <ul v-if="userStore.authorizedAreaIds.length" class="area-list">
        <li v-for="areaId in userStore.authorizedAreaIds" :key="areaId" class="area-item">
          <span class="area-icon">📍</span>
          <span class="area-id">{{ areaId }}</span>
        </li>
      </ul>
      <p v-else class="empty">{{ t('merchant.builder.noAuthorizedAreas') }}</p>
    </section>

    <section class="placeholder-card">
      <span class="placeholder-icon">🏗️</span>
      <p class="placeholder-text">{{ t('merchant.builder.inDevelopment') }}</p>
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
    color: var(--text-primary);
  }
}

.info-card {
  @include card-base;
  padding: $space-5;

  h3 {
    margin: 0 0 $space-4 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    color: var(--text-primary);
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
  background: rgba(var(--text-primary-rgb), 0.04);
  border-radius: $radius-md;
  transition: background $duration-normal $ease-default;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .area-icon {
    font-size: $font-size-base;
  }

  .area-id {
    font-size: $font-size-base;
    color: var(--text-primary);
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
  background: var(--bg-secondary);
  border: 1px dashed var(--border-muted);
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
