<script setup lang="ts">
/**
 * RoamingIndicator - 漫游模式指示器组件
 */
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t } = useI18n()

interface Props {
  isPointerLocked: boolean
  walkSpeedPreset: 'slow' | 'normal' | 'fast'
}

defineProps<Props>()

const emit = defineEmits<{
  setWalkSpeed: [preset: 'slow' | 'normal' | 'fast']
  exitRoamMode: []
}>()

const speedPresets: ('slow' | 'normal' | 'fast')[] = ['slow', 'normal', 'fast']
const speedPresetLabels = computed<Record<'slow' | 'normal' | 'fast', string>>(() => ({
  slow: t('builder.speedSlow'),
  normal: t('builder.speedNormal'),
  fast: t('builder.speedFast'),
}))
</script>

<template>
  <div class="orbit-mode-indicator">
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
      <path d="M10 5v2M10 13v2M5 10h2M13 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span>{{ t('builder.roamMode') }}</span>
    <span v-if="isPointerLocked" class="orbit-hint">{{ t('builder.wasdMove') }}</span>
    <span v-else class="orbit-hint pointer-lock-hint">{{ t('builder.clickToLock') }}</span>
    
    <!-- 速度选择器 -->
    <div class="speed-selector">
      <span class="speed-label">{{ t('builder.speed') }}</span>
      <button 
        v-for="preset in speedPresets" 
        :key="preset"
        :class="['speed-btn', { active: walkSpeedPreset === preset }]"
        @click="emit('setWalkSpeed', preset)"
      >
        {{ speedPresetLabels[preset] }}
      </button>
    </div>
    
    <button class="exit-btn" @click="emit('exitRoamMode')">{{ t('builder.exitRoam') }}</button>
  </div>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
