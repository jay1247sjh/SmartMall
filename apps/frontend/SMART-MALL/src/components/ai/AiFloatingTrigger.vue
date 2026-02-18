<script setup lang="ts">
/**
 * ============================================================================
 * AI 悬浮触发按钮 (AiFloatingTrigger)
 * ============================================================================
 *
 * 【组件职责】
 * 提供固定在页面右下角的 FAB 按钮，用于触发 AI 聊天面板。
 * 仅在 Mall3DView 等非管理后台页面使用。
 *
 * 【状态管理】
 * 通过 useAiStore 读取面板可见性、未读状态，并调用 togglePanel。
 * ============================================================================
 */
import { ElBadge, ElIcon } from 'element-plus'
import { Close, ChatDotRound } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAiStore } from '@/stores'

const { t } = useI18n()
const aiStore = useAiStore()

function handleTogglePanel() {
  aiStore.togglePanel()
}
</script>

<template>
  <div class="ai-floating-trigger">
    <ElBadge :is-dot="aiStore.hasUnread" class="ai-badge">
      <button
        class="ai-fab"
        :class="{ active: aiStore.isPanelVisible }"
        :title="t('settings.aiAssistant')"
        @click="handleTogglePanel"
      >
        <ElIcon :size="24">
          <Close v-if="aiStore.isPanelVisible" />
          <ChatDotRound v-else />
        </ElIcon>
      </button>
    </ElBadge>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// Container
// ============================================================================

.ai-floating-trigger {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
}

// ============================================================================
// Badge
// ============================================================================

.ai-badge {
  :deep(.el-badge__content.is-dot) {
    top: 4px;
    right: 4px;
    background: var(--error);
  }
}

// ============================================================================
// FAB Button
// ============================================================================

.ai-fab {
  width: 48px;
  height: 48px;
  border-radius: $radius-full;
  border: none;
  background: var(--accent-primary);
  color: #fff;
  @include flex-center;
  @include clickable;

  &:hover {
    background: var(--accent-hover);
  }

  &.active {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-subtle);
    color: var(--text-primary);
  }
}
</style>
