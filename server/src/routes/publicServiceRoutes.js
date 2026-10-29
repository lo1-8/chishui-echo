const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * GET /api/service-points
 * 获取所有公开服务点。
 *
 * 可选查询参数：
 * ?type=厕所
 * ?type=餐饮
 */
router.get('/', (req, res) => {
  try {
    const { type } = req.query

    let sql = `
      SELECT
        id,
        name,
        type,
        address,
        map_x,
        map_y,
        latitude,
        longitude,
        description,
        opening_hours,
        navigation_url
      FROM service_points
      WHERE is_published = 1
    `

    const params = []

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }

    sql += ' ORDER BY id DESC'

    const services = db.prepare(sql).all(...params)

    return success(res, services, '获取服务点成功。')
  } catch (error) {
    console.error('获取服务点失败：', error)
    return fail(res, '获取服务点失败。', 500)
  }
})

module.exports = router