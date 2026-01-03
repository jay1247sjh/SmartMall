<script setup lang="ts">
/**
 * 自定义下拉选择器 - 深色主题风格
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || props.placeholder || '请选择'
})

function toggle() {
  isOpen.value = !isOpen.value
}

function select(option: Option) {
  emit('update:modelValue', option.value)
  isOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="selectRef" class="custom-select" :class="{ open: isOpen }">
    <button type="button" class="select-trigger" @click="toggle">
      <span class="select-value">{{ selectedLabel }}</span>
      <svg class="select-arrow" viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="option in options"
          :key="option.value"
          class="select-option"
          :class="{ active: option.value === modelValue }"
          @click="select(option)"
        >
          <span>{{ option.label }}</span>
          <svg v-if="option.value === modelValue" class="check-icon" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  min-width: 140px;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  background: rgba(17, 17, 19, 0.9);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 10px;
  color: #e8eaed;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-trigger:hover {
  border-color: rgba(96, 165, 250, 0.5);
  background: rgba(96, 165, 250, 0.08);
}

.custom-select.open .select-trigger {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
}

.select-value {
  flex: 1;
  text-align: left;
}

.select-arrow {
  width: 16px;
  height: 16px;
  color: #9aa0a6;
  transition: transform 0.2s ease;
}

.custom-select.open .select-arrow {
  transform: rotate(180deg);
  color: #60a5fa;
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #1a1a1c;
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 10px;
  padding: 6px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(96, 165, 250, 0.1);
  backdrop-filter: blur(12px);
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  color: #9aa0a6;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.select-option:hover {
  background: rgba(96, 165, 250, 0.1);
  color: #e8eaed;
}

.select-option.active {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #60a5fa;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
