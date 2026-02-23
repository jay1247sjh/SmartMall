import { ref, computed } from 'vue'

export function useSkeletonLoader() {
  const hasLoaded = ref(false)
  const loading = ref(true)

  const isFirstLoad = computed(() => !hasLoaded.value && loading.value)

  function startLoading(): void {
    loading.value = true
  }

  function finishLoading(): void {
    loading.value = false
    hasLoaded.value = true
  }

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    startLoading()
    try {
      const result = await fn()
      finishLoading()
      return result
    } catch (e) {
      loading.value = false
      throw e
    }
  }

  return { isFirstLoad, loading, hasLoaded, startLoading, finishLoading, execute }
}
