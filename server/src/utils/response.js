/**
 * 返回成功响应
 */
function success(res, data = null, message = '操作成功') {
  return res.json({
    code: 0,
    message,
    data
  })
}

/**
 * 返回失败响应
 */
function fail(res, message = '操作失败', code = 400, data = null) {
  return res.status(code).json({
    code,
    message,
    data
  })
}

module.exports = {
  success,
  fail
}