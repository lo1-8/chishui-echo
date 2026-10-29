const jwt = require('jsonwebtoken')
const { fail } = require('../utils/response')

/**
 * 管理员 Token 验证中间件
 *
 * 前端需要在请求头中携带：
 * Authorization: Bearer 你的Token
 */
function requireAdminAuth(req, res, next) {
  const authorization = req.headers.authorization || ''

  // Bearer xxxxxxx
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  if (!token) {
    return fail(res, '未登录或登录状态已失效。', 401)
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // 将管理员信息挂载到 req 上，后续接口可直接使用 req.admin
    req.admin = payload

    next()
  } catch (error) {
    return fail(res, '登录凭证无效或已过期，请重新登录。', 401)
  }
}

module.exports = {
  requireAdminAuth
}