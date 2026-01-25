<script setup lang="ts">
/**
 * BuilderModal - Mall Builder 专用模态框组件
 * 统一的模态框样式，支持自定义内容
 */
interface Props {
  visible: boolean
  title: string
  width?: string
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '400px',
  closable: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
}>()

function handleClose() {
  if (props.closable) {
    emit('update:visible', false)
    emit('close')
  }
}

function handleOverlayClick() {
  if (props.closable) {
    handleClose()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal" :style="{ width }">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button v-if="closable" class="btn-close" @click="handleClose">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.modal-overlay {
  @include dialog-overlay;
  backdrop-filter: blur(4px);
}

.modal {
  @include dialog-box;
  border: 1px solid $color-border-muted;
  box-shadow: $shadow-lg;
  border-radius: $radius-xl;

  &-header {
    @include dialog-header;
    border-bottom-color: $color-border-muted;
  }

  &-body {
    @include dialog-body;
    flex: 1;
  }

  &-footer {
    @include dialog-footer;
    border-top-color: $color-border-muted;
  }
}

.btn-close {
  @include dialog-close;
  width: 32px;
  height: 32px;
  border-radius: $radius-md;

  &:hover {
    background: $color-bg-hover;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity $duration-normal $ease-default;

  .modal {
    transition: transform $duration-normal $ease-default;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: scale(0.95) translateY(-10px);
  }
}
</style>
