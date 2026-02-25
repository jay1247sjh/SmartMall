<script setup lang="ts">
/**
 * FormDialogShell - 统一表单弹窗骨架
 * 保持原生 DOM 结构，避免业务弹窗重复实现 overlay/header/body/footer。
 */
import { onBeforeUnmount, watch } from 'vue'

interface Props {
  visible: boolean
  title: string
  width?: string
  closable?: boolean
  teleportTo?: string
  transitionName?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '520px',
  closable: true,
  teleportTo: 'body',
  transitionName: '',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  close: []
}>()

function closeDialog() {
  if (!props.closable) return
  emit('update:visible', false)
  emit('close')
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeDialog()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDialog()
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener('keydown', handleKeydown)
      return
    }
    document.removeEventListener('keydown', handleKeydown)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport :to="teleportTo">
    <Transition v-if="transitionName" :name="transitionName">
      <div
        v-if="visible"
        class="dialog-overlay"
        @click="handleOverlayClick"
      >
        <div class="dialog-box" :style="{ width }">
          <div class="dialog-header">
            <h3>{{ title }}</h3>
            <button v-if="closable" class="dialog-close" @click="closeDialog">×</button>
          </div>

          <div class="dialog-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="dialog-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-else-if="visible"
      class="dialog-overlay"
      @click="handleOverlayClick"
    >
      <div class="dialog-box" :style="{ width }">
        <div class="dialog-header">
          <h3>{{ title }}</h3>
          <button v-if="closable" class="dialog-close" @click="closeDialog">×</button>
        </div>

        <div class="dialog-body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="dialog-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.dialog-overlay {
  @include dialog-overlay;
}

.dialog-box {
  @include dialog-box;
}

.dialog-header {
  @include dialog-header;
}

.dialog-close {
  @include dialog-close;
}

.dialog-body {
  @include dialog-body;
}

.dialog-footer {
  @include dialog-footer;
}
</style>
