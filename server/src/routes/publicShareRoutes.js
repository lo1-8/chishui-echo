const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * GET /api/share/:visitorId
 * 获取匿名用户的基础旅程数据。
 *
 * 注意：
 * 首版游客的打卡和收藏主要存在 LocalStorage，
 * 因此本接口只统计后端已记录的 user_events。
 */
router.get('/:visitorId', (req, res) => {
  try {
    const { visitorId } = req.params

    if (!visitorId) {
      return fail(res, 'visitorId 不能为空。')
    }

    const checkedInCount = db.prepare(`
      SELECT COUNT(DISTINCT spot_id) AS count
      FROM user_events
      WHERE visitor_id = ?
        AND event_type = 'spot_checkin'
        AND spot_id IS NOT NULL
    `).get(visitorId)

    const collectedCount = db.prepare(`
      SELECT COUNT(DISTINCT spot_id) AS count
      FROM user_events
      WHERE visitor_id = ?
        AND event_type = 'spot_collect'
        AND spot_id IS NOT NULL
    `).get(visitorId)

    const totalSpots = db.prepare(`
      SELECT COUNT(*) AS count
      FROM spots
      WHERE is_published = 1
    `).get()

    return success(res, {
      checked_in_count: checkedInCount.count,
      collected_count: collectedCount.count,
      total_spots: totalSpots.count,
      title: '我在太平古镇，听见了赤水回声。'
    }, '获取分享数据成功。')
  } catch (error) {
    console.error('获取分享数据失败：', error)
    return fail(res, '获取分享数据失败。', 500)
  }
})

module.exports = router