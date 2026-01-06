<script setup lang="ts">
/**
 * ============================================================================
 * 打字机效果卡片组件 (TypewriterCard.vue)
 * ============================================================================
 * 
 * 【组件职责】
 * 在卡片中展示打字机效果的文字动画，用于展示产品特性或宣传语
 * 
 * 【使用场景】
 * - 登录页左侧：展示产品核心卖点
 * - 首页 Hero 区域：展示欢迎语
 * - 任何需要动态文字效果的地方
 * 
 * 【动画原理】
 * 1. 逐字显示文本（模拟打字效果）
 * 2. 显示完成后暂停一段时间
 * 3. 切换到下一条文本，循环播放
 * 4. 光标在打字时不闪烁，停止时闪烁
 * 
 * 【技术实现】
 * - 使用 setTimeout 递归调用实现逐字显示
 * - 随机间隔时间让打字节奏更自然（不像机器人）
 * - 组件卸载时清理定时器，防止内存泄漏
 * 
 * ============================================================================
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { ElCard } from 'element-plus'

// ============================================================================
// Props 定义
// ============================================================================

/**
 * 组件属性
 * 
 * @property texts - 要展示的文本数组，会循环播放
 * @property typeSpeed - 打字速度基准值（毫秒），默认 30ms
 * @property pauseTime - 每条文本显示完后的暂停时间（毫秒），默认 2500ms
 */
const props = defineProps<{
  /** 要展示的文本数组 */
  texts: string[]
  /** 打字速度基准值（毫秒），实际速度会在此基础上随机浮动 */
  typeSpeed?: number
  /** 每条文本显示完后的暂停时间（毫秒） */
  pauseTime?: number
}>()

// ============================================================================
// 响应式状态
// ============================================================================

/**
 * 当前显示的文本索引
 * 用于在 texts 数组中循环
 */
const currentIndex = ref(0)

/**
 * 当前已显示的文本内容
 * 逐字累加，从空字符串开始
 */
const displayedText = ref('')

/**
 * 是否正在打字
 * - true: 正在逐字显示，光标不闪烁
 * - false: 显示完成，光标闪烁
 */
const isTyping = ref(true)

// ============================================================================
// 定时器引用
// ============================================================================

/**
 * 打字定时器
 * 用于控制逐字显示的节奏
 */
let typingTimer: number | null = null

/**
 * 暂停定时器
 * 用于控制文本显示完成后的等待时间
 */
let pauseTimer: number | null = null

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 开始打字效果
 * 
 * 【执行流程】
 * 1. 获取当前要显示的文本
 * 2. 重置显示状态
 * 3. 启动逐字显示
 * 4. 显示完成后等待，然后切换到下一条
 */
function typeText() {
  // 获取当前要显示的完整文本
  const fullText = props.texts[currentIndex.value]
  
  // 字符索引，用于追踪当前显示到第几个字符
  let charIndex = 0
  
  // 重置显示状态
  displayedText.value = ''
  isTyping.value = true

  /**
   * 递归打字函数
   * 
   * 【为什么用 setTimeout 而不是 setInterval？】
   * 1. setTimeout 可以每次设置不同的延迟时间，模拟真人打字的节奏变化
   * 2. setInterval 是固定间隔，看起来很机械
   * 3. setTimeout 更容易控制停止时机
   */
  const type = () => {
    // 如果还有字符没显示完
    if (charIndex < fullText.length) {
      // 追加一个字符到显示文本
      displayedText.value += fullText[charIndex]
      charIndex++
      
      /**
       * 计算下一个字符的延迟时间
       * 
       * 公式：Math.random() * 25 + baseSpeed
       * 
       * 【数学分析】
       * - Math.random() 返回 [0, 1) 的随机数
       * - Math.random() * 25 返回 [0, 25) 的随机数
       * - 加上 baseSpeed (默认 30)，最终范围是 [30, 55) 毫秒
       * 
       * 【为什么选这个范围？】
       * - 30ms 最小值：足够快，不会让用户等待
       * - 55ms 最大值：不会太慢，保持流畅感
       * - 25ms 变化范围：增加随机性，更像真人打字
       * - 平均 42.5ms：约 23 字符/秒，感觉自然
       */
      typingTimer = window.setTimeout(
        type, 
        Math.random() * 25 + (props.typeSpeed || 30)
      )
    } else {
      // 当前文本显示完成
      isTyping.value = false  // 停止打字，光标开始闪烁
      
      /**
       * 暂停后切换到下一条文本
       * 
       * 【循环逻辑】
       * (currentIndex + 1) % texts.length
       * 例如：texts.length = 5
       * - 0 → 1 → 2 → 3 → 4 → 0 → 1 → ...
       * 
       * 这样可以无限循环播放所有文本
       */
      pauseTimer = window.setTimeout(() => {
        currentIndex.value = (currentIndex.value + 1) % props.texts.length
        typeText()  // 递归调用，开始下一条文本
      }, props.pauseTime || 2500)
    }
  }
  
  // 启动打字
  type()
}

