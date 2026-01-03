<script setup lang="ts">
/**
 * 认证页面布局组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ElIcon } from 'element-plus'
import { Box } from '@element-plus/icons-vue'

defineProps<{
  brandTitle?: string
  brandHeadline?: string
  brandSubtitle?: string
}>()
</script>

<template>
  <main class="auth-page">
    <!-- Left: Brand Panel -->
    <aside class="brand-panel">
      <div class="brand-bg">
        <div class="bg-gradient"></div>
        <div class="bg-grid"></div>
        <div class="bg-glow bg-glow-1"></div>
        <div class="bg-glow bg-glow-2"></div>
      </div>
      
      <article class="brand-content">
        <hgroup>
          <h1 class="system-title">{{ brandTitle || 'Smart Mall' }}</h1>
          <h2 class="system-headline">{{ brandHeadline }}</h2>
          <p class="system-subtitle">{{ brandSubtitle }}</p>
        </hgroup>
        <slot name="brand-extra"></slot>
      </article>
    </aside>

    <!-- Right: Form Panel -->
    <section class="form-panel">
      <div class="form-panel-bg"></div>
      
      <article class="form-container">
        <header class="form-logo">
          <ElIcon :size="24" class="logo-icon">
            <Box />
          </ElIcon>
        </header>
        <slot></slot>
      </article>
    </section>
  </main>
</template>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  display: flex;
  background-color: #0a0a0a;
}

.brand-panel {
  flex: 0 0 55%;
  display: flex;
  align-items: center;
  padding: 80px 100px;
  position: relative;
  overflow: hidden;

  .brand-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;

    .bg-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 50%),
                  radial-gradient(ellipse 50% 50% at 60% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 70%);
    }

    .bg-glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);

      &.bg-glow-1 {
        width: 400px;
        height: 400px;
        top: -100px;
        right: -50px;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        opacity: 0.4;
      }

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

  .brand-content {
    position: relative;
    z-index: 1;
    max-width: 560px;

    hgroup {
      .system-title {
        font-size: 64px;
        font-weight: 500;
        letter-spacing: -0.03em;
        line-height: 1.1;
        margin: 0 0 32px 0;
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f472b6 70%, #fb923c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }

      .system-headline {
        font-size: 28px;
        font-weight: 400;
        color: #e8eaed;
        line-height: 1.4;
        margin: 0 0 16px 0;
      }

      .system-subtitle {
        font-size: 15px;
        color: #9aa0a6;
        line-height: 1.6;
        margin: 0 0 40px 0;
      }
    }
  }
}

.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 64px;
  position: relative;
  overflow: hidden;

  .form-panel-bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 100% 80% at 80% 20%, rgba(59, 130, 246, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }

  .form-container {
    position: relative;
    width: 100%;
    max-width: 400px;

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

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

// Responsive
@media (max-width: 1200px) {
  .brand-panel {
    padding: 60px;

    .brand-content hgroup {
      .system-title { font-size: 52px; }
      .system-headline { font-size: 24px; }
    }
  }
}

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

@media (max-width: 768px) {
  .brand-panel { display: none; }
  .form-panel {
    padding: 32px 24px;
    min-height: 100vh;

    .form-container { max-width: 100%; }
  }
}

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
