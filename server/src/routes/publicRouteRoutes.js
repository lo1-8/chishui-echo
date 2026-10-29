const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * GET /api/routes/main
 * 获取“追寻赤水回声”主路线。
 *
 * MVP 不单独建立路线表，
 * 直接按 spots.route_order 返回公开点位。
 */
router.get('/main', (req, res) => {
  try {
    const spots = db.prepare(`
      SELECT
        id,
        name,
        subtitle,
        type,
        route_order,
        map_x,
        map_y,
        cover_image,
        short_intro,
        navigation_url
      FROM spots
      WHERE is_published = 1
      ORDER BY route_order ASC, id ASC
    `).all()

    const route = {
      id: 'main',
      name: '追寻赤水回声',
      subtitle: '太平古镇红色声音导览主线',
      estimated_duration: 90,
      total_spots: spots.length,
      spots
    }

    return success(res, route, '获取主路线成功。')
  } catch (error) {
    console.error('获取主路线失败：', error)
    return fail(res, '获取主路线失败。', 500)
  }
})

module.exports = router