<script setup lang="ts">
/**
 * PropertyPanel - 右侧属性面板组件
 */
import type { AreaDefinition, AreaType } from '@/builder'
import { areaTypes } from '../config/areaTypes'

interface Props {
  selectedArea: AreaDefinition | null
}

defineProps<Props>()

const emit = defineEmits<{
  updateAreaType: [type: AreaType]
  updateAreaName: [name: string]
  deleteArea: []
}>()

function handleNameInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('updateAreaName', target.value)
}
</script>

<template>
  <aside class="property-panel">
    <div class="panel-header">
      <h3>属性</h3>
    </div>
    
    <div v-if="selectedArea" class="property-content">
      <div class="property-section">
        <label>区域名称</label>
        <input type="text" class="input" :value="selectedArea.name" @input="handleNameInput" />
      </div>

      <div class="property-section">
        <label>区域类型</label>
        <div class="type-grid">
          <button
            v-for="type in areaTypes"
            :key="type.value"
            :class="['type-btn', { active: selectedArea.type === type.value }]"
            :style="{ '--type-color': type.color }"
            @click="emit('updateAreaType', type.value)"
          >
            <span class="type-dot"></span>
            <span>{{ type.label }}</span>
          </button>
        </div>
      </div>

      <div class="property-section">
        <label>面积 / 周长</label>
        <div class="size-info">
          <div class="size-item">
            <span class="size-label">面积</span>
            <span class="size-value">{{ selectedArea.properties.area?.toFixed(1) || '0' }} m²</span>
          </div>
          <div class="size-item">
            <span class="size-label">周长</span>
            <span class="size-value">{{ selectedArea.properties.perimeter?.toFixed(1) || '0' }} m</span>
          </div>
        </div>
      </div>

      <div class="property-actions">
        <button class="btn-danger" @click="emit('deleteArea')">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>删除区域</span>
        </button>
      </div>
    </div>

    <div v-else class="empty-property">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
        <path d="M18 24h12M24 18v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>选择一个区域查看属性</p>
      <p class="hint">或使用绘制工具创建新区域</p>
    </div>
  </aside>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
