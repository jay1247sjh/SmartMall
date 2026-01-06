<script setup lang="ts">
/**
 * ============================================================================
 * 功能特性列表组件 (FeatureList)
 * ============================================================================
 *
 * 【业务职责】
 * 在认证页面左侧展示系统的核心功能特性，起到：
 * 1. 产品宣传 - 向新用户介绍系统能力
 * 2. 价值传递 - 说明使用系统能获得什么
 * 3. 视觉平衡 - 填充左侧空间，与右侧表单形成对称
 *
 * 【展示内容示例】
 * - "3D 可视化商场管理"
 * - "实时数据分析与报表"
 * - "多角色权限管理"
 * - "商户入驻与店铺管理"
 *
 * 【设计原则】
 * 1. Element Plus 优先 - 使用 ElIcon 显示勾选图标
 * 2. HTML5 语义化 - ul/li 列表结构，role="list" 增强语义
 * 3. 简洁明了 - 每条特性一句话，快速传达价值
 *
 * 【视觉设计】
 * - 绿色勾选图标：传达"已具备"、"可用"的积极信息
 * - 垂直排列：便于快速浏览
 * - 适中间距：14px gap，不拥挤也不松散
 * - 柔和文字色：#bdc1c6，不抢夺表单区域的注意力
 *
 * 【使用位置】
 * 在 AuthLayout 组件的左侧区域使用，配合 TypewriterCard 组件
 * 共同构成认证页面的品牌展示区。
 * ============================================================================
 */
import { CircleCheck } from '@element-plus/icons-vue'

/**
 * 组件属性定义
 *
 * @property features - 功能特性文字数组
 *   - 每个元素是一条功能描述
 *   - 建议 4-6 条，过多会显得冗长
 *   - 每条控制在 15 字以内，便于快速阅读
 *
 * 【示例】
 * :features="[
 *   '3D 可视化商场管理',
 *   '实时数据分析与报表',
 *   '多角色权限管理',
 *   '商户入驻与店铺管理'
 * ]"
 */
defineProps<{
  features: string[]
}>()
</script>

<template>
  <ul class="feature-list" role="list">
    <li v-for="(feature, index) in features" :key="index" class="feature-item">
      <ElIcon :size="20" class="feature-icon">
        <CircleCheck />
      </ElIcon>
      <span>{{ feature }}</span>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
  padding: 0;
  margin: 0;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #bdc1c6;
    font-size: 14px;

    .feature-icon {
      color: #81c995;
      flex-shrink: 0;
    }
  }
}
</style>
