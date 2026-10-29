const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// 从 .env 中读取数据库文件路径。
// 若 .env 中未设置，则默认使用 server/database/chishui-echo.db
const databasePath = process.env.DATABASE_PATH || './database/chishui-echo.db'

// 将相对路径转为绝对路径。
// process.cwd() 在本项目中通常是 server 目录。
const absoluteDatabasePath = path.resolve(process.cwd(), databasePath)

// 确保 database 目录存在。
const databaseDirectory = path.dirname(absoluteDatabasePath)

if (!fs.existsSync(databaseDirectory)) {
  fs.mkdirSync(databaseDirectory, { recursive: true })
}

// 创建 SQLite 数据库连接。
// 若数据库文件不存在，better-sqlite3 会自动创建。
const db = new Database(absoluteDatabasePath)

// 启用外键约束。
// SQLite 默认不一定启用外键，因此必须手动打开。
db.pragma('foreign_keys = ON')

// 开启 WAL 模式，提高读取和写入同时发生时的稳定性。
// 对本项目这种小型 Web 应用足够合适。
db.pragma('journal_mode = WAL')

console.log(`SQLite 数据库已连接：${absoluteDatabasePath}`)

module.exports = db