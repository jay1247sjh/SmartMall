import { createApp } from 'vue'
import { createPinia } from 'pinia'
import SmartMall from './SmartMall.vue'
import router from './router'

// 全局样式
import './assets/styles/base.css'

const app = createApp(SmartMall)
const pinia = createPinia()

// 先注册 Pinia，再注册 Router（因为路由守卫需要用到 store）
app.use(pinia)
app.use(router)

app.mount('#app')
