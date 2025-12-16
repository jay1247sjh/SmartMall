import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/builder'
    },
    {
      path: '/builder',
      name: 'Builder',
      component: () => import('@/views/BuilderView.vue')
    },
    {
      // 渲染引擎层集成测试页面
      path: '/engine-test',
      name: 'EngineTest',
      component: () => import('@/views/EngineTestView.vue')
    }
  ]
})

export default router
