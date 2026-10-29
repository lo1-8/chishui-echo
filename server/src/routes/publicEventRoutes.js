const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

// 允许记录的行为类型。
// 明确白名单可以避免前端随意写入异常事件。
const allowedEventTypes = [
  'page_view',
  'map_view',
  'spot_view',
  'audio_play',
  'audio_complete',
  'spot_checkin',
  'spot_collect',
  'spot_uncollect',
  'navigation_click',
  'quiz_complete',
  'share_generate',
  'feedback_open',
  'feedback_submit'
]

/**
 * POST /api/events
 * 记录匿名用户行为。
 */
router.post('/', (req, res) => {
  try {
    const {
      visitor_id,
      event_type,
      spot_id = null,
      event_value = null
    } = req.body

    if (!visitor_id || typeof visitor_id !== 'string') {
      return fail(res, 'visitor_id 不能为空。')
    }

    if (!allowedEventTypes.includes(event_type)) {
      return fail(res, 'event_type 不在允许范围内。')
    }

    const normalizedSpotId = spot_id ? Number(spot_id) : null

    if (spot_id && (!Number.isInteger(normalizedSpotId) || normalizedSpotId <= 0)) {
      return fail(res, 'spot_id 不合法。')
    }

    const eventValueText = event_value
      ? JSON.stringify(event_value)
      : null

    const result = db.prepare(`
      INSERT INTO user_events (
        visitor_id,
        event_type,
        spot_id,
        event_value
      ) VALUES (?, ?, ?, ?)
    `).run(
      visitor_id,
      event_type,
      normalizedSpotId,
      eventValueText
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '行为记录成功。')
  } catch (error) {
    console.error('记录用户行为失败：', error)
    return fail(res, '记录用户行为失败。', 500)
  }
})

module.exports = router