<script setup lang="ts">
/**
 * StoreForm 子组件
 * 
 * 店铺创建和编辑表单组件
 * 
 * 业务职责：
 * - 创建新店铺表单
 * - 编辑现有店铺表单
 * - 表单验证和提交
 * 
 * Requirements: 2.2
 */
import { ref, watch, computed } from 'vue'
import type { StoreDTO, CreateStoreRequest, UpdateStoreRequest } from '@/api/store.api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ============================================================================
// Types
// ============================================================================

export interface StoreFormData {
  areaId?: string
  name: string
  description: string
  category: string
  businessHours: string
}

// ============================================================================
// Props & Emits
// ============================================================================

interface StoreFormProps {
  /** 对话框是否可见 */
  visible: boolean
  /** 店铺数据（编辑模式） */
  store: StoreDTO | null
  /** 表单模式 */
  mode: 'create' | 'edit'
  /** 可用区域列表（创建模式） */
  availableAreas?: AreaPermissionDTO[]
  /** 是否正在处理 */
  processing?: boolean
}

interface StoreFormEmits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: StoreFormData): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<StoreFormProps>(), {
  availableAreas: () => [],
  processing: false,
})
const emit = defineEmits<StoreFormEmits>()

// ============================================================================
// State
// ============================================================================

const categories = computed(() => [
  { value: '餐饮', label: t('merchant.catCatering') },
  { value: '零售', label: t('merchant.catRetail') },
  { value: '服装', label: t('merchant.catClothing') },
  { value: '娱乐', label: t('merchant.catEntertainment') },
  { value: '服务', label: t('merchant.catService') },
  { value: '其他', label: t('merchant.catOther') },
])

const formData = ref<StoreFormData>({
  areaId: '',
  name: '',
  description: '',
  category: '',
  businessHours: '',
})

// ============================================================================
// Computed
// ============================================================================

const dialogTitle = computed(() => {
  return props.mode === 'create' ? t('store.createStore') : t('store.editStore')
})

const submitButtonText = computed(() => {
  if (props.processing) {
    return props.mode === 'create' ? t('store.creating') : t('store.saving')
  }
  return props.mode === 'create' ? t('store.create') : t('common.save')
})

// ============================================================================
// Watchers
// ============================================================================

// 当对话框打开或店铺数据变化时，重置表单
watch(
  () => [props.visible, props.store, props.mode],
  () => {
    if (props.visible) {
      if (props.mode === 'edit' && props.store) {
        formData.value = {
          name: props.store.name,
          description: props.store.description || '',
          category: props.store.category,
          businessHours: props.store.businessHours || '',
        }
      } else {
        formData.value = {
          areaId: '',
          name: '',
          description: '',
          category: '',
          businessHours: '',
        }
      }
    }
  },
  { immediate: true }
)

// ============================================================================
// Methods
// ============================================================================

function handleClose() {
  emit('update:visible', false)
  emit('cancel')
}

function handleSubmit() {
  // 基本验证
  if (props.mode === 'create' && !formData.value.areaId) {
    return
  }
  if (!formData.value.name || !formData.value.category) {
    return
  }
  
  emit('submit', { ...formData.value })
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="handleClose">
    <div class="dialog">
      <div class="dialog-header">
        <h3>{{ dialogTitle }}</h3>
        <button class="dialog-close" @click="handleClose">×</button>
      </div>
      <div class="dialog-body">
        <!-- 区域选择（仅创建模式） -->
        <div v-if="mode === 'create'" class="form-item">
          <label>{{ t('store.selectArea') }} *</label>
          <select v-model="formData.areaId" class="select">
            <option value="">{{ t('store.pleaseSelectArea') }}</option>
            <option 
              v-for="area in availableAreas" 
              :key="area.areaId" 
              :value="area.areaId"
            >
              {{ area.floorName }} - {{ area.areaName }}
            </option>
          </select>
        </div>
        
        <!-- 店铺名称 -->
        <div class="form-item">
          <label>{{ t('store.storeName') }} *</label>
          <input 
            v-model="formData.name" 
            type="text" 
            class="input" 
            :placeholder="t('store.storeNamePlaceholder')" 
          />
        </div>
        
        <!-- 店铺分类 -->
        <div class="form-item">
          <label>{{ t('store.storeCategory') }} *</label>
          <select v-model="formData.category" class="select">
            <option value="">{{ t('store.selectCategory') }}</option>
            <option v-for="cat in categories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </option>
          </select>
        </div>
        
        <!-- 营业时间 -->
        <div class="form-item">
          <label>{{ t('store.businessHours') }}</label>
          <input 
            v-model="formData.businessHours" 
            type="text" 
            class="input" 
            :placeholder="t('store.businessHoursPlaceholder')" 
          />
        </div>
        
        <!-- 店铺描述 -->
        <div class="form-item">
          <label>{{ t('store.storeDesc') }}</label>
          <textarea 
            v-model="formData.description" 
            class="textarea" 
            rows="3" 
            :placeholder="t('store.storeDescPlaceholder')"
          ></textarea>
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary" @click="handleClose">{{ t('common.cancel') }}</button>
        <button 
          class="btn btn-primary" 
          :disabled="processing" 
          @click="handleSubmit"
        >
          {{ submitButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

// 对话框
.dialog-overlay {
  @include dialog-overlay;
}

.dialog {
  @include dialog-box;

  &-header {
    @include dialog-header;
  }

  &-close {
    @include dialog-close;
  }

  &-body {
    @include dialog-body;
  }

  &-footer {
    @include dialog-footer;
  }
}

// 表单
.form-item {
  @include form-item;
}

.input,
.select,
.textarea {
  @include form-control;
}

.textarea {
  resize: vertical;
}

// 按钮
.btn {
  @include btn-base;

  &-secondary {
    @include btn-secondary;
  }

  &-primary {
    @include btn-primary;
  }
}
</style>
