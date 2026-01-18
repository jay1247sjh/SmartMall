<!--
  BuilderEngine Vue 3 使用示例
  
  这个示例展示了如何在 Vue 3 组件中使用 BuilderEngine
-->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { BuilderEngine, createEmptyProject, type MallProject } from '@/builder'

// ============================================================================
// 状态
// ============================================================================

const containerRef = ref<HTMLElement | null>(null)
let engine: BuilderEngine | null = null

const project = ref<MallProject | null>(null)
const currentTool = ref<string>('select')
const canUndo = ref(false)
const canRedo = ref(false)

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  if (!containerRef.value) return

  // 创建项目
  const initialProject = createEmptyProject('示例商城')
  project.value = initialProject

  // 创建引擎
  engine = new BuilderEngine(containerRef.value, initialProject, {
    snapToGrid: true,
    gridSize: 1,
    enableCollisionDetection: true,
  })

  // 监听事件
  setupEventListeners()

  // 启动引擎
  engine.start()

  console.log('[Example] BuilderEngine initialized')
})

onUnmounted(() => {
  if (engine) {
    engine.dispose()
    engine = null
    console.log('[Example] BuilderEngine disposed')
  }
})

// ============================================================================
// 事件监听
// ============================================================================

function setupEventListeners() {
  if (!engine) return

  // 项目变更
  engine.on('project-changed', (updatedProject) => {
    project.value = updatedProject
    console.log('[Example] Project changed:', updatedProject.name)
  })

  // 工具变更
  engine.on('tool-changed', (tool) => {
    currentTool.value = tool
    console.log('[Example] Tool changed:', tool)
  })

  // 历史记录变更
  engine.on('history-changed', () => {
    canUndo.value = engine?.canUndo() ?? false
    canRedo.value = engine?.canRedo() ?? false
    console.log('[Example] History changed')
  })

  // 区域选中
  engine.on('area-selected', (area) => {
    console.log('[Example] Area selected:', area)
  })

  // 错误
  engine.on('error', (error) => {
    console.error('[Example] Error:', error)
  })
}

// ============================================================================
// 工具栏操作
// ============================================================================

function setTool(tool: string) {
  engine?.setTool(tool as any)
}

function undo() {
  if (engine?.canUndo()) {
    engine.undo()
  }
}

function redo() {
  if (engine?.canRedo()) {
    engine.redo()
  }
}

function exportProject() {
  if (!engine) return
  
  const json = engine.exportProject()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value?.name || 'project'}.json`
  a.click()
  
  URL.revokeObjectURL(url)
  console.log('[Example] Project exported')
}

function importProject() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file || !engine) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        engine?.importProject(json)
        console.log('[Example] Project imported')
      } catch (error) {
        console.error('[Example] Import failed:', error)
      }
    }
    reader.readAsText(file)
  }
  
  input.click()
}

// ============================================================================
// 计算属性
// ============================================================================

const projectInfo = computed(() => {
  if (!project.value) return null
  
  return {
    name: project.value.name,
    floors: project.value.floors.length,
    areas: project.value.floors.reduce((sum, floor) => sum + floor.areas.length, 0),
  }
})
</script>

<template>
  <div class="builder-example">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-section">
        <h3>工具</h3>
        <button 
          :class="{ active: currentTool === 'select' }"
          @click="setTool('select')"
        >
          选择
        </button>
        <button 
          :class="{ active: currentTool === 'pan' }"
          @click="setTool('pan')"
        >
          平移
        </button>
        <button 
          :class="{ active: currentTool === 'draw-rect' }"
          @click="setTool('draw-rect')"
        >
          绘制矩形
        </button>
        <button 
          :class="{ active: currentTool === 'draw-poly' }"
          @click="setTool('draw-poly')"
        >
          绘制多边形
        </button>
      </div>

      <div class="toolbar-section">
        <h3>历史</h3>
        <button :disabled="!canUndo" @click="undo">
          撤销
        </button>
        <button :disabled="!canRedo" @click="redo">
          重做
        </button>
      </div>

      <div class="toolbar-section">
        <h3>文件</h3>
        <button @click="exportProject">
          导出
        </button>
        <button @click="importProject">
          导入
        </button>
      </div>

      <div class="toolbar-section" v-if="projectInfo">
        <h3>项目信息</h3>
        <div class="info">
          <div>名称: {{ projectInfo.name }}</div>
          <div>楼层: {{ projectInfo.floors }}</div>
          <div>区域: {{ projectInfo.areas }}</div>
        </div>
      </div>
    </div>

    <!-- 3D 画布容器 -->
    <div ref="containerRef" class="canvas-container"></div>
  </div>
</template>

<style scoped lang="scss">
.builder-example {
  display: flex;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
}

.toolbar {
  width: 250px;
  background: #2a2a2a;
  padding: 20px;
  overflow-y: auto;
  color: #fff;

  .toolbar-section {
    margin-bottom: 30px;

    h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #888;
      text-transform: uppercase;
    }

    button {
      display: block;
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      background: #3a3a3a;
      border: 1px solid #4a4a4a;
      color: #fff;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #4a4a4a;
        border-color: #5a5a5a;
      }

      &.active {
        background: #4a90d9;
        border-color: #5aa0e9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .info {
      font-size: 13px;
      line-height: 1.8;
      color: #ccc;

      div {
        padding: 4px 0;
      }
    }
  }
}

.canvas-container {
  flex: 1;
  position: relative;
}
</style>