// ============================================================================
// 生命周期钩子
// ============================================================================

/**
 * 组件挂载时启动打字效果
 * 
 * 【为什么要检查 texts.length > 0？】
 * 防止空数组导致的错误，如果没有文本就不启动动画
 */
onMounted(() => { 
  if (props.texts.length > 0) {
    typeText() 
  }
})

/**
 * 组件卸载时清理定时器
 * 
 * 【为什么要清理？】
 * 如果不清理，会导致：
 * 1. 内存泄漏：定时器持续占用内存
 * 2. 控制台错误：定时器回调尝试更新已销毁组件的状态
 * 3. 性能问题：无用的定时器持续运行
 * 
 * 【场景示例】
 * 用户在登录页，打字机正在运行
 * 用户点击"注册"跳转到注册页
 * 登录页组件被销毁，但定时器还在运行...
 * 
 * 这就是为什么 Vue 组件中使用定时器、事件监听器等
 * 都需要在 onUnmounted 中清理
 */
onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (pauseTimer) clearTimeout(pauseTimer)
})
</script>

<template>
  <!--
    ============================================================================
    模板结构
    ============================================================================
    
    使用 Element Plus 的 ElCard 组件作为容器
    shadow="never" 表示不显示阴影，保持简洁
  -->
  <ElCard shadow="never" class="typewriter-card">
    <!--
      打字机内容区域
      - typewriter-text: 已显示的文本
      - cursor: 光标，打字时不闪烁，停止时闪烁
    -->
    <p class="typewriter-content">
      <span class="typewriter-text">{{ displayedText }}</span>
      <span class="cursor" :class="{ typing: isTyping }"></span>
    </p>
  </ElCard>
</template>

<style scoped lang="scss">
/**
 * ============================================================================
 * 样式说明
 * ============================================================================
 * 
 * 【设计风格】
 * - 半透明背景：融入深色主题
 * - 细边框：增加层次感
 * - 圆角：现代感
 * 
 * 【光标动画】
 * - 打字时：光标常亮（不闪烁）
 * - 停止时：光标闪烁（吸引注意力）
 */

.typewriter-card {
  /* 半透明背景，融入深色主题 */
  background: rgba(255, 255, 255, 0.03);
  
  /* 细边框，增加层次感 */
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  /* 圆角，现代感 */
  border-radius: 12px;

  /* 穿透 Element Plus 卡片内边距 */
  :deep(.el-card__body) {
    padding: 20px 24px;
  }

  /* 打字机内容区域 */
  .typewriter-content {
    /* 最小高度，防止内容为空时卡片塌陷 */
    min-height: 24px;
    line-height: 24px;
    margin: 0;

    /* 文本样式 */
    .typewriter-text {
      font-size: 14px;
      color: #bdc1c6;  /* 浅灰色，适合深色背景 */
      line-height: 24px;
      vertical-align: middle;
    }

    /* 光标样式 */
    .cursor {
      display: inline-block;
      width: 2px;
      height: 16px;
      background: #8ab4f8;  /* Google 蓝色 */
      margin-left: 1px;
      vertical-align: middle;
      
      /* 默认闪烁动画（停止打字时） */
      animation: blink 1s step-end infinite;

      /* 打字时不闪烁 */
      &.typing {
        animation: none;
      }
    }
  }
}

/**
 * 光标闪烁动画
 * 
 * 【动画原理】
 * - 0-50%: 光标可见 (opacity: 1)
 * - 51-100%: 光标隐藏 (opacity: 0)
 * - step-end: 不使用渐变，直接跳变（更像真实光标）
 * - infinite: 无限循环
 */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
