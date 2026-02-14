<script setup lang="ts">
/**
 * 3D 商城漫游页面
 *
 * 第三人称漫游模式：WASD 移动角色，鼠标控制视角，沉浸式探索商城。
 * 替代原有的轨道相机模式，移除楼层选择器、搜索栏、迷你地图等轨道模式 UI。
 *
 * @validates Requirements 1.1, 4.3, 4.5, 5.1, 5.2, 5.3, 7.5
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMall3DRoaming } from './mall3d'

// ============================================================================
// 状态
// ============================================================================

const router = useRouter()
const containerRef = ref<HTMLElement | null>(null)

const {
  loading,
  error,
  isPointerLocked,
  initScene,
  dispose: disposeScene,
} = useMall3DRoaming({ containerRef })

// ============================================================================
// 方法
// ============================================================================

/** 重新加载（错误恢复） */
function retryInit() {
  disposeScene()
  initScene()
}

/** 返回商城列表 */
function goBack() {
  router.push('/mall')
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  initScene()
})

onUnmounted(() => {
  disposeScene()
})
</script>

<template>
  <div class="mall-3d-roaming">
    <!-- 3D 渲染容器 -->
    <div ref="containerRef" class="scene-container" />

    <!-- 加载界面 -->
    <div v-if="loading.isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner" />
        <div class="loading-text">{{ loading.text }}</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: `${loading.progress}%` }" />
        </div>
        <div class="loading-percent">{{ loading.progress }}%</div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-overlay">
      <div class="error-content">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p class="error-title">{{ error }}</p>
        <div class="error-actions">
          <button class="btn-retry" @click="retryInit">重新加载</button>
          <button class="btn-back" @click="goBack">返回</button>
        </div>
      </div>
    </div>

    <!-- Pointer Lock 提示（场景就绪但未锁定时显示） -->
    <div
      v-if="!loading.isLoading && !error && !isPointerLocked"
      class="pointer-lock-hint"
    >
      <div class="hint-content">
        <p class="hint-title">点击画面开始漫游</p>
        <p class="hint-sub">WASD 移动 · 鼠标控制视角 · ESC 退出</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 基础布局
// ============================================================================
.mall-3d-roaming {
  position: relative;
  width: 100%;
  height: 100vh;
  background: $color-bg-primary;
  overflow: hidden;

  .scene-container {
    width: 100%;
    height: 100%;
  }
}

// ============================================================================
// 加载界面
// ============================================================================
.loading-overlay {
  position: absolute;
  inset: 0;
  background: $color-bg-primary;
  @include flex-center;
  z-index: 100;

  .loading-content {
    @include flex-column;
    align-items: center;
    gap: $space-5;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba($color-primary, 0.2);
    border-top-color: $color-primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: $font-size-base;
    color: $color-text-secondary;
  }

  .loading-bar {
    width: 200px;
    height: 4px;
    background: $color-border-muted;
    border-radius: 2px;
    overflow: hidden;

    .loading-progress {
      height: 100%;
      background: $color-primary;
      @include transition-slow;
    }
  }

  .loading-percent {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ============================================================================
// 错误状态
// ============================================================================
.error-overlay {
  position: absolute;
  inset: 0;
  background: $color-bg-primary;
  @include flex-center;
  z-index: 100;

  .error-content {
    @include flex-column-center;
    gap: $space-5;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    color: $color-text-muted;
  }

  .error-title {
    font-size: $font-size-base;
    color: $color-text-secondary;
    text-align: center;
    max-width: 320px;
    margin: 0;
  }

  .error-actions {
    @include flex-center;
    gap: $space-3;
  }

  .btn-retry {
    @include btn-primary;
    @include btn-sm;
  }

  .btn-back {
    @include btn-secondary;
    @include btn-sm;
  }
}

// ============================================================================
// Pointer Lock 提示
// ============================================================================
.pointer-lock-hint {
  position: absolute;
  inset: 0;
  @include flex-center;
  background: rgba($color-black, 0.4);
  z-index: 5;
  pointer-events: none;
  @include transition-slow;

  .hint-content {
    text-align: center;
  }

  .hint-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
    margin: 0 0 $space-2;
  }

  .hint-sub {
    font-size: $font-size-base;
    color: $color-text-secondary;
    margin: 0;
  }
}
</style>
