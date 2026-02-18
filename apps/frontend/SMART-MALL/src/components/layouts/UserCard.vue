<template>
  <div class="user-card">
    <SettingsPanel
      trigger-mode="avatar"
      :avatar-size="32"
      :show-logout="showLogout"
      @logout="$emit('logout')"
    />
  </div>
</template>

<script setup lang="ts">
import SettingsPanel from '@/components/settings/SettingsPanel.vue'

interface Props {
  collapsed?: boolean
  showLogout?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
  showLogout: false,
})

defineEmits<{
  logout: []
}>()
</script>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;

.user-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-1;
}
</style>
