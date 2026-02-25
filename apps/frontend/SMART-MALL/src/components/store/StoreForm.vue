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
import { computed, ref, watch } from 'vue'
import type { StoreDTO } from '@/api/store.api'
import type { AreaPermissionDTO } from '@/api/area-permission.api'
import { useI18n } from 'vue-i18n'
import FormDialogShell from '@/components/shared/FormDialogShell.vue'
import {
  FULL_DAY_BUSINESS_HOURS,
  buildBusinessHoursFromPicker,
  isAllDayBusinessHours,
  isValidBusinessHours,
  toPickerRange,
  type BusinessHoursRange,
} from '@/utils/business-hours'

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

const businessHoursRange = ref<BusinessHoursRange | null>(null)
const allDayBusiness = ref(false)
const showLegacyHint = ref(false)
const businessHoursError = ref('')

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
      syncBusinessHoursState(formData.value.businessHours)
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

function syncBusinessHoursState(raw: string | null | undefined) {
  businessHoursError.value = ''
  allDayBusiness.value = isAllDayBusinessHours(raw)
  businessHoursRange.value = toPickerRange(raw)
  showLegacyHint.value = Boolean(raw && !allDayBusiness.value && !businessHoursRange.value)
}

function handleBusinessHoursChange(value: string[] | null) {
  businessHoursError.value = ''
  showLegacyHint.value = false

  if (!value || value.length !== 2) {
    businessHoursRange.value = null
    formData.value.businessHours = ''
    return
  }

  const [start, end] = value
  if (!start || !end) {
    businessHoursRange.value = null
    formData.value.businessHours = ''
    return
  }

  const nextRange: BusinessHoursRange = [start, end]
  if (nextRange[0] === nextRange[1]) {
    businessHoursError.value = t('store.businessHoursEqualHint')
    return
  }

  businessHoursRange.value = nextRange
  formData.value.businessHours = buildBusinessHoursFromPicker(nextRange, false)
}

function handleAllDayChange(value: boolean) {
  allDayBusiness.value = value
  businessHoursError.value = ''
  showLegacyHint.value = false

  if (value) {
    businessHoursRange.value = null
    formData.value.businessHours = FULL_DAY_BUSINESS_HOURS
  } else if (formData.value.businessHours === FULL_DAY_BUSINESS_HOURS) {
    formData.value.businessHours = ''
  }
}

function handleSubmit() {
  // 基本验证
  if (props.mode === 'create' && !formData.value.areaId) {
    return
  }
  if (!formData.value.name || !formData.value.category) {
    return
  }

  if (allDayBusiness.value) {
    formData.value.businessHours = FULL_DAY_BUSINESS_HOURS
  } else if (businessHoursRange.value) {
    if (businessHoursRange.value[0] === businessHoursRange.value[1]) {
      businessHoursError.value = t('store.businessHoursEqualHint')
      return
    }
    formData.value.businessHours = buildBusinessHoursFromPicker(businessHoursRange.value, false)
  }

  if (props.mode === 'create' && formData.value.businessHours && !isValidBusinessHours(formData.value.businessHours)) {
    businessHoursError.value = t('store.businessHoursInvalidHint')
    return
  }

  emit('submit', { ...formData.value })
}
</script>

<template>
  <FormDialogShell
    :visible="visible"
    :title="dialogTitle"
    class="store-form-shell"
    @close="handleClose"
  >
    <!-- 区域选择（仅创建模式） -->
    <div v-if="mode === 'create'" class="form-item">
      <label>{{ t('store.selectArea') }} *</label>
      <ElSelect
        v-model="formData.areaId"
        class="store-themed-select"
        :placeholder="t('store.pleaseSelectArea')"
        popper-class="store-themed-select-dropdown"
        clearable
      >
        <ElOption 
          v-for="area in availableAreas" 
          :key="area.areaId" 
          :value="area.areaId"
          :label="`${area.floorName} - ${area.areaName}`"
        />
      </ElSelect>
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
      <ElSelect
        v-model="formData.category"
        class="store-themed-select"
        :placeholder="t('store.selectCategory')"
        popper-class="store-themed-select-dropdown"
        clearable
      >
        <ElOption
          v-for="cat in categories"
          :key="cat.value"
          :value="cat.value"
          :label="cat.label"
        />
      </ElSelect>
    </div>
    
    <!-- 营业时间 -->
    <div class="form-item">
      <label>{{ t('store.businessHours') }}</label>
      <ElTimePicker
        v-model="businessHoursRange"
        class="store-themed-time"
        popper-class="store-themed-time-dropdown"
        is-range
        format="HH:mm"
        value-format="HH:mm"
        :disabled="allDayBusiness"
        :clearable="!allDayBusiness"
        :start-placeholder="t('store.businessHoursRangeStart')"
        :end-placeholder="t('store.businessHoursRangeEnd')"
        @change="handleBusinessHoursChange"
      />
      <div class="all-day-row">
        <ElSwitch :model-value="allDayBusiness" @change="handleAllDayChange" />
        <span class="all-day-label">{{ t('store.open24Hours') }}</span>
      </div>
      <p v-if="showLegacyHint" class="field-hint warning">{{ t('store.businessHoursInvalidHint') }}</p>
      <p v-if="businessHoursError" class="field-hint error">{{ businessHoursError }}</p>
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

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">{{ t('common.cancel') }}</button>
      <button 
        class="btn btn-primary" 
        :disabled="processing" 
        @click="handleSubmit"
      >
        {{ submitButtonText }}
      </button>
    </template>
  </FormDialogShell>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.store-form-shell {
  :deep(.dialog-box) {
    border: 1px solid rgba(var(--accent-primary-rgb), 0.18);
    box-shadow:
      0 18px 40px rgba(var(--black-rgb), 0.22),
      0 2px 10px rgba(var(--accent-primary-rgb), 0.12);
  }

  :deep(.dialog-header) {
    background: linear-gradient(
      180deg,
      rgba(var(--accent-primary-rgb), 0.08) 0%,
      rgba(var(--accent-primary-rgb), 0.02) 100%
    );
  }
}

// 表单
.form-item {
  @include form-item;

  label {
    font-weight: $font-weight-medium;
    letter-spacing: 0.2px;
  }
}

.input,
.textarea {
  @include form-control;
  background: var(--bg-elevated);
  border-color: rgba(var(--accent-primary-rgb), 0.28);
  transition:
    border-color $duration-normal $ease-default,
    box-shadow $duration-normal $ease-default,
    background-color $duration-normal $ease-default;

  &:hover {
    border-color: rgba(var(--accent-primary-rgb), 0.52);
  }

  &:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.2);
  }
}

.textarea {
  resize: vertical;
  min-height: 96px;
}

.all-day-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-2;
}

.all-day-label {
  color: var(--text-secondary);
  font-size: $font-size-sm + 1;
}

.field-hint {
  margin: $space-1 0 0;
  font-size: $font-size-sm + 1;
  line-height: 1.4;

  &.warning {
    color: var(--warning);
  }

  &.error {
    color: var(--error);
  }
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
