require('dotenv').config()

const app = require('./src/app')
const initializeDatabase = require('./src/config/initDatabase')

const PORT = process.env.PORT || 3000

// 在服务启动前初始化数据库和数据表
initializeDatabase()

app.listen(PORT, () => {
  console.log('')
  console.log('======================================')
  console.log(' 赤水回声后端服务已启动')
  console.log(` 本地地址：http://localhost:${PORT}`)
  console.log(` 健康检查：http://localhost:${PORT}/api/health`)
  console.log('======================================')
  console.log('')
})