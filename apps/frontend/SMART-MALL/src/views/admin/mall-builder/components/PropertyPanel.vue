<script setup lang="ts">
/**
 * PropertyPanel - 右侧属性面板组件
 */
import type { AreaDefinition, AreaType } from '@/builder'
import { areaTypes } from '../config/areaTypes'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
      <h3>{{ t('builder.properties') }}</h3>
    </div>
    
    <div v-if="selectedArea" class="property-content">
      <div class="property-section">
        <label>{{ t('builder.areaName') }}</label>
        <input type="text" class="input" :value="selectedArea.name" @input="handleNameInput" />
      </div>

      <div class="property-section">
        <label>{{ t('builder.areaType') }}</label>
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
        <label>{{ t('builder.areaPerimeter') }}</label>
        <div class="size-info">
          <div class="size-item">
            <span class="size-label">{{ t('builder.area') }}</span>
            <span class="size-value">{{ selectedArea.properties.area?.toFixed(1) || '0' }} m²</span>
          </div>
          <div class="size-item">
            <span class="size-label">{{ t('builder.perimeter') }}</span>
            <span class="size-value">{{ selectedArea.properties.perimeter?.toFixed(1) || '0' }} m</span>
          </div>
        </div>
      </div>

      <div class="property-actions">
        <button class="btn-danger" @click="emit('deleteArea')">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ t('builder.deleteArea') }}</span>
        </button>
      </div>
    </div>

    <div v-else class="empty-property">
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
        <path d="M18 24h12M24 18v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>{{ t('builder.selectAreaHint') }}</p>
      <p class="hint">{{ t('builder.drawAreaHint') }}</p>
    </div>
  </aside>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
