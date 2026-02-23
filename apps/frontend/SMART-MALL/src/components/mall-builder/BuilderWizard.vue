<script setup lang="ts">
/**
 * BuilderWizard 组件
 *
 * 商城建模器项目创建向导，支持模板选择、自定义绘制和 AI 生成。
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MallTemplate, MallProject } from '@/builder'
import { convertMallLayoutToProject } from '@/builder/converters/layout-converter'
import { intelligenceApi } from '@/api/intelligence.api'
import AiDescriptionChat from './AiDescriptionChat.vue'

// ============================================================================
// 类型定义
// ============================================================================

export interface BuilderWizardProps {
  visible: boolean
  templates: MallTemplate[]
  selectedTemplate: MallTemplate | null
  projectName: string
}

export interface SavedProject {
  projectId: string
  name: string
  description?: string
  floorCount: number
  areaCount: number
  createdAt: string
  updatedAt: string
}

export interface BuilderWizardEmits {
  (e: 'update:selectedTemplate', template: MallTemplate | null): void
  (e: 'update:projectName', name: string): void
  (e: 'create'): void
  (e: 'createCustom'): void
  (e: 'createFromAI', project: MallProject): void
  (e: 'loadProject', projectId: string): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<BuilderWizardProps>(), {
  visible: false,
  templates: () => [],
  selectedTemplate: null,
  projectName: '',
})

const emit = defineEmits<BuilderWizardEmits>()

// ============================================================================
// AI 生成状态
// ============================================================================

const wizardMode = ref<'template' | 'ai'>('template')
const aiDescription = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const showChatPanel = ref(false)
const { t } = useI18n()

// ============================================================================
// 已保存项目
// ============================================================================

const savedProjects = ref<SavedProject[]>([])
const isLoadingProjects = ref(false)

async function loadSavedProjects() {
  isLoadingProjects.value = true
  try {
    const { mallBuilderApi } = await import('@/api/mall-builder.api')
    savedProjects.value = await mallBuilderApi.getProjectList()
  } catch (err) {
    console.error('加载项目列表失败:', err)
  } finally {
    isLoadingProjects.value = false
  }
}

function handleLoadProject(projectId: string) {
  emit('loadProject', projectId)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 组件挂载时加载已保存项目
import { onMounted } from 'vue'
onMounted(() => {
  loadSavedProjects()
})

// ============================================================================
// 方法
// ============================================================================

function handleProjectNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:projectName', target.value)
}

function handleSelectTemplate(template: MallTemplate) {
  wizardMode.value = 'template'
  emit('update:selectedTemplate', template)
}

function handleSelectCustom() {
  wizardMode.value = 'template'
  emit('update:selectedTemplate', null)
}

function handleSelectAI() {
  wizardMode.value = 'ai'
  aiError.value = ''
}

function handleCreate() {
  if (wizardMode.value === 'ai') {
    handleAIGenerate()
    return
  }
  if (props.selectedTemplate) {
    emit('create')
  } else {
    emit('createCustom')
  }
}

function handleCancel() {
  emit('cancel')
}

async function handleAIGenerate() {
  if (!aiDescription.value.trim()) return
  aiLoading.value = true
  aiError.value = ''
  try {
    const response = await intelligenceApi.generateMall(aiDescription.value.trim())
    if (response.success && response.data) {
      const project = convertMallLayoutToProject(response.data)
      project.name = props.projectName || project.name
      emit('createFromAI', project)
    } else {
      aiError.value = response.message || 'AI 生成失败，请重试或选择模板创建'
    }
  } catch {
    aiError.value = '网络连接失败，请检查网络后重试'
  } finally {
    aiLoading.value = false
  }
}

function canCreate(): boolean {
  if (wizardMode.value === 'ai') {
    return props.projectName.trim().length > 0 && aiDescription.value.trim().length > 0 && !aiLoading.value
  }
  return props.projectName.trim().length > 0
}

function getCreateButtonText(): string {
  if (wizardMode.value === 'ai') {
    return 'AI 生成'
  }
  return props.selectedTemplate ? '创建项目' : '开始绘制'
}
</script>

<template>
  <div v-if="visible" class="wizard-overlay">
    <div class="wizard-modal">
      <!-- 向导头部 -->
      <div class="wizard-header">
        <h2>创建新项目</h2>
        <p>选择一个模板开始，或使用 AI 智能生成</p>
      </div>

      <!-- 向导主体 -->
      <div class="wizard-body">
        <!-- 已保存项目 -->
        <div v-if="savedProjects.length > 0" class="saved-projects-section">
          <label>{{ t('builder.wizard.savedProjects') }}</label>
          <div class="saved-projects-list">
            <div
              v-for="proj in savedProjects"
              :key="proj.projectId"
              class="saved-project-item"
              @click="handleLoadProject(proj.projectId)"
            >
              <div class="project-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
              </div>
              <div class="project-info">
                <span class="project-name">{{ proj.name }}</span>
                <span class="project-meta">
                  {{ t('builder.wizard.floorCount', { count: proj.floorCount }) }} · {{ t('builder.wizard.areaCount', { count: proj.areaCount }) }} · {{ formatDate(proj.updatedAt) }}
                </span>
              </div>
              <div class="project-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div v-if="savedProjects.length > 0" class="section-divider">
          <span class="divider-text">{{ t('builder.wizard.orCreateNew') }}</span>
        </div>

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
          <label>选择创建方式</label>
          <div class="template-grid">
            <!-- AI 生成卡片 -->
            <div
              :class="['template-card', 'ai-card', { active: wizardMode === 'ai' }]"
              @click="handleSelectAI"
            >
              <div class="template-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2" />
                  <path d="M18 20a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" fill="currentColor" />
                  <path d="M26 20a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" fill="currentColor" />
                  <path d="M18 28c0 0 2 4 6 4s6-4 6-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
              <div class="template-name">AI 生成</div>
              <div class="template-desc">自然语言描述生成布局</div>
            </div>

            <!-- 预设模板卡片 -->
            <div
              v-for="template in templates"
              :key="template.id"
              :class="['template-card', { active: wizardMode === 'template' && selectedTemplate?.id === template.id }]"
              @click="handleSelectTemplate(template)"
            >
              <div class="template-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <rect
                    v-if="template.type === 'rectangle'"
                    x="8" y="12" width="32" height="24" rx="2"
                    stroke="currentColor" stroke-width="2"
                  />
                  <path
                    v-else-if="template.type === 'l-shape'"
                    d="M8 12h20v12h12v12H8V12z"
                    stroke="currentColor" stroke-width="2"
                  />
                  <path
                    v-else-if="template.type === 'u-shape'"
                    d="M8 12h32v24H28V24H20v12H8V12z"
                    stroke="currentColor" stroke-width="2"
                  />
                  <path
                    v-else-if="template.type === 't-shape'"
                    d="M8 12h32v12H28v12H20V24H8V12z"
                    stroke="currentColor" stroke-width="2"
                  />
                  <circle
                    v-else-if="template.type === 'circle'"
                    cx="24" cy="24" r="14"
                    stroke="currentColor" stroke-width="2"
                  />
                  <rect
                    v-else
                    x="8" y="12" width="32" height="24" rx="2"
                    stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"
                  />
                </svg>
              </div>
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>

            <!-- 自定义绘制卡片 -->
            <div
              :class="['template-card', 'custom', { active: wizardMode === 'template' && selectedTemplate === null }]"
              @click="handleSelectCustom"
            >
              <div class="template-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M24 16v16M16 24h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" />
                </svg>
              </div>
              <div class="template-name">自定义绘制</div>
              <div class="template-desc">手动绘制商城轮廓</div>
            </div>
          </div>
        </div>

        <!-- AI 描述输入区域 -->
        <div v-if="wizardMode === 'ai'" class="ai-section">
          <label>描述你的商城</label>
          <textarea
            v-model="aiDescription"
            class="ai-textarea"
            placeholder="例如：创建一个3层商城，1楼有Nike、Adidas、Zara，2楼有星巴克、海底捞，3楼是电影院和游戏厅"
            rows="4"
            :disabled="aiLoading"
          />
          <div v-if="aiError" class="ai-error">
            <svg viewBox="0 0 16 16" fill="none" class="error-icon">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 5v4M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span>{{ aiError }}</span>
          </div>
          <div class="ai-hint">
            <svg viewBox="0 0 16 16" fill="none" class="hint-icon">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" />
              <path d="M8 7v5M8 5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span>支持指定楼层数、店铺品牌、商城尺寸等信息</span>
          </div>
          <button class="btn-ai-assist" @click="showChatPanel = !showChatPanel">
            <svg viewBox="0 0 16 16" fill="none" class="ai-assist-icon">
              <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H6l-3 3V9a2 2 0 0 1-1-2V4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 6h4M6 8.5h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <span>{{ t('builder.aiAssist') }}</span>
          </button>
          <AiDescriptionChat
            v-show="showChatPanel"
            v-model:currentDescription="aiDescription"
            @generate="handleCreate"
          />
        </div>
      </div>

      <!-- 向导底部 -->
      <div class="wizard-footer">
        <button class="btn-secondary" @click="handleCancel">取消</button>
        <button
          :class="['btn-primary', { 'is-loading': aiLoading }]"
          :disabled="!canCreate() && !aiLoading"
          @click="handleCreate"
        >
          <svg v-if="aiLoading" class="wizard-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="8" />
          </svg>
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
// 已保存项目区域
// ============================================================================
.saved-projects-section {
  margin-bottom: $space-5;

  label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
    margin-bottom: $space-3;
  }
}

.saved-projects-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  max-height: 180px;
  overflow-y: auto;
  @include scrollbar-custom;
}

.saved-project-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--accent-primary);
  }

  .project-icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  .project-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .project-name {
      font-size: $font-size-base;
      font-weight: $font-weight-medium;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .project-meta {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }
  }

  .project-arrow {
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform $duration-normal;
  }

  &:hover .project-arrow {
    transform: translateX(2px);
    color: var(--accent-primary);
  }
}

.section-divider {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-5;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-subtle);
  }

  .divider-text {
    font-size: $font-size-sm;
    color: var(--text-muted);
    white-space: nowrap;
  }
}

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
  height: 80vh;
  max-height: 90vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-muted);
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
  border-bottom: 1px solid var(--border-subtle);

  h2 {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    margin: 0 0 $space-2 0;
  }

  p {
    font-size: $font-size-base;
    color: var(--text-secondary);
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
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
    margin-bottom: $space-2;
  }

  .input {
    width: 100%;
    padding: $space-3 $space-4;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-muted);
    border-radius: $radius-md;
    color: var(--text-primary);
    font-size: $font-size-base;
    transition: border-color $duration-normal;

    &:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    &::placeholder {
      color: var(--text-muted);
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
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
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
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid var(--border-subtle);
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--border-muted);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(var(--accent-primary-rgb), 0.1);
    border-color: var(--accent-primary);
  }

  &.custom {
    border-style: dashed;
  }

  &.ai-card {
    border-color: rgba(var(--accent-primary-rgb), 0.3);
    background: rgba(var(--accent-primary-rgb), 0.04);

    &.active {
      background: rgba(var(--accent-primary-rgb), 0.12);
      border-color: var(--accent-primary);
    }
  }
}

.template-icon {
  width: 64px;
  height: 64px;
  margin-bottom: $space-3;
  color: var(--text-muted);

  svg {
    width: 100%;
    height: 100%;
  }

  .template-card.active & {
    color: var(--accent-primary);
  }
}

.template-name {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: var(--text-primary);
  margin-bottom: $space-1;
  text-align: center;
}

.template-desc {
  font-size: $font-size-sm;
  color: var(--text-muted);
  text-align: center;
}

// ============================================================================
// AI 描述区域
// ============================================================================
.ai-section {
  margin-top: $space-6;

  label {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: var(--text-secondary);
    margin-bottom: $space-2;
  }
}

.ai-textarea {
  width: 100%;
  padding: $space-3 $space-4;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-muted);
  border-radius: $radius-md;
  color: var(--text-primary);
  font-size: $font-size-base;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: border-color $duration-normal;

  &:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.ai-error {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-2;
  padding: $space-2 $space-3;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: $radius-md;
  color: #ef4444;
  font-size: $font-size-sm;

  .error-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

.ai-hint {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-2;
  color: var(--text-muted);
  font-size: $font-size-sm;

  .hint-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
}

// ============================================================================
// AI 辅助按钮
// ============================================================================
.btn-ai-assist {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-3;
  padding: $space-2 $space-3;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
    color: var(--text-primary);
  }

  .ai-assist-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

// ============================================================================
// 向导底部
// ============================================================================
.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-3;
  padding: $space-4 $space-6;
  border-top: 1px solid var(--border-subtle);
}

// ============================================================================
// 按钮
// ============================================================================
.btn-secondary {
  padding: $space-2 $space-4;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: $radius-md;
  color: var(--text-primary);
  font-size: $font-size-base;
  cursor: pointer;
  transition: all $duration-normal;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-muted);
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  min-width: 120px;
  height: 36px;
  padding: 0 $space-4;
  background: var(--accent-primary);
  border: none;
  border-radius: $radius-md;
  color: #fff;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  white-space: nowrap;
  cursor: pointer;
  transition: background $duration-normal;

  &:hover {
    background: var(--accent-hover);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  &.is-loading {
    background: var(--accent-primary);
    color: #fff;
    opacity: 0.85;
    cursor: wait;
    pointer-events: none;
  }
}

// ============================================================================
// 加载动画
// ============================================================================
.wizard-spinner {
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
