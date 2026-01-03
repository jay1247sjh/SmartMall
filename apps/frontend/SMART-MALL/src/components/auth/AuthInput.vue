<script setup lang="ts">
/**
 * 认证表单输入框组件
 * 带图标、验证状态的输入框
 */
import { computed } from 'vue'

const props = defineProps<{
  /** 输入框 ID */
  id: string
  /** 标签文字 */
  label: string
  /** 输入框类型 */
  type?: 'text' | 'password' | 'email' | 'tel'
  /** 占位符 */
  placeholder?: string
  /** 自动完成属性 */
  autocomplete?: string
  /** 是否必填 */
  required?: boolean
  /** 错误信息 */
  error?: string
  /** 是否正在检查 */
  checking?: boolean
  /** 是否验证通过 */
  valid?: boolean
  /** 图标类型 */
  icon?: 'user' | 'password' | 'email' | 'phone'
}>()

const modelValue = defineModel<string>({ required: true })

const hasError = computed(() => !!props.error)
</script>

<template>
  <div class="form-group">
    <label :for="id">
      {{ label }}
      <span v-if="required" class="required">*</span>
      <span v-else class="optional">(可选)</span>
    </label>
    <div class="input-wrapper">
      <!-- User Icon -->
      <svg v-if="icon === 'user'" class="input-icon" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M2 18c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <!-- Password Icon -->
      <svg v-else-if="icon === 'password'" class="input-icon" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="8" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 8V5a4 4 0 118 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
      </svg>
      <!-- Email Icon -->
      <svg v-else-if="icon === 'email'" class="input-icon" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M2 6l8 5 8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <!-- Phone Icon -->
      <svg v-else-if="icon === 'phone'" class="input-icon" viewBox="0 0 20 20" fill="none">
        <rect x="5" y="2" width="10" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      
      <input 
        :id="id"
        v-model="modelValue"
        :type="type || 'text'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :class="{ error: hasError }"
      />
      
      <!-- 状态指示器 -->
      <span v-if="checking" class="input-status checking"></span>
      <span v-else-if="valid && !hasError" class="input-status valid">✓</span>
    </div>
    <span v-if="error" class="field-error">{{ error }}</span>
  </div>
</template>

<style scoped>
.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #9aa0a6;
  margin-bottom: 8px;
}

.required {
  color: #f28b82;
}

.optional {
  color: #5f6368;
  font-weight: 400;
  font-size: 12px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #5f6368;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrapper:focus-within .input-icon {
  color: #8ab4f8;
}

.form-group input {
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 14px;
  color: #e8eaed;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.form-group input::placeholder {
  color: #5f6368;
}

.form-group input:focus {
  outline: none;
  border-color: #8ab4f8;
  background: rgba(138, 180, 248, 0.05);
  box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
}

.form-group input.error {
  border-color: #f28b82;
}

.input-status {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.input-status.checking {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(138, 180, 248, 0.3);
  border-top-color: #8ab4f8;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.input-status.valid {
  color: #81c995;
}

@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.field-error {
  display: block;
  font-size: 12px;
  color: #f28b82;
  margin-top: 6px;
  padding-left: 2px;
}
</style>
