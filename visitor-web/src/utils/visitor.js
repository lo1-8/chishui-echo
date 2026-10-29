const VISITOR_ID_KEY = 'chishui_echo_visitor_id'

/**
 * 获取或生成匿名访客 ID。
 *
 * 不需要登录，不采集个人姓名、电话等敏感信息。
 * 用于：
 * - 行为统计；
 * - 反馈问卷；
 * - 匿名去重；
 * - 后续分享数据。
 */
export function getVisitorId() {
  const existingId = localStorage.getItem(VISITOR_ID_KEY)

  if (existingId) {
    return existingId
  }

  const visitorId = crypto.randomUUID
    ? crypto.randomUUID()
    : `visitor-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`

  localStorage.setItem(VISITOR_ID_KEY, visitorId)

  return visitorId
}