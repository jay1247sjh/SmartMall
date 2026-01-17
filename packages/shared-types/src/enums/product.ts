/**
 * 商品状态枚举
 * 
 * @shared 前端、后端、AI服务共用
 */
export enum ProductStatus {
  /** 在售 */
  ON_SALE = 'ON_SALE',
  /** 下架 */
  OFF_SALE = 'OFF_SALE',
  /** 售罄 */
  SOLD_OUT = 'SOLD_OUT'
}

/**
 * 商品状态显示名称映射
 */
export const PRODUCT_STATUS_NAMES: Record<ProductStatus, string> = {
  [ProductStatus.ON_SALE]: '在售',
  [ProductStatus.OFF_SALE]: '下架',
  [ProductStatus.SOLD_OUT]: '售罄'
}

/**
 * 商品状态颜色映射
 */
export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  [ProductStatus.ON_SALE]: '#10b981',  // 绿色
  [ProductStatus.OFF_SALE]: '#6b7280', // 灰色
  [ProductStatus.SOLD_OUT]: '#ef4444'  // 红色
}
