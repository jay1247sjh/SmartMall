import { ref } from 'vue'

export function useAreaLoading() {
  const loading = ref(false)

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, execute }
}
