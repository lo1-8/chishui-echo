import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { title: '后台登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: '/spots',
        name: 'spots',
        component: () => import('../views/spots/SpotListView.vue'),
        meta: { title: '点位管理' }
      },
      {
        path: '/audios',
        name: 'audios',
        component: () => import('../views/audios/AudioListView.vue'),
        meta: { title: '音频管理' }
      },
      {
        path: '/questions',
        name: 'questions',
        component: () => import('../views/questions/QuestionListView.vue'),
        meta: { title: '研学问答管理' }
      },
      {
        path: '/services',
        name: 'services',
        component: () => import('../views/services/ServiceListView.vue'),
        meta: { title: '服务点管理' }
      },
      {
        path: '/feedback',
        name: 'feedback',
        component: () => import('../views/feedback/FeedbackView.vue'),
        meta: { title: '体验反馈' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token')

  if (to.path === '/login') {
    return true
  }

  if (!token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath
      }
    }
  }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title}｜赤水回声管理后台`
    : '赤水回声管理后台'
})

export default router