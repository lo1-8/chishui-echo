const express = require('express')
const cors = require('cors')
const path = require('path')

// 游客端路由
const publicSpotRoutes = require('./routes/publicSpotRoutes')
const publicRouteRoutes = require('./routes/publicRouteRoutes')
const publicServiceRoutes = require('./routes/publicServiceRoutes')
const publicEventRoutes = require('./routes/publicEventRoutes')
const publicFeedbackRoutes = require('./routes/publicFeedbackRoutes')
const publicShareRoutes = require('./routes/publicShareRoutes')

// 后台路由
const adminRoutes = require('./routes/adminRoutes')
const adminUploadRoutes = require('./routes/adminUploadRoutes')

const { fail } = require('./utils/response')

const app = express()

// 允许本地开发环境，以及通过 ALLOWED_ORIGINS 配置的线上域名访问
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
)

// 解析 application/json 请求
app.use(express.json({ limit: '10mb' }))

// 解析普通表单请求
app.use(express.urlencoded({ extended: true }))

// 开放图片和音频静态文件访问；线上可通过 UPLOADS_PATH 指向持久磁盘
const uploadsRoot = process.env.UPLOADS_PATH
  ? path.resolve(process.env.UPLOADS_PATH)
  : path.join(__dirname, '../uploads')

app.use(
  '/uploads',
  express.static(uploadsRoot)
)

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: '赤水回声后端服务运行正常',
    data: {
      service: 'chishui-echo-server',
      time: new Date().toISOString()
    }
  })
})


// =====================================================
// 游客端 API
// =====================================================

app.use('/api/spots', publicSpotRoutes)
app.use('/api/routes', publicRouteRoutes)
app.use('/api/service-points', publicServiceRoutes)
app.use('/api/events', publicEventRoutes)
app.use('/api/feedbacks', publicFeedbackRoutes)
app.use('/api/share', publicShareRoutes)


// =====================================================
// 管理后台 API
// =====================================================

app.use('/api/admin/upload', adminUploadRoutes)
app.use('/api/admin', adminRoutes)


// =====================================================
// 未匹配接口处理
// =====================================================

app.use((req, res) => {
  return fail(res, `接口不存在：${req.method} ${req.originalUrl}`, 404)
})


// =====================================================
// 全局错误处理
// =====================================================

app.use((error, req, res, next) => {
  console.error('未处理的服务器错误：', error)

  return fail(
    res,
    error.message || '服务器内部错误。',
    500
  )
})

module.exports = app