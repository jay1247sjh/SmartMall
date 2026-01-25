<script setup lang="ts">
/**
 * 确认弹窗组件
 * 带有理由输入的确认弹窗
 */
import { ref, computed } from 'vue'
import Modal from './Modal.vue'

const props = defineProps<{
  visible: boolean
  title: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'danger' | 'warning'
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  processing?: boolean
  width?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [reason: string]
  cancel: []
}>()

const reason = ref('')

const canConfirm = computed(() => {
  if (props.requireReason) {
    return reason.value.trim().length > 0
  }
  return true
})

function handleConfirm() {
  emit('confirm', reason.value)
}

function handleCancel() {
  reason.value = ''
  emit('cancel')
  emit('update:visible', false)
}

function handleClose() {
  reason.value = ''
  emit('update:visible', false)
}
</script>

<template>
  <Modal
    :visible="visible"
    :title="title"
    :width="width || '400px'"
    @update:visible="handleClose"
  >
    <div class="confirm-content">
      <slot />
      
      <div v-if="requireReason" class="reason-form">
        <label>{{ reasonLabel || '请填写理由' }} <span class="required">*</span></label>
        <textarea
          v-model="reason"
          class="textarea"
          rows="4"
          :placeholder="reasonPlaceholder || '请输入...'"
        />
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleCancel">
        {{ cancelText || '取消' }}
      </button>
      <button
        :class="['btn', `btn-${confirmVariant || 'primary'}`]"
        :disabled="!canConfirm || processing"
        @click="handleConfirm"
      >
        {{ processing ? '处理中...' : (confirmText || '确认') }}
      </button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.reason-form {
  @include form-item;

  .required {
    color: $color-error;
  }

  .textarea {
    @include form-textarea;
  }
}

.btn {
  @include btn-base;
  padding: $space-2 + 2 $space-5;

  &-secondary {
    @include btn-secondary;
  }

  &-primary {
    @include btn-primary;
  }

  &-danger {
    @include btn-danger;
  }

  &-warning {
    background: $color-warning;
    color: $color-bg-primary;

    &:hover:not(:disabled) {
      background: $color-warning-hover;
    }
  }
}
</style>
