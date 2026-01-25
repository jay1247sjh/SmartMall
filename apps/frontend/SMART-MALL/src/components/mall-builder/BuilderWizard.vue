<script setup lang="ts">
/**
 * BuilderWizard 组件
 *
 * 商城建模器项目创建向导，用于选择模板和创建新项目。
 *
 * 功能：
 * - 项目名称输入
 * - 模板选择（支持多种预设模板）
 * - 自定义绘制选项
 * - 创建/取消操作
 *
 * @example
 * ```vue
 * <BuilderWizard
 *   :visible="showWizard"
 *   :templates="templates"
 *   v-model:selectedTemplate="selectedTemplate"
 *   v-model:projectName="projectName"
 *   @create="handleCreate"
 *   @createCustom="handleCreateCustom"
 *   @cancel="handleCancel"
 * />
 * ```
 */

import type { MallTemplate } from '@/builder'

// ============================================================================
// 类型定义
// ============================================================================

export interface BuilderWizardProps {
  /** 是否显示向导 */
  visible: boolean
  /** 可用模板列表 */
  templates: MallTemplate[]
  /** 当前选中的模板 */
  selectedTemplate: MallTemplate | null
  /** 项目名称 */
  projectName: string
}

export interface BuilderWizardEmits {
  (e: 'update:selectedTemplate', template: MallTemplate | null): void
  (e: 'update:projectName', name: string): void
  (e: 'create'): void
  (e: 'createCustom'): void
  (e: 'cancel'): void
}

// ============================================================================
// Props & Emits
// ============================================================================

const props = withDefaults(defineProps<BuilderWizardProps>(), {
  visible: false,
  templates: () => [],
  selectedTemplate: null,
  projectName: '我的商城',
})

const emit = defineEmits<BuilderWizardEmits>()

// ============================================================================
// 方法
// ============================================================================

/**
 * 处理项目名称输入
 */
function handleProjectNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:projectName', target.value)
}

/**
 * 选择模板
 */
function handleSelectTemplate(template: MallTemplate) {
  emit('update:selectedTemplate', template)
}

/**
 * 选择自定义绘制
 */
function handleSelectCustom() {
  emit('update:selectedTemplate', null)
}

/**
 * 处理创建按钮点击
 */
function handleCreate() {
  if (props.selectedTemplate) {
    emit('create')
  } else {
    emit('createCustom')
  }
}

/**
 * 处理取消按钮点击
 */
function handleCancel() {
  emit('cancel')
}

/**
 * 检查是否可以创建项目
 */
function canCreate(): boolean {
  return props.projectName.trim().length > 0
}

/**
 * 获取创建按钮文本
 */
function getCreateButtonText(): string {
  return props.selectedTemplate ? '创建项目' : '开始绘制'
}
</script>

