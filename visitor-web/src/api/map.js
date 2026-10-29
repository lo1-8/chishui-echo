import request from './request'

/**
 * 获取地图全部公开点位。
 */
export function getPublicSpots() {
  return request.get('/spots')
}

/**
 * 获取单个点位详情。
 *
 * 包括：
 * - 故事文本
 * - 音频
 * - 问答
 * - 下一站
 */
export function getSpotDetail(spotId) {
  return request.get(`/spots/${spotId}`)
}

/**
 * 获取推荐主路线。
 */
export function getMainRoute() {
  return request.get('/routes/main')
}

/**
 * 获取服务设施点。
 */
export function getServicePoints() {
  return request.get('/service-points')
}

/**
 * 记录匿名用户行为。
 */
export function recordUserEvent(payload) {
  return request.post('/events', payload)
}