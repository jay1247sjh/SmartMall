import { onUnmounted, ref } from 'vue'
import { intelligenceApi, type VoiceCapabilities, type VoiceWsEvent } from '@/api/intelligence.api'

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'error'

interface UseVoiceSessionOptions {
  language?: string
  onAsrPartial?: (text: string) => void
  onAsrFinal?: (text: string) => void
  onAssistantDelta?: (text: string) => void
  onAssistantFinal?: (text: string) => void
  onConfirmationRequired?: (payload: { action: string; args?: Record<string, unknown>; message?: string }) => void
  onError?: (message: string) => void
  onModeInfo?: (capabilities: VoiceCapabilities) => void
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: unknown) => void) | null
  onerror: ((event: unknown) => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
    SpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}) {
  const voiceState = ref<VoiceState>('idle')
  const isConnected = ref(false)
  const isListening = ref(false)
  const asrPartial = ref('')
  const assistantPartial = ref('')
  const modeHint = ref('')
  const isDegradedMode = ref(false)

  let ws: WebSocket | null = null
  let mediaRecorder: MediaRecorder | null = null
  let mediaStream: MediaStream | null = null
  let recognition: SpeechRecognitionLike | null = null
  let currentAudio: HTMLAudioElement | null = null
  let ttsQueue: string[] = []
  let isPlaying = false

  async function ensureSession(): Promise<void> {
    if (ws && isConnected.value) return

    const session = await intelligenceApi.createVoiceSession({
      scene: 'ai-assistant',
      language: options.language ?? 'zh-CN',
    })

    await new Promise<void>((resolve, reject) => {
      ws = new WebSocket(session.wsUrl)
      ws.onopen = () => {
        isConnected.value = true
        ws?.send(JSON.stringify({ type: 'start', language: options.language ?? 'zh-CN' }))
        resolve()
      }
      ws.onerror = () => reject(new Error('语音连接失败'))
      ws.onclose = () => {
        isConnected.value = false
        isListening.value = false
      }
      ws.onmessage = (event) => handleWsEvent(event.data)
    })
  }

  function handleWsEvent(raw: string) {
    let event: VoiceWsEvent
    try {
      event = JSON.parse(raw) as VoiceWsEvent
    } catch {
      return
    }

    if (event.type === 'asr_partial') {
      asrPartial.value = event.text
      options.onAsrPartial?.(event.text)
      return
    }
    if (event.type === 'asr_final') {
      asrPartial.value = event.text
      options.onAsrFinal?.(event.text)
      return
    }
    if (event.type === 'assistant_text_delta') {
      assistantPartial.value += event.text
      voiceState.value = 'thinking'
      options.onAssistantDelta?.(event.text)
      return
    }
    if (event.type === 'assistant_text_final') {
      assistantPartial.value = event.text
      options.onAssistantFinal?.(event.text)
      return
    }
    if (event.type === 'tts_chunk') {
      ttsQueue.push(event.audio_base64)
      playNextAudio()
      return
    }
    if (event.type === 'confirmation_required') {
      options.onConfirmationRequired?.({
        action: event.action,
        args: event.args,
        message: event.message,
      })
      return
    }
    if (event.type === 'done') {
      if (event.status === 'interrupted') {
        voiceState.value = 'interrupted'
      } else if (!isPlaying) {
        voiceState.value = 'idle'
      }
      return
    }
    if (event.type === 'error') {
      voiceState.value = 'error'
      options.onError?.(event.message)
      return
    }
    if (event.type === 'session_ready') {
      const capabilities = event.capabilities
      if (capabilities) {
        isDegradedMode.value = Boolean(capabilities.degraded)
        modeHint.value = capabilities.message || ''
        options.onModeInfo?.(capabilities)
      }
    }
  }

  async function startListening() {
    if (isListening.value) return
    assistantPartial.value = ''
    asrPartial.value = ''

    await ensureSession()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('语音会话未就绪')
    }

    if (voiceState.value === 'speaking') {
      interrupt()
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(mediaStream)
    mediaRecorder.ondataavailable = async (event) => {
      if (!event.data || event.data.size === 0 || !ws || ws.readyState !== WebSocket.OPEN) return
      const audioBase64 = await blobToBase64(event.data)
      ws.send(JSON.stringify({ type: 'audio_chunk', audio_base64: audioBase64 }))
    }
    mediaRecorder.start(250)

    const Recognizer = window.SpeechRecognition || window.webkitSpeechRecognition
    if (Recognizer) {
      recognition = new Recognizer()
      recognition.lang = options.language ?? 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (event: unknown) => {
        const e = event as {
          resultIndex: number
          results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
        }
        const result = e.results[e.resultIndex]
        if (!result) return
        const text = result[0]?.transcript?.trim()
        if (!text || !ws || ws.readyState !== WebSocket.OPEN) return
        ws.send(JSON.stringify({ type: 'audio_chunk', text, is_final: result.isFinal }))
      }
      recognition.start()
    }

    isListening.value = true
    voiceState.value = 'listening'
  }

  function stopListening() {
    if (!isListening.value) return

    isListening.value = false
    voiceState.value = 'thinking'

    try {
      recognition?.stop()
    } catch {
      // ignore
    }
    recognition = null

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    mediaRecorder = null

    mediaStream?.getTracks().forEach((track) => track.stop())
    mediaStream = null

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop' }))
    }
  }

  function interrupt() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'interrupt' }))
    }
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    ttsQueue = []
    isPlaying = false
    voiceState.value = 'interrupted'
  }

  async function toggleListening() {
    if (isListening.value) {
      stopListening()
      return
    }
    await startListening()
  }

  async function playNextAudio() {
    if (isPlaying || ttsQueue.length === 0) return
    const chunk = ttsQueue.shift()
    if (!chunk) return

    isPlaying = true
    voiceState.value = 'speaking'

    const audio = new Audio(`data:audio/wav;base64,${chunk}`)
    currentAudio = audio
    audio.onended = () => {
      isPlaying = false
      currentAudio = null
      if (ttsQueue.length > 0) {
        void playNextAudio()
      } else if (!isListening.value) {
        voiceState.value = 'idle'
      }
    }
    audio.onerror = () => {
      isPlaying = false
      currentAudio = null
      if (!isListening.value) {
        voiceState.value = 'idle'
      }
    }
    await audio.play().catch(() => {
      isPlaying = false
      currentAudio = null
      voiceState.value = 'idle'
    })
  }

  function cleanup() {
    stopListening()
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    ws = null
    isConnected.value = false
    if (currentAudio) {
      currentAudio.pause()
      currentAudio = null
    }
    ttsQueue = []
    isPlaying = false
  }

  onUnmounted(cleanup)

  return {
    voiceState,
    isConnected,
    isListening,
    asrPartial,
    assistantPartial,
    startListening,
    stopListening,
    toggleListening,
    interrupt,
    cleanup,
    modeHint,
    isDegradedMode,
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}