<template>
  <div v-if="visible" class="wizard-overlay">
    <div class="wizard-modal">
      <!-- 向导头部 -->
      <div class="wizard-header">
        <h2>创建新项目</h2>
        <p>选择一个模板开始，或创建自定义商城</p>
      </div>

      <!-- 向导主体 -->
      <div class="wizard-body">
        <!-- 项目名称输入 -->
        <div class="form-group">
          <label>项目名称</label>
          <input
            :value="projectName"
            type="text"
            class="input"
            placeholder="输入项目名称"
            @input="handleProjectNameInput"
          />
        </div>

        <!-- 模板选择区域 -->
        <div class="template-section">
          <label>选择模板</label>
          <div class="template-grid">
            <!-- 预设模板卡片 -->
            <div
              v-for="template in templates"
              :key="template.id"
              :class="['template-card', { active: selectedTemplate?.id === template.id }]"
              @click="handleSelectTemplate(template)"
            >
              <div class="template-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <!-- 矩形模板 -->
                  <rect
                    v-if="template.type === 'rectangle'"
                    x="8"
                    y="12"
                    width="32"
                    height="24"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <!-- L形模板 -->
                  <path
                    v-else-if="template.type === 'l-shape'"
                    d="M8 12h20v12h12v12H8V12z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <!-- U形模板 -->
                  <path
                    v-else-if="template.type === 'u-shape'"
                    d="M8 12h32v24H28V24H20v12H8V12z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <!-- T形模板 -->
                  <path
                    v-else-if="template.type === 't-shape'"
                    d="M8 12h32v12H28v12H20V24H8V12z"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <!-- 圆形模板 -->
                  <circle
                    v-else-if="template.type === 'circle'"
                    cx="24"
                    cy="24"
                    r="14"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <!-- 默认/其他模板 -->
                  <rect
                    v-else
                    x="8"
                    y="12"
                    width="32"
                    height="24"
                    rx="2"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-dasharray="4 2"
                  />
                </svg>
              </div>
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>

            <!-- 自定义绘制卡片 -->
            <div
              :class="['template-card', 'custom', { active: selectedTemplate === null }]"
              @click="handleSelectCustom"
            >
              <div class="template-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 16v16M16 24h16"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="32"
                    height="32"
                    rx="4"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-dasharray="4 2"
                  />
                </svg>
              </div>
              <div class="template-name">自定义绘制</div>
              <div class="template-desc">手动绘制商城轮廓</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 向导底部 -->
      <div class="wizard-footer">
        <button class="btn-secondary" @click="handleCancel">取消</button>
        <button
          class="btn-primary"
          :disabled="!canCreate()"
          @click="handleCreate"
        >
          {{ getCreateButtonText() }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// ============================================================================
// 向导遮罩层
// ============================================================================
.wizard-overlay {
  @include absolute-fill;
  @include flex-center;
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

// ============================================================================
// 向导模态框
// ============================================================================
.wizard-modal {
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  background: $color-bg-secondary;
  border: 1px solid $color-border-muted;
  border-radius: $radius-xl;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.3s ease;
}

// ============================================================================
// 向导头部
// ============================================================================
.wizard-header {
  padding: $space-5 $space-6;
  border-bottom: 1px solid $color-border-subtle;

  h2 {
    font-size: $font-size-2xl;
    font-weight: $font-semibold;
    color: $color-text-primary;
    margin: 0 0 $space-2 0;
  }

  p {
    font-size: $font-size-base;
    color: $color-text-secondary;
    margin: 0;
  }
}

// ============================================================================
// 向导主体
// ============================================================================
.wizard-body {
  flex: 1;
  overflow-y: auto;
  padding: $space-6;
  @include scrollbar-custom;
}

// ============================================================================
// 表单组
// ============================================================================
.form-group {
  margin-bottom: $space-6;

  label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-medium;
    color: $color-text-secondary;
    margin-bottom: $space-2;
  }

  .input {
    width: 100%;
    padding: $space-3 $space-4;
    background: $color-bg-tertiary;
    border: 1px solid $color-border-muted;
    border-radius: $radius-md;
    color: $color-text-primary;
    font-size: $font-size-base;
    transition: border-color $duration-normal;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }

    &::placeholder {
      color: $color-text-muted;
    }
  }
}

// ============================================================================
// 模板选择区域
// ============================================================================
.template-section {
  label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-medium;
    color: $color-text-secondary;
    margin-bottom: $space-3;
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: $space-4;
}

// ============================================================================
// 模板卡片
// ============================================================================
.template-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  background: rgba($color-white, 0.02);
  border: 2px solid $color-border-subtle;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba($color-white, 0.05);
    border-color: $color-border-muted;
    transform: translateY(-2px);
  }

  &.active {
    background: rgba($color-primary, 0.1);
    border-color: $color-primary;
    box-shadow: 0 0 0 4px rgba($color-primary, 0.1);
  }

  &.custom {
    border-style: dashed;
  }
}

.template-icon {
  width: 64px;
  height: 64px;
  margin-bottom: $space-3;
  color: $color-text-muted;

  svg {
    width: 100%;
    height: 100%;
  }

  .template-card.active & {
    color: $color-primary;
  }
}

.template-name {
  font-size: $font-size-base;
  font-weight: $font-medium;
  color: $color-text-primary;
  margin-bottom: $space-1;
  text-align: center;
}

.template-desc {
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-align: center;
}

// ============================================================================
// 向导底部
// ============================================================================
.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-6;
  border-top: 1px solid $color-border-subtle;
}

// ============================================================================
// 按钮样式
// ============================================================================
.btn-secondary {
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid $color-border-muted;
  border-radius: $radius-md;
  color: $color-text-secondary;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba($color-white, 0.05);
    border-color: $color-text-secondary;
    color: $color-text-primary;
  }
}

.btn-primary {
  padding: $space-2 $space-4;
  background: $color-primary;
  border: 1px solid $color-primary;
  border-radius: $radius-md;
  color: $color-white;
  font-size: $font-size-base;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover:not(:disabled) {
    background: lighten($color-primary, 5%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ============================================================================
// 动画
// ============================================================================
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
