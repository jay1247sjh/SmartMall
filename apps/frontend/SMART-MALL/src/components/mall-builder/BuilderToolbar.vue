<script setup lang="ts">
/**
 * BuilderToolbar 组件
 *
 * 商城建模器顶部工具栏，包含返回按钮、项目名称、绘制工具、视图控制和操作按钮。
 *
 * 功能：
 * - 返回按钮：返回上一页
 * - 项目名称显示
 * - 绘制工具选择（选择、矩形、多边形、轮廓）
 * - 视图控制（重置相机、漫游模式）
 * - 历史操作（撤销、重做）
 * - 导入导出
 * - 保存项目
 *
 * @example
 * ```vue
 * <BuilderToolbar
 *   :projectName="project.name"
 *   :currentTool="currentTool"
 *   :viewMode="viewMode"
 *   :canUndo="canUndo"
 *   :canRedo="canRedo"
 *   :isSaving="isSaving"
 *   @back="goBack"
 *   @selectTool="handleSelectTool"
 *   @resetOutline="handleResetOutline"
 *   @resetCamera="handleResetCamera"
 *   @toggleOrbitMode="handleToggleOrbitMode"
 *   @undo="handleUndo"
 *   @redo="handleRedo"
 *   @export="handleExport"
 *   @import="handleImport"
 *   @save="handleSave"
 * />
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

/** 绘制工具类型 */
export type DrawingTool = 'select' | 'draw-rect' | 'draw-poly' | 'draw-outline'

/** 工具按钮配置 */
interface ToolButtonConfig {
  tool?: DrawingTool | 'pan'
  title?: string
  icon?: string
  divider?: boolean
  special?: string
  extraCircles?: boolean
}

export interface BuilderToolbarProps {
  /** 项目名称 */
  projectName: string
  /** 当前选中的工具 */
  currentTool: DrawingTool
  /** 视图模式：编辑或漫游 */
  viewMode: 'edit' | 'orbit'
  /** 是否可以撤销 */
  canUndo: boolean
  /** 是否可以重做 */
  canRedo: boolean
  /** 是否正在保存 */
  isSaving: boolean
}

export interface BuilderToolbarEmits {
  (e: 'back'): void
  (e: 'selectTool', tool: DrawingTool): void
  (e: 'resetOutline'): void
  (e: 'resetCamera'): void
  (e: 'toggleOrbitMode'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'export'): void
  (e: 'import', event: Event): void
  (e: 'save'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<BuilderToolbarProps>(), {
  projectName: '商城布局',
  currentTool: 'select',
  viewMode: 'edit',
  canUndo: false,
  canRedo: false,
  isSaving: false,
})

const emit = defineEmits<BuilderToolbarEmits>()

// ============================================================================
// 工具按钮配置
// ============================================================================

const toolButtons: ToolButtonConfig[] = [
  { tool: 'select', title: '选择工具 (V)', icon: 'M4 4l5 14 2-5 5-2L4 4z' },
  { tool: 'pan', title: '平移工具', icon: 'M10 3v14M3 10h14' },
  { divider: true },
  { tool: 'draw-rect', title: '绘制矩形 (R)', icon: 'M3 3h14v14H3z' },
  { tool: 'draw-poly', title: '绘制多边形 (P)', icon: 'M10 2l8 6-3 10H5L2 8l8-6z' },
  { tool: 'draw-outline', title: '绘制商城轮廓', icon: 'M3 3h14v14H3V3z', extraCircles: true },
  { special: 'reset-outline', title: '重置商城轮廓', icon: 'M4 4l12 12M16 4L4 16' },
]

// ============================================================================
// 方法
// ============================================================================

/**
 * 处理返回按钮点击
 */
function handleBack() {
  emit('back')
}

/**
 * 处理工具选择
 */
function handleSelectTool(tool: string) {
  if (tool === 'select' || tool === 'draw-rect' || tool === 'draw-poly' || tool === 'draw-outline') {
    emit('selectTool', tool as DrawingTool)
  }
}

/**
 * 处理重置轮廓
 */
function handleResetOutline() {
  emit('resetOutline')
}

/**
 * 处理重置相机
 */
function handleResetCamera() {
  emit('resetCamera')
}

/**
 * 处理切换漫游模式
 */
function handleToggleOrbitMode() {
  emit('toggleOrbitMode')
}

/**
 * 处理撤销
 */
function handleUndo() {
  emit('undo')
}

/**
 * 处理重做
 */
function handleRedo() {
  emit('redo')
}

/**
 * 处理导出
 */
function handleExport() {
  emit('export')
}

/**
 * 处理导入
 */
function handleImport(event: Event) {
  emit('import', event)
}

/**
 * 处理保存
 */
function handleSave() {
  emit('save')
}

/**
 * 获取漫游按钮文本
 */
function getOrbitButtonText(): string {
  return props.viewMode === 'orbit' ? '退出漫游' : '漫游预览'
}

/**
 * 获取保存按钮文本
 */
function getSaveButtonText(): string {
  return props.isSaving ? '保存中...' : '保存'
}

/**
 * 检查工具是否激活
 */
function isToolActive(tool: string | undefined): boolean {
  return tool === props.currentTool
}
</script>

<template>
  <header class="top-toolbar">
    <!-- 左侧：返回按钮和项目名称 -->
    <div class="toolbar-left">
      <button class="btn-back" @click="handleBack">
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
        <span>{{ projectName }}</span>
      </div>
    </div>

