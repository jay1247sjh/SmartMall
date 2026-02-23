// api/loading-interceptor.ts
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useLoadingStore } from '@/stores/loading.store'

const LOADING_FLAG = Symbol('showLoading')

interface LoadingRequestConfig extends InternalAxiosRequestConfig {
  showLoading?: boolean
  [LOADING_FLAG]?: boolean
}

export function setupLoadingInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const reqConfig = config as LoadingRequestConfig
    if (reqConfig.showLoading) {
      reqConfig[LOADING_FLAG] = true
      const loadingStore = useLoadingStore()
      loadingStore.incrementRequests()
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      const reqConfig = response.config as LoadingRequestConfig
      if (reqConfig[LOADING_FLAG]) {
        const loadingStore = useLoadingStore()
        loadingStore.decrementRequests()
      }
      return response
    },
    (error) => {
      const reqConfig = error?.config as LoadingRequestConfig | undefined
      if (reqConfig?.[LOADING_FLAG]) {
        const loadingStore = useLoadingStore()
        loadingStore.decrementRequests()
      }
      return Promise.reject(error)
    }
  )
}
