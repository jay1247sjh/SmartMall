<script setup lang="ts">
/**
 * FloorPanel - 左侧楼层面板组件
 */
import type { MallProject, FloorDefinition } from '@/builder'

interface Props {
  project: MallProject | null
  currentFloorId: string | null
  backgroundImage: {
    src: string
    opacity: number
    scale: number
    x: number
    y: number
    locked: boolean
  } | null
}

defineProps<Props>()

const emit = defineEmits<{
  selectFloor: [floorId: string]
  addFloor: []
  deleteFloor: [floorId: string]
  toggleFloorVisibility: [floorId: string]
  uploadBackgroundImage: [event: Event]
  removeBackgroundImage: []
  'update:backgroundImage': [value: Props['backgroundImage']]
}>()
</script>

<template>
  <aside class="floor-panel">
    <div class="panel-header">
      <h3>楼层</h3>
      <button class="btn-icon" @click="emit('addFloor')" title="添加楼层">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="floor-list">
      <div
        v-for="floor in project?.floors"
        :key="floor.id"
        :class="['floor-item', { active: floor.id === currentFloorId }]"
        @click="emit('selectFloor', floor.id)"
      >
        <div class="floor-info">
          <span class="floor-name">{{ floor.name }}</span>
          <span class="floor-count">{{ floor.areas.length }} 区域</span>
        </div>
        <div class="floor-actions">
          <button class="btn-mini" @click.stop="emit('toggleFloorVisibility', floor.id)" :title="floor.visible ? '隐藏' : '显示'">
            <svg v-if="floor.visible" viewBox="0 0 20 20" fill="none">
              <path d="M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="none">
              <path d="M3 3l14 14M10 4c-2 0-3.5.8-4.8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="btn-mini danger" @click.stop="emit('deleteFloor', floor.id)" :disabled="(project?.floors.length || 0) <= 1" title="删除楼层">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 背景图片控制 -->
    <div class="panel-section">
      <div class="section-header">
        <h4>背景图片</h4>
      </div>
      <div v-if="backgroundImage" class="bg-controls">
        <div class="control-row">
          <label>透明度</label>
          <input 
            type="range" 
            :value="backgroundImage.opacity" 
            @input="emit('update:backgroundImage', { ...backgroundImage, opacity: Number(($event.target as HTMLInputElement).value) })"
            min="0" 
            max="1" 
            step="0.1" 
          />
        </div>
        <div class="control-row">
          <label>缩放</label>
          <input 
            type="range" 
            :value="backgroundImage.scale"
            @input="emit('update:backgroundImage', { ...backgroundImage, scale: Number(($event.target as HTMLInputElement).value) })"
            min="0.1" 
            max="3" 
            step="0.1" 
          />
        </div>
        <button class="btn-small danger" @click="emit('removeBackgroundImage')">移除图片</button>
      </div>
      <label v-else class="upload-btn">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 16l4-4 3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>导入参考图</span>
        <input type="file" accept="image/*" @change="emit('uploadBackgroundImage', $event)" style="display: none" />
      </label>
    </div>
  </aside>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
