<script setup lang="ts">
/**
 * AddFloorDialog 组件
 *
 * 独立的添加楼层弹窗组件，包含表单输入、校验和 2D 布局预览。
 *
 * 功能：
 * - 楼层基础信息表单：名称、编号、高度、布局描述
 * - 表单校验：名称非空、编号不重复
 * - 2D 布局预览画布（Canvas 2D 渲染楼层轮廓）
 * - 深色主题，遵循前端样式指南
 *
 * @example
 * ```vue
 * <AddFloorDialog
 *   v-model:visible="showDialog"
 *   :existingLevels="existingLevels"
 *   @created="handleFloorCreated"
 * />
 * ```
 */
import { ref, reactive, watch, nextTick, computed } from 'vue'
import axios from 'axios'

// ============================================================================
// 类型定义
// ============================================================================

export interface AddFloorDialogProps {
  /** 弹窗是否可见 */
  visible: boolean
  /** 已有楼层编号列表，用于重复检测 */
  existingLevels: number[]
}

export interface AddFloorDialogEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'created', data: { name: string; level: number; height: number; layoutDescription: string }): void
}

interface FormErrors {
  name: string
  level: string
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<AddFloorDialogProps>(), {
  existingLevels: () => [],
})

const emit = defineEmits<AddFloorDialogEmits>()

// ============================================================================
// 内部状态
// ============================================================================

const form = reactive({
  name: '',
  level: 1,
  height: 3.0,
  layoutDescription: '',
})

const errors = reactive<FormErrors>({
  name: '',
  level: '',
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const submitting = ref(false)
const apiError = ref('')

// ============================================================================
// 计算属性
// ============================================================================

const hasErrors = computed(() => !!errors.name || !!errors.level)

// ============================================================================
// 表单校验
// ============================================================================

function validateName(): boolean {
  if (!form.name.trim()) {
    errors.name = '楼层名称不能为空'
    return false
  }
  errors.name = ''
  return true
}

function validateLevel(): boolean {
  if (props.existingLevels.includes(form.level)) {
    errors.level = `楼层编号 ${form.level} 已存在`
    return false
  }
  errors.level = ''
  return true
}

function validateForm(): boolean {
  const nameValid = validateName()
  const levelValid = validateLevel()
  return nameValid && levelValid
}

// ============================================================================
// 2D 预览画布
// ============================================================================

function drawFloorPreview() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height

  // 清空画布
  ctx.clearRect(0, 0, w, h)

  // 绘制网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 1
  const gridSize = 20
  for (let x = 0; x <= w; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // 绘制楼层轮廓矩形
  const padding = 24
  const floorW = w - padding * 2
  const floorH = h - padding * 2

  ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.strokeRect(padding, padding, floorW, floorH)
  ctx.setLineDash([])

  // 填充半透明背景
  ctx.fillStyle = 'rgba(96, 165, 250, 0.06)'
  ctx.fillRect(padding, padding, floorW, floorH)

  // 绘制楼层标签
  const label = form.name.trim() || `Level ${form.level}`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, w / 2, h / 2 - 8)

  // 绘制高度标注
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillText(`${form.height}m`, w / 2, h / 2 + 10)
}

// ============================================================================
// 操作方法
// ============================================================================

function resetForm() {
  form.name = ''
  form.level = 1
  form.height = 3.0
  form.layoutDescription = ''
  errors.name = ''
  errors.level = ''
  apiError.value = ''
  submitting.value = false
}

function closeDialog() {
  emit('update:visible', false)
}

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    closeDialog()
  }
}

async function handleSubmit() {
  if (!validateForm()) return

  submitting.value = true
  apiError.value = ''

  const payload = {
    name: form.name.trim(),
    level: form.level,
    height: form.height,
    layoutDescription: form.layoutDescription.trim(),
  }

  try {
    await axios.post('/intelligence-api/floors', {
      floor_name: payload.name,
      height_range: { min_y: 0, max_y: payload.height },
      layout_description: payload.layoutDescription,
    })

    emit('created', payload)
    closeDialog()
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 422) {
        apiError.value = '参数校验失败，请检查输入'
      } else if (err.response) {
        apiError.value = err.response.data?.detail || '服务器错误，请稍后重试'
      } else {
        apiError.value = '网络连接失败，请检查网络'
      }
    } else {
      apiError.value = '操作失败，请重试'
    }
  } finally {
    submitting.value = false
  }
}

// ============================================================================
// 监听器
// ============================================================================

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    // 计算下一个可用的楼层编号
    if (props.existingLevels.length > 0) {
      form.level = Math.max(...props.existingLevels) + 1
    }
    nextTick(() => drawFloorPreview())
  }
})

watch([() => form.name, () => form.level, () => form.height], () => {
  if (props.visible) {
    nextTick(() => drawFloorPreview())
  }
})

