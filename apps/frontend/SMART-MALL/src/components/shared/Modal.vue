<script setup lang="ts">
/**
 * Modal - 模态框组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElDialog, ElButton, ElSpace } from 'element-plus'

interface Props {
  visible: boolean
  title: string
  width?: string
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '480px',
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
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closable"
    :close-on-press-escape="closable"
    :show-close="closable"
    destroy-on-close
    class="custom-modal"
    @update:model-value="(val: boolean) => emit('update:visible', val)"
    @close="handleClose"
  >
    <article class="modal-body">
      <slot />
    </article>

    <template v-if="$slots.footer" #footer>
      <footer class="modal-footer">
        <ElSpace>
          <slot name="footer" />
        </ElSpace>
      </footer>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.custom-modal {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;

    .el-dialog__header {
      padding: 20px 24px;
      margin-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .el-dialog__title {
        font-size: 18px;
        font-weight: 500;
      }

      .el-dialog__headerbtn {
        top: 20px;
        right: 20px;
        width: 32px;
        height: 32px;

        .el-dialog__close {
          font-size: 18px;
        }
      }
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(80vh - 140px);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
