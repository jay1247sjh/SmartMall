<script setup lang="ts">
/**
 * 打字机效果卡片组件
 * 使用 Element Plus 组件 + HTML5 语义化标签
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { ElCard } from 'element-plus'

const props = defineProps<{
  texts: string[]
  typeSpeed?: number
  pauseTime?: number
}>()

const currentIndex = ref(0)
const displayedText = ref('')
const isTyping = ref(true)
let typingTimer: number | null = null
let pauseTimer: number | null = null

function typeText() {
  const fullText = props.texts[currentIndex.value]
  let charIndex = 0
  displayedText.value = ''
  isTyping.value = true

  const type = () => {
    if (charIndex < fullText.length) {
      displayedText.value += fullText[charIndex]
      charIndex++
      typingTimer = window.setTimeout(type, Math.random() * 25 + (props.typeSpeed || 30))
    } else {
      isTyping.value = false
      pauseTimer = window.setTimeout(() => {
        currentIndex.value = (currentIndex.value + 1) % props.texts.length
        typeText()
      }, props.pauseTime || 2500)
    }
  }
  type()
}

onMounted(() => { 
  if (props.texts.length > 0) {
    typeText() 
  }
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
  if (pauseTimer) clearTimeout(pauseTimer)
})
</script>

<template>
  <ElCard shadow="never" class="typewriter-card">
    <p class="typewriter-content">
      <span class="typewriter-text">{{ displayedText }}</span>
      <span class="cursor" :class="{ typing: isTyping }"></span>
    </p>
  </ElCard>
</template>

<style scoped lang="scss">
.typewriter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  :deep(.el-card__body) {
    padding: 20px 24px;
  }

  .typewriter-content {
    min-height: 24px;
    line-height: 24px;
    margin: 0;

    .typewriter-text {
      font-size: 14px;
      color: #bdc1c6;
      line-height: 24px;
      vertical-align: middle;
    }

    .cursor {
      display: inline-block;
      width: 2px;
      height: 16px;
      background: #8ab4f8;
      margin-left: 1px;
      vertical-align: middle;
      animation: blink 1s step-end infinite;

      &.typing {
        animation: none;
      }
    }
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
