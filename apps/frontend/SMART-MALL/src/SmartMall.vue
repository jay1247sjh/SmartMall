<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SmartMall'
})
</script>

<template>
  <div class="smart-mall">
    <router-view />
  </div>
</template>

<style scoped>
.smart-mall {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>
