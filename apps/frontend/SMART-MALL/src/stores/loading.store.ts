// stores/loading.store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElLoading } from 'element-plus'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'

const MINIMUM_DISPLAY_TIME = 300 // ms

export const useLoadingStore = defineStore('loading', () => {
  // --- State ---
  const isRouteLoading = ref(false)
  const activeRequestCount = ref(0)
  const isFullscreenVisible = ref(false)

  // --- Internal ---
  let fullscreenInstance: LoadingInstance | null = null
  let showTimestamp = 0
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  // --- Computed ---
  const hasActiveRequests = computed(() => activeRequestCount.value > 0)

  // --- Actions ---
  function startRouteLoading(): void {
    isRouteLoading.value = true
  }

  function stopRouteLoading(): void {
    isRouteLoading.value = false
  }

  function incrementRequests(): void {
    activeRequestCount.value++
    if (activeRequestCount.value === 1) {
      showFullscreen()
    }
  }

  function decrementRequests(): void {
    activeRequestCount.value = Math.max(0, activeRequestCount.value - 1)
    if (activeRequestCount.value === 0) {
      hideFullscreenWithDelay()
    }
  }

  function forceReset(): void {
    activeRequestCount.value = 0
    isRouteLoading.value = false
    closeFullscreen()
  }

  // --- Internal helpers ---
  function showFullscreen(): void {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    if (!fullscreenInstance) {
      fullscreenInstance = ElLoading.service({
        lock: true,
        background: 'rgba(0, 0, 0, 0.5)',
      })
    }
    showTimestamp = Date.now()
    isFullscreenVisible.value = true
  }

  function hideFullscreenWithDelay(): void {
    const elapsed = Date.now() - showTimestamp
    const remaining = MINIMUM_DISPLAY_TIME - elapsed

    if (remaining > 0) {
      hideTimer = setTimeout(() => {
        closeFullscreen()
      }, remaining)
    } else {
      closeFullscreen()
    }
  }

  function closeFullscreen(): void {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    fullscreenInstance?.close()
    fullscreenInstance = null
    isFullscreenVisible.value = false
  }

  return {
    // State
    isRouteLoading,
    activeRequestCount,
    isFullscreenVisible,
    // Computed
    hasActiveRequests,
    // Actions
    startRouteLoading,
    stopRouteLoading,
    incrementRequests,
    decrementRequests,
    forceReset,
  }
})
