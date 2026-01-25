<script setup lang="ts">
/**
 * MaterialPanel - 材质面板组件
 */
import type { MaterialPreset, MaterialCategory } from '@/builder'
import { getAllMaterialPresets, getMaterialPresetsByCategory, getAllCategories, getCategoryDisplayName } from '@/builder'
import { computed } from 'vue'

interface Props {
  selectedMaterialId: string | null
  expandedCategories: MaterialCategory[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectMaterial: [preset: MaterialPreset]
  clearSelection: []
  toggleCategory: [category: MaterialCategory]
}>()

const materialPresets = computed(() => getAllMaterialPresets())
const categories = computed(() => getAllCategories())

function getSelectedMaterial(): MaterialPreset | null {
  if (!props.selectedMaterialId) return null
  return materialPresets.value.find(p => p.id === props.selectedMaterialId) || null
}
</script>

<template>
  <aside class="material-panel">
    <div class="panel-header">
      <h3>材质</h3>
      <button 
        v-if="selectedMaterialId" 
        class="btn-icon clear" 
        @click="emit('clearSelection')" 
        title="清除选择"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    
    <div class="material-content">
      <div v-if="selectedMaterialId" class="selected-material-hint">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>{{ getSelectedMaterial()?.isInfrastructure ? '点击场景放置' : '已选择材质，使用绘制工具放置' }}</span>
      </div>
      
      <div 
        v-for="category in categories" 
        :key="category" 
        class="material-category"
      >
        <button 
          class="category-header" 
          @click="emit('toggleCategory', category)"
        >
          <svg 
            :class="['category-arrow', { expanded: expandedCategories.includes(category) }]" 
            viewBox="0 0 20 20" 
            fill="none"
          >
            <path d="M7 8l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span>{{ getCategoryDisplayName(category) }}</span>
          <span class="category-count">{{ getMaterialPresetsByCategory(category).length }}</span>
        </button>
        
        <div 
          v-if="expandedCategories.includes(category)" 
          class="material-list"
        >
          <button
            v-for="preset in getMaterialPresetsByCategory(category)"
            :key="preset.id"
            :class="['material-item', { active: selectedMaterialId === preset.id }]"
            :style="{ '--material-color': preset.color }"
            @click="emit('selectMaterial', preset)"
          >
            <div class="material-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path :d="preset.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="material-info">
              <span class="material-name">{{ preset.name }}</span>
              <span class="material-desc">{{ preset.description }}</span>
            </div>
            <div class="material-color" :style="{ background: preset.color }"></div>
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
