import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 中文宋体：标题、诗性文字
import '@fontsource/noto-serif-sc/400.css'
import '@fontsource/noto-serif-sc/500.css'
import '@fontsource/noto-serif-sc/600.css'

// 中文无衬线：导航、按钮、正文
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'

// 英文辅助字体
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'

import './assets/styles/global.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
