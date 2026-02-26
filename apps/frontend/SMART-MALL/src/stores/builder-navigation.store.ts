import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  NavigationRouteData,
  NavigationTargetData,
  NavigationTargetType,
} from '@/api/mall-manage.api'

export type NavigationExecutionMode = 'none' | 'auto' | 'camera'

export interface BuilderNavigationIntent {
  targetType: NavigationTargetType
  targetKeyword: string
  source?: 'ai-tool' | 'manual'
  rawArgs?: Record<string, unknown>
  rawResult?: Record<string, unknown>
  createdAt: number
}

export interface BuilderNavigationErrorState {
  code: string
  message: string
}

export const useBuilderNavigationStore = defineStore('builderNavigation', () => {
  const pendingIntent = ref<BuilderNavigationIntent | null>(null)
  const activeRoute = ref<NavigationRouteData | null>(null)
  const activeTarget = ref<NavigationTargetData | null>(null)
  const warnings = ref<string[]>([])
  const executionMode = ref<NavigationExecutionMode>('none')
  const isAutoNavigating = ref(false)
  const errorState = ref<BuilderNavigationErrorState | null>(null)

  const currentFloorId = ref<string | null>(null)
  const currentPosition = ref<{ x: number; y: number; z: number } | null>(null)

  function setPendingIntent(intent: BuilderNavigationIntent) {
    pendingIntent.value = intent
  }

  function clearPendingIntent() {
    pendingIntent.value = null
  }

  function setActivePlan(route: NavigationRouteData, target: NavigationTargetData, planWarnings?: string[]) {
    activeRoute.value = route
    activeTarget.value = target
    warnings.value = planWarnings ?? []
    errorState.value = null
  }

  function clearActivePlan() {
    activeRoute.value = null
    activeTarget.value = null
    warnings.value = []
    executionMode.value = 'none'
    isAutoNavigating.value = false
  }

  function setExecutionMode(mode: NavigationExecutionMode) {
    executionMode.value = mode
  }

  function setAutoNavigating(value: boolean) {
    isAutoNavigating.value = value
  }

  function setError(code: string, message: string) {
    errorState.value = { code, message }
  }

  function clearError() {
    errorState.value = null
  }

  function updateContext(payload: {
    floorId?: string | null
    position?: { x: number; y: number; z: number } | null
  }) {
    if (payload.floorId !== undefined) {
      currentFloorId.value = payload.floorId
    }
    if (payload.position !== undefined) {
      currentPosition.value = payload.position
    }
  }

  return {
    pendingIntent,
    activeRoute,
    activeTarget,
    warnings,
    executionMode,
    isAutoNavigating,
    errorState,
    currentFloorId,
    currentPosition,
    setPendingIntent,
    clearPendingIntent,
    setActivePlan,
    clearActivePlan,
    setExecutionMode,
    setAutoNavigating,
    setError,
    clearError,
    updateContext,
  }
})
