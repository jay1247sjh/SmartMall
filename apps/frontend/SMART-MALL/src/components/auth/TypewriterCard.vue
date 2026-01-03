<script setup lang="ts">
/**
 * 打字机效果卡片组件
 * 用于品牌面板展示动态文字效果
 */
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  /** 要循环展示的文字列表 */
  texts: string[]
  /** 打字速度（毫秒） */
  typeSpeed?: number
  /** 停顿时间（毫秒） */
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
  <div class="typewriter-card">
    <div class="typewriter-content">
      <span class="typewriter-text">{{ displayedText }}</span>
      <span class="cursor" :class="{ typing: isTyping }"></span>
    </div>
  </div>
</template>

<style scoped>
.typewriter-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px 24px;
}

.typewriter-content {
  min-height: 24px;
  line-height: 24px;
}

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
}

.cursor.typing { 
  animation: none; 
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
