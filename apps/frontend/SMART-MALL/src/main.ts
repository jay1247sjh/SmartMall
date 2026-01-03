import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import SmartMall from './SmartMall.vue'
import router from './router'

// 全局样式 (SCSS 设计系统)
import './assets/styles/scss/main.scss'

const app = createApp(SmartMall)
const pinia = createPinia()

// 先注册 Pinia，再注册 Router（因为路由守卫需要用到 store）
app.use(pinia)
app.use(ElementPlus)
app.use(router)

app.mount('#app')
