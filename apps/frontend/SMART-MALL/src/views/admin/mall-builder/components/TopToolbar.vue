<script setup lang="ts">
/**
 * TopToolbar - 顶部工具栏组件
 */
import type { Tool } from '../composables/useDrawing'
import type { MallProject } from '@/builder'
import { toolButtons } from '../config/toolButtons'

interface Props {
  project: MallProject | null
  currentTool: Tool
  viewMode: 'edit' | 'orbit'
  canUndo: boolean
  canRedo: boolean
  isSaving: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  back: []
  setTool: [tool: Tool]
  resetOutline: []
  resetCamera: []
  toggleOrbitMode: []
  undo: []
  redo: []
  export: []
  import: [event: Event]
  save: []
  openProjectList: []
}>()

function handleSetTool(tool: Tool | undefined) {
  if (tool) {
    emit('setTool', tool)
  }
}
</script>

<template>
  <header class="top-toolbar">
    <div class="toolbar-left">
      <button class="btn-back" @click="emit('back')">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>返回</span>
      </button>
      <div class="toolbar-divider"></div>
      <div class="project-name">
        <svg viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <path d="M3 8h14M8 8v9" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>{{ project?.name || '商城布局' }}</span>
      </div>
    </div>

    <div class="toolbar-center">
      <div class="tool-group">
        <template v-for="(btn, index) in toolButtons" :key="index">
          <div v-if="btn.divider" class="tool-divider"></div>
          <button 
            v-else-if="btn.special === 'reset-outline'" 
            class="tool-btn reset-outline" 
            @click="emit('resetOutline')" 
            :title="btn.title"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path :d="btn.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
            </svg>
          </button>
          <button 
            v-else 
            :class="['tool-btn', { active: currentTool === btn.tool }]" 
            @click="handleSetTool(btn.tool)" 
            :title="btn.title"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path :d="btn.icon" stroke="currentColor" stroke-width="1.5" :stroke-linejoin="btn.tool === 'select' || btn.tool === 'draw-poly' ? 'round' : undefined" :stroke-linecap="btn.tool === 'pan' ? 'round' : undefined"/>
              <rect v-if="btn.tool === 'draw-rect'" x="3" y="3" width="14" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
              <path v-if="btn.tool === 'draw-outline'" d="M3 3h14v14H3V3z" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
              <template v-if="btn.extraCircles">
                <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="3" r="1.5" fill="currentColor"/>
                <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
                <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
              </template>
            </svg>
          </button>
        </template>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="action-btn" @click="emit('resetCamera')" title="重置视图">
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <button 
        :class="['action-btn preview-btn', { active: viewMode === 'orbit' }]" 
        @click="emit('toggleOrbitMode')" 
        :title="'进入漫游模式：WASD移动，鼠标转向'"
        :disabled="viewMode === 'orbit'"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="10" cy="10" r="2" fill="currentColor"/>
          <path d="M10 5v2M10 13v2M5 10h2M13 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span class="btn-label">漫游预览</span>
      </button>
      <div class="toolbar-divider"></div>
      <button class="action-btn" @click="emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 8h10a4 4 0 010 8H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M7 5L4 8l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="action-btn" @click="emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Shift+Z)">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M16 8H6a4 4 0 000 8h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M13 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="toolbar-divider"></div>
      <button class="action-btn" @click="emit('export')" title="导出">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <label class="action-btn" title="导入">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 13V3M6 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="file" accept=".json" @change="emit('import', $event)" style="display: none" />
      </label>
      <button class="btn-save" @click="emit('save')" :disabled="isSaving">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M15 17H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 3v5h5M7 13h6M7 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>{{ isSaving ? '保存中...' : '保存' }}</span>
      </button>
      <button class="action-btn" @click="emit('openProjectList')" title="打开项目">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M3 5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
