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
    }
  ]
})

export default router
