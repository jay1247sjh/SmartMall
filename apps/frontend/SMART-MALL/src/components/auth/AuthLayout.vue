<script setup lang="ts">
/**
 * ============================================================================
 * 认证页面布局组件 (AuthLayout.vue)
 * ============================================================================
 * 
 * 【组件职责】
 * 为所有认证相关页面（登录、注册、忘记密码等）提供统一的布局结构。
 * 
 * 【布局结构】
 * 采用左右分栏设计，这是现代 SaaS 产品常见的认证页面布局：
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │                    │                                    │
 * │   品牌展示区        │         表单区                     │
 * │   (55%)            │         (45%)                      │
 * │                    │                                    │
 * │   - 系统名称        │         - Logo                     │
 * │   - 标语           │         - 表单卡片                  │
 * │   - 产品特性        │         - 底部链接                  │
 * │                    │                                    │
 * └─────────────────────────────────────────────────────────┘
 * 
 * 【设计参考】
 * - Notion 登录页
 * - Figma 登录页
 * - Linear 登录页
 * 
 * 【响应式设计】
 * - 大屏（>1600px）：更大的字体和间距
 * - 中屏（900-1200px）：适当缩小品牌区
 * - 小屏（<768px）：隐藏品牌区，只显示表单
 * 
 * 【视觉效果】
 * - 渐变背景：多层径向渐变，营造科技感
 * - 网格背景：细微的网格线，增加层次感
 * - 光晕效果：模糊的彩色光斑，增加动态感
 * - 渐变文字：标题使用渐变色，吸引注意力
 * 
 * 【使用示例】
 * ```vue
 * <AuthLayout
 *   brand-headline="重新定义商城管理的可能性"
 *   brand-subtitle="融合 3D 可视化与 AI 智能"
 * >
 *   <template #brand-extra>
 *     <TypewriterCard :texts="featureTexts" />
 *   </template>
 *   
 *   <AuthFormCard title="欢迎回来">
 *     <!-- 表单内容 -->
 *   </AuthFormCard>
 * </AuthLayout>
 * ```
 * 
 * ============================================================================
 */

import { ElIcon } from 'element-plus'
import { Box } from '@element-plus/icons-vue'

/**
 * 组件属性
 * 
 * @property brandTitle - 品牌名称，默认 "Smart Mall"
 * @property brandHeadline - 主标语，大字展示
 * @property brandSubtitle - 副标语，小字说明
 */
defineProps<{
  brandTitle?: string
  brandHeadline?: string
  brandSubtitle?: string
}>()
</script>

<template>
  <!--
    ============================================================================
    页面主容器
    ============================================================================
    
    使用 <main> 语义化标签，表示页面主要内容区域
    Flexbox 布局实现左右分栏
  -->
  <main class="auth-page">
    <!--
      ============================================================================
      左侧：品牌展示区
      ============================================================================
      
      使用 <aside> 语义化标签，表示辅助内容区域
      虽然视觉上占据较大空间，但从内容角度是辅助信息
    -->
    <aside class="brand-panel">
      <!--
        背景效果层
        包含多层视觉效果，营造科技感
      -->
      <div class="brand-bg">
        <!-- 多层径向渐变，营造深度感 -->
        <div class="bg-gradient"></div>
        
        <!-- 网格背景，增加科技感 -->
        <div class="bg-grid"></div>
        
        <!-- 光晕效果，增加动态感 -->
        <div class="bg-glow bg-glow-1"></div>
        <div class="bg-glow bg-glow-2"></div>
      </div>
      
      <!--
        品牌内容区
        使用 <article> 表示独立的内容块
      -->
      <article class="brand-content">
        <!--
          标题组
          使用 <hgroup> 将相关的标题元素组合在一起
        -->
        <hgroup>
          <!-- 系统名称，使用渐变色动画 -->
          <h1 class="system-title">{{ brandTitle || 'Smart Mall' }}</h1>
          
          <!-- 主标语 -->
          <h2 class="system-headline">{{ brandHeadline }}</h2>
          
          <!-- 副标语 -->
          <p class="system-subtitle">{{ brandSubtitle }}</p>
        </hgroup>
        
        <!--
          额外内容插槽
          用于放置打字机效果卡片、功能列表等
        -->
        <slot name="brand-extra"></slot>
      </article>
    </aside>

    <!--
      ============================================================================
      右侧：表单区
      ============================================================================
      
      使用 <section> 语义化标签，表示页面的一个独立部分
    -->
    <section class="form-panel">
      <!-- 背景效果 -->
      <div class="form-panel-bg"></div>
      
      <!--
        表单容器
        使用 <article> 表示独立的内容块
      -->
      <article class="form-container">
        <!--
          Logo 区域
          显示系统图标，增加品牌识别度
        -->
        <header class="form-logo">
          <ElIcon :size="24" class="logo-icon">
            <Box />
          </ElIcon>
        </header>
        
        <!--
          默认插槽
          用于放置 AuthFormCard 组件
        -->
        <slot></slot>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
