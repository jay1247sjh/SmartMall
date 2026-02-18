<script setup lang="ts">
/**
 * StatusBar - 底部状态栏组件
 */
import type { FloorDefinition } from '@/builder'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  currentFloor: FloorDefinition | null
  snapEnabled: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:snapEnabled': [value: boolean]
}>()
</script>

<template>
  <footer class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        {{ currentFloor?.name || '-' }}
      </span>
      <span class="status-divider"></span>
      <span class="status-item">{{ currentFloor?.areas.length || 0 }} {{ t('builder.areas') }}</span>
    </div>
    <div class="status-center">
      <span class="status-hint">
        <kbd>V</kbd> {{ t('builder.selectTool') }}
        <kbd>R</kbd> {{ t('builder.rectTool') }}
        <kbd>P</kbd> {{ t('builder.polygonTool') }}
        <kbd>O</kbd> {{ t('builder.observeTool') }}
        <kbd>Del</kbd> {{ t('builder.deleteTool') }}
        <kbd>Ctrl+Z</kbd> {{ t('builder.undoTool') }}
      </span>
    </div>
    <div class="status-right">
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          :checked="snapEnabled" 
          @change="emit('update:snapEnabled', ($event.target as HTMLInputElement).checked)" 
        />
        <span>{{ t('builder.snapToGrid') }}</span>
      </label>
    </div>
  </footer>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
