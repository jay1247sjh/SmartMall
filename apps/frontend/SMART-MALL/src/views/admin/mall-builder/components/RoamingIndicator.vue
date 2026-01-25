<script setup lang="ts">
/**
 * RoamingIndicator - 漫游模式指示器组件
 */
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
const speedPresetLabels: Record<'slow' | 'normal' | 'fast', string> = {
  slow: '慢速',
  normal: '正常',
  fast: '快速',
}
</script>

<template>
  <div class="orbit-mode-indicator">
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
      <path d="M10 5v2M10 13v2M5 10h2M13 10h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span>漫游模式</span>
    <span v-if="isPointerLocked" class="orbit-hint">WASD 移动 / 鼠标转向 / ESC 退出</span>
    <span v-else class="orbit-hint pointer-lock-hint">点击画布锁定鼠标以控制视角</span>
    
    <!-- 速度选择器 -->
    <div class="speed-selector">
      <span class="speed-label">速度:</span>
      <button 
        v-for="preset in speedPresets" 
        :key="preset"
        :class="['speed-btn', { active: walkSpeedPreset === preset }]"
        @click="emit('setWalkSpeed', preset)"
      >
        {{ speedPresetLabels[preset] }}
      </button>
    </div>
    
    <button class="exit-btn" @click="emit('exitRoamMode')">退出漫游</button>
  </div>
</template>

<style scoped lang="scss">
// 样式继承自主文件的 mall-builder.scss
</style>