    <!-- 中间：绘制工具 -->
    <div class="toolbar-center">
      <div class="tool-group">
        <template v-for="(btn, index) in toolButtons" :key="index">
          <!-- 分隔线 -->
          <div v-if="btn.divider" class="tool-divider"></div>
          
          <!-- 重置轮廓按钮 -->
          <button 
            v-else-if="btn.special === 'reset-outline'" 
            class="tool-btn reset-outline" 
            :title="btn.title"
            @click="handleResetOutline"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path :d="btn.icon" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
            </svg>
          </button>
          
          <!-- 普通工具按钮 -->
          <button 
            v-else 
            :class="['tool-btn', { active: isToolActive(btn.tool) }]" 
            :title="btn.title"
            @click="btn.tool && handleSelectTool(btn.tool)"
          >
            <svg viewBox="0 0 20 20" fill="none">
              <path :d="btn.icon" stroke="currentColor" stroke-width="1.5"/>
              <rect 
                v-if="btn.tool === 'draw-rect'" 
                x="3" y="3" width="14" height="14" rx="1" 
                stroke="currentColor" stroke-width="1.5"
              />
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

    <!-- 右侧：操作按钮 -->
    <div class="toolbar-right">
      <!-- 重置视图 -->
      <button class="action-btn" title="重置视图" @click="handleResetCamera">
        <svg viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 6v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      
      <!-- 漫游模式 -->
      <button 
        :class="['action-btn', 'preview-btn', { active: viewMode === 'orbit' }]" 
        title="进入漫游模式：WASD移动，鼠标转向"
        @click="handleToggleOrbitMode"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="10" cy="10" r="2" fill="currentColor"/>
        </svg>
        <span class="btn-label">{{ getOrbitButtonText() }}</span>
      </button>
      
      <div class="toolbar-divider"></div>
      
      <!-- 撤销 -->
      <button 
        class="action-btn" 
        :disabled="!canUndo" 
        title="撤销 (Ctrl+Z)"
        @click="handleUndo"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M4 8h10a4 4 0 010 8H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M7 5L4 8l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <!-- 重做 -->
      <button 
        class="action-btn" 
        :disabled="!canRedo" 
        title="重做 (Ctrl+Shift+Z)"
        @click="handleRedo"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M16 8H6a4 4 0 000 8h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M13 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      <div class="toolbar-divider"></div>
      
      <!-- 导出 -->
      <button class="action-btn" title="导出" @click="handleExport">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      
      <!-- 导入 -->
      <label class="action-btn" title="导入">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M10 13V3M6 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input 
          type="file" 
          accept=".json" 
          style="display: none" 
          @change="handleImport"
        />
      </label>
      
      <!-- 保存 -->
      <button 
        class="btn-save" 
        :disabled="isSaving"
        @click="handleSave"
      >
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M15 17H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 3v5h5M7 13h6M7 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>{{ getSaveButtonText() }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 顶部工具栏
// ============================================================================
.top-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: linear-gradient(to bottom, rgba($color-bg-primary, 0.95), rgba($color-bg-primary, 0.85));
  backdrop-filter: blur(8px);
  border-bottom: 1px solid $color-border-subtle;
  @include flex-between;
  padding: 0 $space-4;
  z-index: 100;
}

// ============================================================================
// 工具栏左侧
// ============================================================================
.toolbar-left {
  @include flex-center-y;
  gap: $space-3;
}

.btn-back {
  @include flex-center-y;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: rgba($color-white, 0.05);
  border: 1px solid $color-border-muted;
  border-radius: $radius-md;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba($color-white, 0.1);
    color: $color-text-primary;
  }
}

.project-name {
  @include flex-center-y;
  gap: $space-2;
  padding: $space-2 $space-3;
  color: $color-text-primary;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;

  svg {
    width: 18px;
    height: 18px;
    color: $color-primary;
  }
}

// ============================================================================
// 工具栏中间
// ============================================================================
.toolbar-center {
  @include flex-center;
}

.tool-group {
  @include flex-center-y;
  gap: $space-1;
  padding: $space-1;
  background: rgba($color-white, 0.03);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-lg;
}

.tool-btn {
  @include flex-center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: rgba($color-white, 0.08);
    color: $color-text-primary;
  }

  &.active {
    background: rgba($color-primary, 0.15);
    color: $color-primary;
  }

  &.reset-outline {
    color: $color-warning;

    &:hover {
      background: rgba($color-warning, 0.15);
    }
  }
}

.tool-divider {
  width: 1px;
  height: 24px;
  background: $color-border-muted;
  margin: 0 $space-1;
}

// ============================================================================
// 工具栏右侧
// ============================================================================
.toolbar-right {
  @include flex-center-y;
  gap: $space-2;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: $color-border-muted;
  margin: 0 $space-1;
}

.action-btn {
  @include flex-center;
  width: 36px;
  height: 36px;
  background: rgba($color-white, 0.05);
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled) {
    background: rgba($color-white, 0.1);
    color: $color-text-primary;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.active {
    background: rgba($color-primary, 0.15);
    border-color: rgba($color-primary, 0.3);
    color: $color-primary;
  }
}

.preview-btn {
  width: auto;
  padding: 0 $space-3;
  gap: $space-2;

  .btn-label {
    font-size: $font-size-sm;
  }
}

.btn-save {
  @include flex-center-y;
  gap: $space-2;
  padding: $space-2 $space-4;
  background: $color-primary;
  border: none;
  border-radius: $radius-md;
  color: $color-bg-primary;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