/**
 * ============================================================================
 * 样式说明
 * ============================================================================
 * 
 * 【颜色方案】
 * - 背景色：#0a0a0a（接近纯黑）
 * - 主文字：#e8eaed（浅灰白）
 * - 次文字：#9aa0a6（中灰）
 * - 强调色：蓝紫渐变（#60a5fa → #a78bfa → #f472b6）
 * 
 * 【设计原则】
 * - 深色主题，减少视觉疲劳
 * - 渐变色增加视觉层次
 * - 微妙的动画增加生命力
 */

/* 页面主容器 */
.auth-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;
}

/* 左侧品牌区 */
.brand-panel {
  flex: 0 0 55%;  /* 固定占 55% 宽度 */
  display: flex;
  align-items: center;
  padding: 80px 100px;
  position: relative;
  overflow: hidden;

  /* 背景效果容器 */
  .brand-bg {
    position: absolute;
    inset: 0;  /* 等同于 top: 0; right: 0; bottom: 0; left: 0; */
    pointer-events: none;  /* 不响应鼠标事件 */

    /* 多层径向渐变 */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse 50% 50% at 60% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
    }

    /* 网格背景 */
    .bg-grid {
      position: absolute;
      inset: 0;
      /* 使用线性渐变创建网格线 */
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      /* 使用遮罩让网格在边缘渐隐 */
      mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
    }

    /* 光晕效果 */
    .bg-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);  /* 模糊效果 */

      /* 右上角蓝紫光晕 */
      &.bg-glow-1 {
        width: 400px;
        height: 400px;
        top: -100px;
        right: -50px;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        opacity: 0.4;
      }

      /* 左下角粉橙光晕 */
      &.bg-glow-2 {
        width: 300px;
        height: 300px;
        bottom: -50px;
        left: 10%;
        background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
        opacity: 0.25;
      }
    }
  }

  /* 品牌内容 */
  .brand-content {
    position: relative;
    z-index: 1;  /* 确保在背景效果之上 */
    max-width: 560px;

    hgroup {
      /* 系统名称 - 渐变色动画 */
      .system-title {
        font-size: 64px;
        font-weight: 500;
        letter-spacing: -0.03em;  /* 紧凑字间距 */
        line-height: 1.1;
        margin: 0 0 32px 0;
        /* 渐变色文字 */
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f472b6 70%, #fb923c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        /* 渐变动画 */
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }

      /* 主标语 */
      .system-headline {
        font-size: 28px;
        font-weight: 400;
        color: #e8eaed;
        line-height: 1.4;
        margin: 0 0 16px 0;
      }

      /* 副标语 */
      .system-subtitle {
        font-size: 15px;
        color: #9aa0a6;
        line-height: 1.6;
        margin: 0 0 40px 0;
      }
    }
  }
}

/* 右侧表单区 */
.form-panel {
  flex: 1;  /* 占据剩余空间 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 64px;
  position: relative;
  overflow: hidden;

  /* 背景效果 */
  .form-panel-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 100% 80% at 80% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }

  /* 表单容器 */
  .form-container {
    position: relative;
    width: 100%;
    max-width: 400px;

    /* Logo */
    .form-logo {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;

      .logo-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(96, 165, 250, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #8ab4f8;
      }
    }
  }
}

/* 渐变色动画 */
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ============================================================================
 * 响应式设计
 * ============================================================================ */

/* 中大屏 */
@media (max-width: 1200px) {
  .brand-panel {
    padding: 60px;

    .brand-content hgroup {
      .system-title { font-size: 52px; }
      .system-headline { font-size: 24px; }
    }
  }
}

/* 中屏 */
@media (max-width: 900px) {
  .brand-panel {
    flex: 0 0 45%;
    padding: 48px;

    .brand-content hgroup {
      .system-title { font-size: 44px; }
      .system-headline { font-size: 20px; }
    }
  }
}

/* 小屏 - 隐藏品牌区 */
@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel {
    padding: 32px 24px;
    min-height: 100vh;

    .form-container { max-width: 100%; }
  }
}

/* 超大屏 */
@media (min-width: 1600px) {
  .brand-panel {
    padding: 100px 140px;

    .brand-content hgroup {
      .system-title { font-size: 72px; }
      .system-headline { font-size: 32px; }
    }
  }
}
</style>