// 实时清除校验错误
watch(() => form.name, () => {
  if (errors.name) validateName()
})

watch(() => form.level, () => {
  if (errors.level) validateLevel()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div
        v-if="visible"
        class="dialog-overlay"
        @click="handleOverlayClick"
      >
        <div class="dialog-box">
          <!-- 头部 -->
          <div class="dialog-header">
            <h3>添加楼层</h3>
            <button class="btn-close" @click="closeDialog">
              <svg viewBox="0 0 20 20" fill="none">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <!-- 内容 -->
          <div class="dialog-body">
            <!-- 表单区域 -->
            <div class="form-section">
              <!-- 楼层名称 -->
              <div class="form-item">
                <label>楼层名称</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  :class="{ error: errors.name }"
                  placeholder="例如：一楼、B1"
                />
                <span v-if="errors.name" class="form-error">{{ errors.name }}</span>
              </div>

              <!-- 楼层编号 & 高度 -->
              <div class="form-row">
                <div class="form-item">
                  <label>楼层编号</label>
                  <input
                    v-model.number="form.level"
                    type="number"
                    class="form-input"
                    :class="{ error: errors.level }"
                  />
                  <span v-if="errors.level" class="form-error">{{ errors.level }}</span>
                </div>
                <div class="form-item">
                  <label>楼层高度 (m)</label>
                  <input
                    v-model.number="form.height"
                    type="number"
                    class="form-input"
                    step="0.5"
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              <!-- 布局描述 -->
              <div class="form-item">
                <label>布局描述</label>
                <textarea
                  v-model="form.layoutDescription"
                  class="form-textarea"
                  rows="3"
                  placeholder="描述楼层的功能区域分布..."
                />
              </div>

              <!-- API 错误提示 -->
              <div v-if="apiError" class="api-error">
                <svg viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span>{{ apiError }}</span>
              </div>
            </div>

            <!-- 2D 预览区域 -->
            <div class="preview-section">
              <label class="preview-label">布局预览</label>
              <div class="preview-canvas-wrapper">
                <canvas ref="canvasRef" class="preview-canvas" />
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="dialog-footer">
            <button class="btn-cancel" :disabled="submitting" @click="closeDialog">取消</button>
            <button
              class="btn-add"
              :disabled="hasErrors || submitting"
              @click="handleSubmit"
            >
              {{ submitting ? '添加中...' : '添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 过渡动画
// ============================================================================
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity $duration-slow $ease-in-out;

  .dialog-box {
    transition: transform $duration-slow $ease-in-out;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .dialog-box {
    transform: translateY(-12px);
  }
}

// ============================================================================
// 遮罩层
// ============================================================================
.dialog-overlay {
  @include dialog-overlay;
}

// ============================================================================
// 弹窗容器
// ============================================================================
.dialog-box {
  @include dialog-box(520px);
}

// ============================================================================
// 头部
// ============================================================================
.dialog-header {
  @include dialog-header;
}

.btn-close {
  @include flex-center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: $radius-md;
  color: $color-text-secondary;
  cursor: pointer;
  transition: all $duration-normal;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: rgba($color-white, 0.08);
    color: $color-text-primary;
  }
}

// ============================================================================
// 内容区域
// ============================================================================
.dialog-body {
  @include dialog-body;
}

// ============================================================================
// 表单区域
// ============================================================================
.form-section {
  @include flex-column;
  gap: $space-4;
}

.form-item {
  @include form-item;
}

.form-row {
  @include form-row;
}

.form-input {
  @include form-control;

  &.error {
    border-color: $color-error;
  }
}

.form-textarea {
  @include form-textarea;
  min-height: 64px;
}

.form-error {
  font-size: $font-size-xs;
  color: $color-error;
}

// ============================================================================
// API 错误提示
// ============================================================================
.api-error {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: rgba($color-error, 0.08);
  border: 1px solid rgba($color-error, 0.2);
  border-radius: $radius-md;
  color: $color-error;
  font-size: $font-size-sm;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

// ============================================================================
// 预览区域
// ============================================================================
.preview-section {
  @include flex-column;
  gap: $space-2;
}

.preview-label {
  font-size: $font-size-sm + 1;
  color: $color-text-secondary;
}

.preview-canvas-wrapper {
  background: $color-bg-primary;
  border: 1px solid $color-border-subtle;
  border-radius: $radius-md;
  overflow: hidden;
}

.preview-canvas {
  display: block;
  width: 100%;
  height: 120px;
}

// ============================================================================
// 底部按钮
// ============================================================================
.dialog-footer {
  @include dialog-footer;
}

.btn-cancel {
  @include btn-secondary;
  @include btn-sm;
}

.btn-add {
  @include btn-primary;
  @include btn-sm;
}
</style>
