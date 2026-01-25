<script setup lang="ts">
/**
 * StatusBar - 底部状态栏组件
 */
import type { FloorDefinition } from '@/builder'

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
      <span class="status-item">{{ currentFloor?.areas.length || 0 }} 个区域</span>
    </div>
    <div class="status-center">
      <span class="status-hint">
        <kbd>V</kbd> 选择
        <kbd>R</kbd> 矩形
        <kbd>P</kbd> 多边形
        <kbd>O</kbd> 观察
        <kbd>Del</kbd> 删除
        <kbd>Ctrl+Z</kbd> 撤销
      </span>
    </div>
    <div class="status-right">
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          :checked="snapEnabled" 
          @change="emit('update:snapEnabled', ($event.target as HTMLInputElement).checked)" 
        />
        <span>对齐网格</span>
      </label>
    </div>
  </footer>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
