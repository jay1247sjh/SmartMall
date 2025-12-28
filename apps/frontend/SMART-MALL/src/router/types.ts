/**
 * 路由类型定义
 * 
 * 定义后端返回的路由配置结构
 */

/**
 * 路由元信息
 */
export interface RouteMeta {
  /** 页面标题 */
  title?: string
  /** 允许访问的角色列表 */
  roles?: string[]
  /** 菜单图标 */
  icon?: string
  /** 是否在菜单中隐藏 */
  hidden?: boolean
  /** 是否缓存组件 */
  keepAlive?: boolean
  /** 页面权限标识 */
  permission?: string
  /** 系统模式（CONFIG/RUNTIME） */
  mode?: 'CONFIG' | 'RUNTIME'
  /** 排序权重 */
  order?: number
}

/**
 * 后端返回的路由配置
 * component 是字符串标识符，需要前端映射为真实组件
 */
export interface RouteConfig {
  /** 路由路径 */
  path: string
  /** 路由名称 */
  name: string
  /** 组件标识符（如 'MallView'，不是真实组件） */
  component: string
  /** 重定向路径 */
  redirect?: string
  /** 路由元信息 */
  meta?: RouteMeta
  /** 子路由 */
  children?: RouteConfig[]
}
