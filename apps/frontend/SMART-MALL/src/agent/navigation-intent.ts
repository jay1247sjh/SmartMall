import type { NavigationExecutionPreference } from '@/stores/builder-navigation.store'

const AUTO_PATTERNS: RegExp[] = [
  /带我去/u,
  /导航到/u,
  /直接过去/u,
  /\bgo to\b/i,
  /\btake me to\b/i,
  /\bnavigate me to\b/i,
]

const MANUAL_PATTERNS: RegExp[] = [
  /在哪/u,
  /在哪里/u,
  /位置/u,
  /\bhow to find\b/i,
  /\bwhere is\b/i,
]

function asString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return null
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(text))
}

export function resolveNavigationExecutionPreference(userText: string): NavigationExecutionPreference {
  const normalized = userText.trim()
  if (!normalized) {
    return 'manual'
  }

  const hitAuto = matchesAny(normalized, AUTO_PATTERNS)
  const hitManual = matchesAny(normalized, MANUAL_PATTERNS)

  if (hitAuto) {
    return 'auto'
  }
  if (hitManual) {
    return 'manual'
  }
  return 'manual'
}

export function extractNavigationKeyword(
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  fieldNames: string[],
): string | null {
  for (const name of fieldNames) {
    const fromArgs = asString(args[name])
    if (fromArgs) {
      return fromArgs
    }

    const fromResult = asString(result[name])
    if (fromResult) {
      return fromResult
    }
  }
  return null
}
