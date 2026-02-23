<template>
  <div class="settings-panel-wrapper" :class="{ 'settings-panel-wrapper--inline': inline }">
    <!-- Trigger button -->
    <button
      ref="triggerRef"
      class="settings-trigger"
      :class="{
        active: isPanelOpen,
        'settings-trigger--inline': inline,
        'settings-trigger--avatar': triggerMode === 'avatar',
      }"
      :style="triggerMode === 'avatar' ? { width: `${avatarSize}px`, height: `${avatarSize}px` } : undefined"
      :aria-label="t('settings.title')"
      @click.stop="togglePanel"
    >
      <template v-if="triggerMode === 'avatar'">
        <span class="settings-trigger__avatar-letter">{{ avatarLetter }}</span>
      </template>
      <template v-else>
        <svg class="settings-trigger__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M16.167 12.5a1.375 1.375 0 0 0 .275 1.517l.05.05a1.667 1.667 0 1 1-2.359 2.358l-.05-.05a1.375 1.375 0 0 0-1.516-.275 1.375 1.375 0 0 0-.834 1.258v.142a1.667 1.667 0 1 1-3.333 0v-.075a1.375 1.375 0 0 0-.9-1.258 1.375 1.375 0 0 0-1.517.275l-.05.05a1.667 1.667 0 1 1-2.358-2.359l.05-.05a1.375 1.375 0 0 0 .275-1.516 1.375 1.375 0 0 0-1.258-.834H2.5a1.667 1.667 0 0 1 0-3.333h.075a1.375 1.375 0 0 0 1.258-.9 1.375 1.375 0 0 0-.275-1.517l-.05-.05A1.667 1.667 0 1 1 5.867 3.55l.05.05a1.375 1.375 0 0 0 1.516.275h.067a1.375 1.375 0 0 0 .833-1.258V2.5a1.667 1.667 0 1 1 3.334 0v.075a1.375 1.375 0 0 0 .833 1.258 1.375 1.375 0 0 0 1.517-.275l.05-.05a1.667 1.667 0 1 1 2.358 2.358l-.05.05a1.375 1.375 0 0 0-.275 1.517v.067a1.375 1.375 0 0 0 1.258.833h.142a1.667 1.667 0 0 1 0 3.334h-.075a1.375 1.375 0 0 0-1.258.833Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span v-if="inline && !collapsed" class="settings-trigger__text">{{ t('settings.title') }}</span>
      </template>
    </button>

    <!-- Main popup -->
    <Teleport to="body">
      <Transition name="settings-panel">
        <div
          v-if="isPanelOpen"
          ref="panelRef"
          class="settings-popup settings-popup--fixed"
          :style="popupStyle"
          @click.stop
        >
          <div class="menu-list">
            <!-- User Profile Section -->
            <div class="user-profile-section">
              <div class="user-profile__avatar">
                <span class="user-profile__avatar-letter">{{ avatarLetter }}</span>
              </div>
              <div class="user-profile__info">
                <span class="user-profile__name">{{ username }}</span>
                <span class="user-profile__role" :class="`user-profile__role--${roleKey}`">
                  {{ t(`roles.${roleKey}`) }}
                </span>
              </div>
            </div>
            <div class="menu-divider" />

            <!-- Theme (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('theme')"
              @mouseleave="scheduleCloseSubmenu('theme')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.2" />
                  <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span class="menu-item__label">{{ t('settings.theme') }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <!-- Theme submenu -->
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'theme'"
                  class="cascade-submenu"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('theme')"
                >
                  <button
                    v-for="opt in THEME_OPTIONS"
                    :key="opt"
                    class="cascade-submenu__item"
                    :class="{ active: settingsStore.theme === opt }"
                    @click="settingsStore.setTheme(opt)"
                  >
                    <span>{{ opt === 'dark' ? t('settings.themeDark') : t('settings.themeLight') }}</span>
                    <svg v-if="settingsStore.theme === opt" class="cascade-submenu__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Language (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('language')"
              @mouseleave="scheduleCloseSubmenu('language')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2" />
                  <path d="M1.5 8h13M8 1.5c-1.8 2-2.7 4-2.7 6.5s.9 4.5 2.7 6.5M8 1.5c1.8 2 2.7 4 2.7 6.5s-.9 4.5-2.7 6.5" stroke="currentColor" stroke-width="1.2" />
                </svg>
                <span class="menu-item__label">{{ t('settings.language') }}</span>
                <span class="menu-item__value">{{ LOCALE_DISPLAY_NAMES[settingsStore.language] }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <!-- Language submenu -->
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'language'"
                  class="cascade-submenu"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('language')"
                >
                  <button
                    v-for="loc in SUPPORTED_LOCALES"
                    :key="loc"
                    class="cascade-submenu__item"
                    :class="{ active: settingsStore.language === loc }"
                    @click="settingsStore.setLanguage(loc)"
                  >
                    <span>{{ LOCALE_DISPLAY_NAMES[loc] }}</span>
                    <svg v-if="settingsStore.language === loc" class="cascade-submenu__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- Character Model (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('character')"
              @mouseleave="scheduleCloseSubmenu('character')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.2" />
                  <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span class="menu-item__label">{{ t('settings.characterModel') }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <!-- Character model submenu -->
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'character'"
                  class="cascade-submenu cascade-submenu--character"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('character')"
                >
                  <template v-for="(group, gi) in CHARACTER_MODEL_GROUPS" :key="group.label">
                    <div v-if="gi > 0" class="cascade-submenu__divider" />
                    <div class="cascade-submenu__group-label">{{ t(group.i18nKey) }}</div>
                    <div class="character-grid">
                      <button
                        v-for="model in group.models"
                        :key="model"
                        class="character-card"
                        :class="{ active: settingsStore.characterModel === model }"
                        :title="CHARACTER_MODEL_DISPLAY_NAMES[model]"
                        @click="settingsStore.setCharacterModel(model)"
                      >
                        <img
                          :src="getThumbnail(model) || `/images/characters/${model}.svg`"
                          :alt="CHARACTER_MODEL_DISPLAY_NAMES[model]"
                          class="character-card__thumb"
                          loading="lazy"
                          @error="$event.target.style.display='none'"
                        />
                        <span class="character-card__name">{{ CHARACTER_MODEL_DISPLAY_NAMES[model].split(' ')[1] }}</span>
                      </button>
                    </div>
                  </template>
                </div>
              </Transition>
            </div>

            <!-- 3D Scene (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('scene')"
              @mouseleave="scheduleCloseSubmenu('scene')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                  <path d="M8 15V8M8 8L2 4.5M8 8L14 4.5" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                </svg>
                <span class="menu-item__label">{{ t('settings.scene') }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <!-- Scene submenu -->
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'scene'"
                  class="cascade-submenu"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('scene')"
                >
                  <div class="cascade-submenu__group-label">{{ t('settings.renderQuality') }}</div>
                  <button
                    v-for="q in RENDER_QUALITY_OPTIONS"
                    :key="q"
                    class="cascade-submenu__item"
                    :class="{ active: settingsStore.renderQuality === q }"
                    @click="settingsStore.setRenderQuality(q)"
                  >
                    <span>{{ t(`settings.render${q.charAt(0).toUpperCase() + q.slice(1)}`) }}</span>
                    <svg v-if="settingsStore.renderQuality === q" class="cascade-submenu__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <div class="cascade-submenu__divider" />
                  <button class="cascade-submenu__item cascade-submenu__item--toggle" @click="settingsStore.toggleGrid()">
                    <span>{{ t('settings.showGrid') }}</span>
                    <span class="menu-item__toggle" :class="{ on: settingsStore.showGrid }">
                      <span class="menu-item__toggle-thumb" />
                    </span>
                  </button>
                  <button class="cascade-submenu__item cascade-submenu__item--toggle" @click="settingsStore.toggleAxes()">
                    <span>{{ t('settings.showAxes') }}</span>
                    <span class="menu-item__toggle" :class="{ on: settingsStore.showAxes }">
                      <span class="menu-item__toggle-thumb" />
                    </span>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- AI Assistant toggle (no submenu) -->
            <button class="menu-item" @click="settingsStore.toggleAiAssistant()">
              <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.2" />
                <circle cx="6.5" cy="7" r="0.75" fill="currentColor" />
                <circle cx="9.5" cy="7" r="0.75" fill="currentColor" />
                <path d="M6.5 9.5c.4.6 1 .8 1.5.8s1.1-.2 1.5-.8" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
              </svg>
              <span class="menu-item__label">{{ t('settings.aiAssistant') }}</span>
              <span class="menu-item__toggle" :class="{ on: settingsStore.aiAssistantEnabled }">
                <span class="menu-item__toggle-thumb" />
              </span>
            </button>

            <!-- Notifications (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('notifications')"
              @mouseleave="scheduleCloseSubmenu('notifications')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6a4 4 0 0 1 8 0c0 2.2.7 3.5 1.3 4.3.2.2 0 .7-.3.7H3c-.3 0-.5-.5-.3-.7C3.3 9.5 4 8.2 4 6Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M6.5 13a1.7 1.7 0 0 0 3 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span class="menu-item__label">{{ t('settings.notifications') }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <!-- Notifications submenu -->
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'notifications'"
                  class="cascade-submenu"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('notifications')"
                >
                  <button class="cascade-submenu__item cascade-submenu__item--toggle" @click="settingsStore.setNotificationsEnabled(!settingsStore.notificationsEnabled)">
                    <span>{{ t('settings.notificationsEnabled') }}</span>
                    <span class="menu-item__toggle" :class="{ on: settingsStore.notificationsEnabled }">
                      <span class="menu-item__toggle-thumb" />
                    </span>
                  </button>
                  <div class="cascade-submenu__divider" />
                  <div class="cascade-submenu__group-label">{{ t('settings.toastDuration') }}</div>
                  <button
                    v-for="d in TOAST_DURATION_OPTIONS"
                    :key="d"
                    class="cascade-submenu__item"
                    :class="{ active: settingsStore.toastDuration === d }"
                    @click="settingsStore.setToastDuration(d)"
                  >
                    <span>{{ t(`settings.toast${d.charAt(0).toUpperCase() + d.slice(1)}`) }}</span>
                    <svg v-if="settingsStore.toastDuration === d" class="cascade-submenu__check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </Transition>
            </div>

            <!-- About (hover cascade) -->
            <div
              class="menu-item-wrap"
              @mouseenter="openSubmenu('about')"
              @mouseleave="scheduleCloseSubmenu('about')"
            >
              <div class="menu-item">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2" />
                  <path d="M8 7v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                  <circle cx="8" cy="5" r="0.75" fill="currentColor" />
                </svg>
                <span class="menu-item__label">{{ t('settings.about') }}</span>
                <svg class="menu-item__arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <Transition name="submenu-cascade">
                <div
                  v-if="hoveredSubmenu === 'about'"
                  class="cascade-submenu"
                  @mouseenter="cancelCloseSubmenu"
                  @mouseleave="scheduleCloseSubmenu('about')"
                >
                  <div class="about-row">
                    <span class="about-row__label">{{ t('settings.version') }}</span>
                    <span class="about-row__value">1.0.0</span>
                  </div>
                  <div class="about-row">
                    <span class="about-row__label">{{ t('settings.techStack') }}</span>
                    <span class="about-row__value">Vue 3 · Three.js</span>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Back to Home -->
            <div class="menu-divider" />
            <button class="menu-item" @click="handleBackToHome">
              <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8.5l6-5.5 6 5.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M3.5 7.5V13a1 1 0 0 0 1 1h3V11h1v3h3a1 1 0 0 0 1-1V7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="menu-item__label">{{ t('settings.backToHome') }}</span>
            </button>

            <!-- Logout -->
            <template v-if="showLogout">
              <div class="menu-divider" />
              <button class="menu-item menu-item--danger" @click="handleLogout">
                <svg class="menu-item__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3.333A1.333 1.333 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2H6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M10.667 11.333L14 8l-3.333-3.333M14 8H6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="menu-item__label">{{ t('settings.logout') }}</span>
              </button>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore, useUserStore } from '@/stores'
import {
  THEME_OPTIONS,
  SUPPORTED_LOCALES,
  RENDER_QUALITY_OPTIONS,
  TOAST_DURATION_OPTIONS,
  LOCALE_DISPLAY_NAMES,
  CHARACTER_MODEL_GROUPS,
  CHARACTER_MODEL_DISPLAY_NAMES,
} from '@/types/settings'
import type { CharacterModelName } from '@/types/settings'
import { useCharacterThumbnails } from '@/composables/useCharacterThumbnails'

interface Props {
  inline?: boolean
  collapsed?: boolean
  showLogout?: boolean
  triggerMode?: 'gear' | 'avatar'
  avatarSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  inline: false,
  collapsed: false,
  showLogout: false,
  triggerMode: 'gear',
  avatarSize: 32,
})

const emit = defineEmits<{
  logout: []
}>()

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const userStore = useUserStore()

// 角色缩略图：运行时渲染 GLB → dataURL，缓存到 localStorage
const { generate: generateThumbs, getThumbnail } = useCharacterThumbnails()
const allModels = CHARACTER_MODEL_GROUPS.flatMap(g => g.models) as CharacterModelName[]
generateThumbs(allModels)

const username = computed(() => userStore.currentUser?.username ?? '')
const avatarLetter = computed(() => username.value.charAt(0).toUpperCase() || 'U')
const roleKey = computed(() => (userStore.role || 'USER').toLowerCase())

const isPanelOpen = ref(false)
const panelRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

// Hover cascade submenu state
type SubmenuKey = 'theme' | 'language' | 'character' | 'scene' | 'notifications' | 'about'
const hoveredSubmenu = ref<SubmenuKey | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function openSubmenu(key: SubmenuKey) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  hoveredSubmenu.value = key
  // 下一帧检测子菜单是否溢出屏幕边界
  nextTick(() => {
    const subs = panelRef.value?.querySelectorAll('.cascade-submenu') as NodeListOf<HTMLElement> | undefined
    if (!subs) return
    subs.forEach((el) => {
      // 重置之前的调整
      el.style.top = ''
      el.classList.remove('cascade-submenu--flip')

      const rect = el.getBoundingClientRect()
      const margin = 8

      // 水平溢出：翻转到左侧
      if (rect.right > window.innerWidth - margin) {
        el.classList.add('cascade-submenu--flip')
      }

      // 垂直溢出：向上偏移，使底部不超出视口
      if (rect.bottom > window.innerHeight - margin) {
        const overflow = rect.bottom - (window.innerHeight - margin)
        el.style.top = `${-overflow}px`
      }
    })
  })
}

function scheduleCloseSubmenu(_key: SubmenuKey) {
  if (closeTimer) clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    hoveredSubmenu.value = null
    closeTimer = null
  }, 120)
}

function cancelCloseSubmenu() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

const popupPosition = ref({ left: 0, top: 0 })

const popupStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${popupPosition.value.left}px`,
  top: `${popupPosition.value.top}px`,
}))

function updatePopupPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const gap = 8
  const popupHeight = panelRef.value?.offsetHeight || 420
  const popupWidth = 240

  let left = rect.right + gap
  let top = rect.bottom - popupHeight

  if (top < gap) top = gap
  if (top + popupHeight > window.innerHeight - gap) {
    top = window.innerHeight - popupHeight - gap
  }
  if (left + popupWidth > window.innerWidth) {
    left = rect.left - popupWidth - gap
  }

  popupPosition.value = { left, top }
}

function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value
  hoveredSubmenu.value = null
  if (isPanelOpen.value) {
    nextTick(() => {
      nextTick(() => {
        nextTick(() => updatePopupPosition())
      })
    })
  }
}

function closePanel() {
  isPanelOpen.value = false
  hoveredSubmenu.value = null
}

function handleLogout() {
  closePanel()
  emit('logout')
}

function handleBackToHome() {
  closePanel()
  router.push('/mall')
}

function onClickOutside(e: MouseEvent) {
  if (!isPanelOpen.value) return
  const target = e.target as Node
  if (!triggerRef.value?.contains(target) && !panelRef.value?.contains(target)) {
    closePanel()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isPanelOpen.value) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<style lang="scss">
// ============================================================================
// Teleported popup styles (unscoped — applies when teleported to body)
// ============================================================================

.settings-popup {
  position: absolute;
  bottom: 48px;
  left: 0;
  width: 240px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  padding: 6px 0;
  overflow: visible;

  &--fixed {
    position: fixed;
    bottom: auto;
    left: auto;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 10000;
  }
}

.menu-list {
  display: flex;
  flex-direction: column;
}

// Wrapper for items that have cascade submenus
.menu-item-wrap {
  position: relative;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 14px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: var(--bg-tertiary);
  }

  &__icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }

  &__label {
    flex: 1;
    text-align: left;
  }

  &__value {
    font-size: 12px;
    color: var(--text-muted);
    margin-right: 2px;
  }

  &__arrow {
    flex-shrink: 0;
    color: var(--text-muted);
    opacity: 0.6;
  }

  &--danger {
    color: var(--error);

    .menu-item__icon {
      color: var(--error);
    }

    &:hover {
      background: rgba(var(--error-rgb), 0.1);
    }
  }

  &__toggle {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
    background: var(--border-muted);
    border-radius: 9px;
    transition: background 0.15s ease;
    flex-shrink: 0;

    &.on {
      background: var(--accent-primary);
    }
  }

  &__toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--bg-elevated);
    border-radius: 50%;
    transition: transform 0.15s ease;
  }

  &__toggle.on &__toggle-thumb {
    transform: translateX(14px);
  }
}

.menu-divider {
  height: 1px;
  margin: 4px 10px;
  background: var(--border-subtle);
}

// ============================================================================
// Cascade submenu (floats to the right of the parent item)
// ============================================================================
.cascade-submenu {
  position: absolute;
  left: calc(100% + 4px);
  top: 0;
  min-width: 180px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  padding: 6px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 10001;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &--flip {
    left: auto;
    right: calc(100% + 4px);
  }

  // Character submenu: wider to fit grid
  &--character {
    min-width: 240px;
    width: 240px;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.1s ease;

    &:hover {
      background: var(--bg-tertiary);
    }

    &.active {
      color: var(--accent-primary);
    }
  }

  &__check {
    color: var(--accent-primary);
    flex-shrink: 0;
  }

  &__group-label {
    padding: 6px 14px 4px;
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__divider {
    height: 1px;
    margin: 4px 10px;
    background: var(--border-subtle);
  }
}

// ============================================================================
// Character Grid (thumbnail cards)
// ============================================================================
.character-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px 10px 8px;
}

.character-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--border-subtle);
  }

  &.active {
    background: rgba(var(--accent-primary-rgb), 0.1);
    border-color: var(--accent-primary);
  }

  &__thumb {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    background: var(--bg-tertiary);
  }

  &__name {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1;
  }

  &.active &__name {
    color: var(--accent-primary);
    font-weight: 500;
  }
}

.about-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 14px;
  gap: 8px;

  &__label {
    font-size: 13px;
    color: var(--text-muted);
  }

  &__value {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: right;
  }
}

// ============================================================================
// User Profile Section
// ============================================================================
.user-profile-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 10px;
}

.user-profile__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--accent-primary);
}

.user-profile__avatar-letter {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  user-select: none;
}

.user-profile__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-profile__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-profile__role {
  font-size: 11px;
  color: var(--text-muted);

  &--admin {
    color: var(--accent-primary);
  }

  &--merchant {
    color: var(--warning);
  }

  &--user {
    color: var(--success);
  }
}

// ============================================================================
// Avatar trigger specificity override
// ============================================================================
.settings-trigger.settings-trigger.settings-trigger--avatar {
  border-radius: 50%;
  background: var(--accent-primary);
  border: none;
  padding: 0;

  &:hover {
    background: var(--accent-hover);
  }

  &.active {
    background: var(--accent-muted);
  }

  .settings-trigger__avatar-letter {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    line-height: 1;
    user-select: none;
  }
}

// ============================================================================
// Transitions
// ============================================================================
.settings-panel-enter-active,
.settings-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.settings-panel-enter-from,
.settings-panel-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}

// Cascade submenu slide-in from left (or right when flipped)
.submenu-cascade-enter-active,
.submenu-cascade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.submenu-cascade-enter-from,
.submenu-cascade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

.cascade-submenu--flip {
  .submenu-cascade-enter-from,
  .submenu-cascade-leave-to {
    transform: translateX(6px);
  }
}
</style>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;

// ============================================================================
// Wrapper
// ============================================================================
.settings-panel-wrapper {
  position: relative;
  z-index: 1000;

  &--inline {
    position: relative;
    left: auto;
    bottom: auto;
    z-index: auto;
  }
}

// ============================================================================
// Trigger Button
// ============================================================================
.settings-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  border-radius: $radius-lg;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--bg-tertiary);
    color: var(--accent-primary);
    border-color: var(--accent-primary);
  }

  &__icon {
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }

  &.active &__icon {
    transform: rotate(60deg);
  }

  &--inline {
    width: 100%;
    height: auto;
    justify-content: flex-start;
    gap: 10px;
    padding: 10px 8px;
    border: none;
    background: transparent;
    border-radius: $radius-md;

    &:hover {
      background: var(--bg-tertiary);
      border: none;
    }

    &.active {
      background: var(--bg-tertiary);
      border: none;
    }
  }

  &__text {
    font-size: $font-size-sm;
    white-space: nowrap;
  }
}
</style>
