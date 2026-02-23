import { ref } from 'vue'

export function useButtonLoading<T extends (...args: any[]) => Promise<any>>(handler: T) {
  const loading = ref(false)

  async function run(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (loading.value) return undefined as any
    loading.value = true
    try {
      return await handler(...args)
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
