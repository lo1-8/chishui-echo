import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: '赤水回声'
    }
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('../views/MapView.vue'),
    meta: {
      title: '太平古镇声音地图'
    }
  },
  {
    path: '/spot/:id',
    name: 'spot-detail',
    component: () => import('../views/SpotDetailView.vue'),
    meta: {
      title: '点位声音导览'
    }
  },
  {
    path: '/journey',
    name: 'journey',
    component: () => import('../views/JourneyView.vue'),
    meta: {
      title: '我的旅程'
    }
  },
  {
    path: '/feedback',
    name: 'feedback',
    component: () => import('../views/FeedbackView.vue'),
    meta: {
      title: '体验反馈'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: {
      title: '关于赤水回声'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return {
      top: 0,
      behavior: 'smooth'
    }
  }
})

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title}｜赤水回声`
    : '赤水回声'
})

export default router