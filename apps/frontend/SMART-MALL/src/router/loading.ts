// router/loading.ts
import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { useLoadingStore } from '@/stores/loading.store'

export function setupRouterLoading(router: Router): void {
  NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 })

  router.beforeEach((_to, _from, next) => {
    const loadingStore = useLoadingStore()
    loadingStore.startRouteLoading()
    NProgress.start()
    next()
  })

  router.afterEach(() => {
    const loadingStore = useLoadingStore()
    loadingStore.stopRouteLoading()
    NProgress.done()
  })

  router.onError(() => {
    const loadingStore = useLoadingStore()
    loadingStore.stopRouteLoading()
    NProgress.done()
  })
}
