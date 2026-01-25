<script setup lang="ts">
/**
 * BuilderIcon - Mall Builder 专用图标组件
 * 统一管理所有 SVG 图标
 */
interface Props {
  name: string
  size?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20,
})

// 图标路径定义
const iconPaths: Record<string, { path: string; viewBox?: string; fill?: boolean }> = {
  // 工具图标
  select: { path: 'M4 4l5 14 2-5 5-2L4 4z' },
  pan: { path: 'M10 3v14M3 10h14' },
  'draw-rect': { path: 'M3 3h14v14H3z' },
  'draw-poly': { path: 'M10 2l8 6-3 10H5L2 8l8-6z' },
  'draw-outline': { path: 'M3 3h14v14H3V3z' },
  reset: { path: 'M4 4l12 12M16 4L4 16' },

  // 操作图标
  undo: { path: 'M4 8h10a4 4 0 010 8H9M7 5L4 8l3 3' },
  redo: { path: 'M16 8H6a4 4 0 000 8h5M13 5l3 3-3 3' },
  save: { path: 'M15 17H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v9a2 2 0 01-2 2zM12 3v5h5M7 13h6M7 16h4' },
  export: { path: 'M10 3v10M6 9l4 4 4-4M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2' },
  import: { path: 'M10 13V3M6 7l4-4 4 4M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2' },
  folder: { path: 'M3 5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5z' },

  // 视图图标
  eye: { path: 'M10 4C5 4 2 10 2 10s3 6 8 6 8-6 8-6-3-6-8-6z', viewBox: '0 0 20 20' },
  'eye-off': { path: 'M3 3l14 14M10 4c-2 0-3.5.8-4.8 2' },
  reset_view: { path: 'M10 6v4l3 2', viewBox: '0 0 20 20' },
  roam: { path: 'M10 2a8 8 0 100 16 8 8 0 000-16z' },

  // UI 图标
  close: { path: 'M5 5l10 10M15 5L5 15' },
  plus: { path: 'M10 4v12M4 10h12' },
  minus: { path: 'M4 10h12' },
  check: { path: 'M5 10l3 3 7-7' },
  chevron_left: { path: 'M12 5l-5 5 5 5' },
  chevron_right: { path: 'M8 5l5 5-5 5' },
  chevron_down: { path: 'M7 8l3 3 3-3' },
  back: { path: 'M12 4l-6 6 6 6' },
  trash: { path: 'M5 6h10M8 6V4h4v2M6 6v10a1 1 0 001 1h6a1 1 0 001-1V6' },
  help: { path: 'M9 9a3 3 0 115.83 1c0 2-3 3-3 3', viewBox: '0 0 24 24' },
  info: { path: 'M10 6v4M10 14h.01' },
  warning: { path: 'M10 2l8 14H2L10 2zM10 7v4M10 13h.01' },
  image: { path: 'M4 16l4-4 3 3 5-5M2 2h16v16H2z' },

  // 建筑图标
  building: { path: 'M3 3h14v14H3zM3 8h14M8 8v9' },
  floor: { path: 'M3 3h14v14H3V3z' },
  area: { path: 'M8 8h32v32H8z', viewBox: '0 0 48 48' },
}

const iconData = computed(() => iconPaths[props.name] || { path: '' })
</script>

<template>
  <svg
    :viewBox="iconData.viewBox || '0 0 20 20'"
    fill="none"
    :width="size"
    :height="size"
    class="builder-icon"
  >
    <path
      :d="iconData.path"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <!-- 特殊图标的额外元素 -->
    <circle v-if="name === 'roam'" cx="10" cy="10" r="2" fill="currentColor" />
    <circle v-if="name === 'reset_view'" cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
    <circle v-if="name === 'help'" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
    <circle v-if="name === 'help'" cx="12" cy="17" r="1" fill="currentColor" />
    <circle v-if="name === 'info'" cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
    <circle v-if="name === 'eye'" cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5" />
  </svg>
</template>

<style scoped>
.builder-icon {
  flex-shrink: 0;
}
</style>
