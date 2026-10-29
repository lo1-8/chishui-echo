require('dotenv').config()

const app = require('./src/app')
const initializeDatabase = require('./src/config/initDatabase')
const { seedDataIfEmpty } = require('./seed-data')

const PORT = process.env.PORT || 3000

// 在服务启动前初始化数据库和数据表
initializeDatabase()

// 数据库为空时自动写入初始地图数据，避免依赖 Render Free 不支持的 Shell
seedDataIfEmpty()

app.listen(PORT, () => {
  console.log('')
  console.log('======================================')
  console.log(' 赤水回声后端服务已启动')
  console.log(` 本地地址：http://localhost:${PORT}`)
  console.log(` 健康检查：http://localhost:${PORT}/api/health`)
  console.log('======================================')
  console.log('')
})