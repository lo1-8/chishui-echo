const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const db = require('./database')

/**
 * 初始化数据库表结构。
 * 该函数可重复运行：
 * - 表不存在时创建；
 * - 表已经存在时不会删除已有数据；
 * - 若不存在默认管理员，则自动创建。
 */
function initializeDatabase() {
  const schemaPath = path.join(
    process.cwd(),
    'database',
    'sql',
    'schema.sql'
  )

  // 检查 schema.sql 是否存在
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`未找到数据库建表文件：${schemaPath}`)
  }

  // 读取 SQL 文件
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')

  // 执行全部建表语句
  db.exec(schemaSql)

  console.log('数据库表结构初始化完成。')

  // 检查是否已经有管理员账号
  const admin = db
    .prepare('SELECT id FROM admins WHERE username = ?')
    .get('admin')

  // 如果没有 admin 账号，则创建默认账号
  if (!admin) {
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123456'
    const passwordHash = bcrypt.hashSync(defaultPassword, 10)

    db.prepare(`
      INSERT INTO admins (
        username,
        password_hash,
        display_name
      ) VALUES (?, ?, ?)
    `).run(
      'admin',
      passwordHash,
      '赤水回声管理员'
    )

    console.log('')
    console.log('==========================================')
    console.log('已创建默认管理员账号：')
    console.log('账号：admin')
    console.log(
      process.env.ADMIN_INITIAL_PASSWORD
        ? '密码：已通过 ADMIN_INITIAL_PASSWORD 环境变量设置'
        : `密码：${defaultPassword}`
    )
    console.log('请在后续开发中尽快修改默认密码。')
    console.log('==========================================')
    console.log('')
  } else {
    console.log('默认管理员账号已存在，跳过创建。')
  }
}

module.exports = initializeDatabase