<script setup lang="ts">
/**
 * MallTopBar 组件
 *
 * 3D 商城页面顶部栏，包含返回按钮、搜索框和用户信息。
 *
 * 功能：
 * - 返回按钮：点击返回上一页
 * - 搜索框：支持店铺搜索，显示搜索结果下拉列表
 * - 用户信息：显示当前登录用户名
 *
 * @example
 * ```vue
 * <MallTopBar
 *   :username="userStore.currentUser?.username"
 *   v-model:searchQuery="searchQuery"
 *   :searchResults="searchResults"
 *   :showSearchResults="showSearchResults"
 *   @back="goBack"
 *   @search="handleSearch"
 *   @selectResult="selectSearchResult"
 * />
 * ```
 */

import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ============================================================================
// 类型定义
// ============================================================================

export interface SearchResult {
  id: string
  name: string
  floor: string
  area: string
}

export interface MallTopBarProps {
  /** 当前用户名 */
  username?: string
  /** 搜索查询字符串 */
  searchQuery: string
  /** 搜索结果列表 */
  searchResults: SearchResult[]
  /** 是否显示搜索结果下拉 */
  showSearchResults: boolean
}

export interface MallTopBarEmits {
  (e: 'back'): void
  (e: 'update:searchQuery', value: string): void
  (e: 'search'): void
  (e: 'selectResult', result: SearchResult): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<MallTopBarProps>(), {
  username: '',
  searchQuery: '',
  searchResults: () => [],
  showSearchResults: false,
})

const emit = defineEmits<MallTopBarEmits>()

// ============================================================================
// 方法
// ============================================================================

function handleBack() {
  emit('back')
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
  emit('search')
}

function handleFocus() {
  emit('search')
}

function handleSelectResult(result: SearchResult) {
  emit('selectResult', result)
}
</script>

<template>
  <div class="top-bar">
    <!-- 返回按钮 -->
    <button class="btn-back" @click="handleBack">
      <span>←</span> {{ t('mall3d.back') }}
    </button>

    <!-- 搜索框 -->
    <div class="search-box">
      <input
        :value="searchQuery"
        type="text"
        :placeholder="t('mall3d.searchStore')"
        @input="handleInput"
        @focus="handleFocus"
      />
      <span class="search-icon">🔍</span>
      
      <!-- 搜索结果下拉 -->
      <div 
        v-if="showSearchResults && searchResults && searchResults.length > 0" 
        class="search-results"
      >
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-item"
          @click="handleSelectResult(result)"
        >
          <span class="store-name">{{ result.name }}</span>
          <span class="store-location">{{ result.floor }} · {{ result.area }}</span>
        </div>
      </div>
    </div>

    <!-- 用户信息 -->
    <div class="user-info">{{ username }}</div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 顶部栏
// ============================================================================
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, rgba(var(--bg-primary-rgb), 0.9), transparent);
  @include flex-center-y;
  padding: 0 $space-5;
  gap: $space-5;

  .btn-back {
    @include flex-center-y;
    gap: 6px;
    padding: $space-2 $space-4;
    background: var(--border-muted);
    border: 1px solid var(--border-muted);
    border-radius: $radius-md;
    color: var(--text-primary);
    font-size: $font-size-base;
    @include clickable;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;

    input {
      width: 100%;
      padding: 10px $space-4 10px $space-10;
      background: var(--border-muted);
      border: 1px solid var(--border-muted);
      border-radius: $radius-md;
      color: var(--text-primary);
      font-size: $font-size-base;

      &:focus {
        outline: none;
        border-color: var(--accent-primary);
      }

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: $font-size-base;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: $space-2;
      background: var(--bg-secondary);
      border: 1px solid var(--border-muted);
      border-radius: $radius-md;
      overflow: hidden;
      z-index: 10;

      .search-item {
        @include flex-between;
        padding: $space-3 $space-4;
        @include clickable;
        @include hover-highlight;

        .store-name {
          font-size: $font-size-base;
          color: var(--text-primary);
        }

        .store-location {
          font-size: $font-size-sm;
          color: var(--text-secondary);
        }
      }
    }
  }

  .user-info {
    margin-left: auto;
    font-size: $font-size-base;
    color: var(--text-secondary);
  }
}
</style>
