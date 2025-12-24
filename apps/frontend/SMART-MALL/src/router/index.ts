import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/builder',
    },
    {
      path: '/builder',
      name: 'Builder',
      component: () => import('@/views/BuilderView.vue'),
    },
    {
      // 领域层测试页面
      path: '/domain-test',
      name: 'DomainTest',
      component: () => import('@/views/DomainTestView.vue'),
    },
  ],
})

export default router
