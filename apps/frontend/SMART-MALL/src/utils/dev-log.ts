/**
 * 仅在开发环境输出日志，避免生产环境控制台噪音与无效开销。
 */
const isDev = import.meta.env.DEV

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args)
  }
}
