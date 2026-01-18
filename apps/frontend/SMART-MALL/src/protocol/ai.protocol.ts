/**
 * AI 协议 - 事件载荷类型定义
 * 
 * 定义 AI 助手与 3D 场景交互的事件载荷结构。
 * 这些类型用于 AiChatPanel 组件向父组件传递 AI 指令。
 */

import type { Vector3D } from '../domain/scene/scene.types'

/**
 * AI 导航事件载荷
 * 
 * 【业务场景】
 * - AI 助手推荐店铺后，触发相机飞行到目标位置
 * - 用户询问店铺位置，AI 返回导航指令
 */
export interface AiNavigatePayload {
  /** 目标店铺 ID */
  storeId: string
  /** 目标位置坐标 */
  position: Vector3D
}

/**
 * AI 高亮事件载荷
 * 
 * 【业务场景】
 * - AI 推荐多个店铺时，高亮显示推荐结果
 * - AI 介绍商品时，高亮显示相关店铺或商品
 */
export interface AiHighlightPayload {
  /** 高亮对象类型 */
  type: 'store' | 'product'
  /** 对象 ID */
  id: string
}

/**
 * AI 显示详情事件载荷
 * 
 * 【业务场景】
 * - AI 回答店铺信息后，自动弹出店铺详情面板
 * - AI 介绍商品后，显示商品详情
 */
export interface AiShowDetailPayload {
  /** 详情对象类型 */
  type: 'store' | 'product'
  /** 对象 ID */
  id: string
}

/**
 * AI 事件类型枚举
 */
export enum AiEventType {
  /** 导航到指定位置 */
  NAVIGATE = 'navigate',
  /** 高亮显示对象 */
  HIGHLIGHT = 'highlight',
  /** 显示对象详情 */
  SHOW_DETAIL = 'show-detail',
}

/**
 * AI 事件载荷映射
 * 根据事件类型获取对应的载荷类型
 */
export interface AiEventPayloadMap {
  [AiEventType.NAVIGATE]: AiNavigatePayload
  [AiEventType.HIGHLIGHT]: AiHighlightPayload
  [AiEventType.SHOW_DETAIL]: AiShowDetailPayload
}
