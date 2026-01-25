<script setup lang="ts">
/**
 * StorePanel 组件
 *
 * 3D 商城页面店铺详情面板，显示选中店铺的详细信息。
 *
 * 功能：
 * - 显示店铺名称：面板标题显示店铺名称
 * - 显示店铺详情：位置、分类、营业时间等信息
 * - 关闭面板：点击关闭按钮隐藏面板
 * - 进入店铺：点击按钮进入店铺详情页
 *
 * @example
 * ```vue
 * <StorePanel
 *   :visible="showStorePanel"
 *   :store="selectedStore"
 *   @close="closeStorePanel"
 *   @enter="enterStore"
 * />
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface StoreDetail {
  /** 店铺 ID */
  id: string
  /** 店铺名称 */
  name: string
  /** 所在楼层 */
  floor?: string
  /** 所在区域 */
  area?: string
  /** 店铺分类 */
  category?: string
  /** 开店时间 */
  openTime?: string
  /** 关店时间 */
  closeTime?: string
}

export interface StorePanelProps {
  /** 是否显示面板 */
  visible: boolean
  /** 店铺详情数据 */
  store: StoreDetail | null
}

export interface StorePanelEmits {
  (e: 'close'): void
  (e: 'enter'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<StorePanelProps>(), {
  visible: false,
  store: null,
})

const emit = defineEmits<StorePanelEmits>()

// ============================================================================
// 计算属性
// ============================================================================

/**
 * 获取店铺位置显示文本
 */
function getLocationText(): string {
  if (!props.store) return ''
  const parts = [props.store.floor, props.store.area].filter(Boolean)
  return parts.join(' · ')
}

/**
 * 获取营业时间显示文本
 */
function getBusinessHours(): string {
  if (!props.store) return ''
  const { openTime, closeTime } = props.store
  if (openTime && closeTime) {
    return `${openTime} - ${closeTime}`
  }
  if (openTime) return `${openTime} 起`
  if (closeTime) return `至 ${closeTime}`
  return '暂无信息'
}

// ============================================================================
// 方法
// ============================================================================

/**
 * 关闭面板
 */
function handleClose() {
  emit('close')
}

/**
 * 进入店铺
 */
function handleEnter() {
  emit('enter')
}
</script>

<template>
  <div v-if="visible && store" class="store-panel">
    <!-- 面板头部 -->
    <div class="panel-header">
      <h3>{{ store.name }}</h3>
      <button class="btn-close" @click="handleClose">×</button>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <!-- 位置信息 -->
      <div v-if="getLocationText()" class="info-row">
        <label>位置</label>
        <span>{{ getLocationText() }}</span>
      </div>

      <!-- 分类信息 -->
      <div v-if="store.category" class="info-row">
        <label>分类</label>
        <span>{{ store.category }}</span>
      </div>

      <!-- 营业时间 -->
      <div class="info-row">
        <label>营业时间</label>
        <span>{{ getBusinessHours() }}</span>
      </div>
    </div>

    <!-- 面板操作 -->
    <div class="panel-actions">
      <button class="btn-primary" @click="handleEnter">进入店铺</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 扩展变量（全局变量中没有的）
$bg-panel-solid: rgba($color-bg-secondary, 0.95);

// ============================================================================
// 店铺面板
// ============================================================================
.store-panel {
  position: absolute;
  right: $space-5;
  top: 80px;
  width: 280px;
  background: $bg-panel-solid;
  border: 1px solid $color-border-muted;
  border-radius: $radius-lg;
  overflow: hidden;

  .panel-header {
    @include flex-between;
    padding: $space-4 $space-5;
    border-bottom: 1px solid $color-border-subtle;

    h3 {
      font-size: 16px;
      font-weight: $font-weight-semibold;
      color: $color-text-primary;
      margin: 0;
    }

    .btn-close {
      width: 24px;
      height: 24px;
      background: transparent;
      border: none;
      color: $color-text-secondary;
      font-size: 18px;
      @include flex-center;
      @include clickable;

      &:hover {
        color: $color-text-primary;
      }
    }
  }

  .panel-content {
    padding: $space-4 $space-5;
    @include flex-column;
    gap: 14px;

    .info-row {
      @include flex-between;

      label {
        font-size: 13px;
        color: $color-text-secondary;
      }

      span {
        font-size: $font-size-base;
        color: $color-text-primary;
      }
    }
  }

  .panel-actions {
    padding: $space-4 $space-5;
    border-top: 1px solid $color-border-subtle;

    .btn-primary {
      width: 100%;
      padding: $space-3;
      background: $color-primary;
      border: none;
      border-radius: $radius-md;
      color: $color-bg-primary;
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      @include clickable;

      &:hover {
        background: $color-primary-hover;
      }
    }
  }
}
</style>
