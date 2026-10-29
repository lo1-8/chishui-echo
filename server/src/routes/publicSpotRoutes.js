const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * GET /api/spots
 * 获取所有公开点位，用于地图页面。
 */
router.get('/', (req, res) => {
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
        latitude,
        longitude,
        cover_image,
        short_intro,
        navigation_url
      FROM spots
      WHERE is_published = 1
      ORDER BY route_order ASC, id ASC
    `).all()

    return success(res, spots, '获取公开点位成功。')
  } catch (error) {
    console.error('获取公开点位失败：', error)
    return fail(res, '获取点位数据失败。', 500)
  }
})

/**
 * GET /api/spots/:id
 * 获取单个点位详情。
 *
 * 包括：
 * - 点位详情
 * - 公开音频
 * - 公开研学问答
 */
router.get('/:id', (req, res) => {
  try {
    const spotId = Number(req.params.id)

    if (!Number.isInteger(spotId) || spotId <= 0) {
      return fail(res, '点位 ID 不合法。')
    }

    const spot = db.prepare(`
      SELECT
        id,
        name,
        subtitle,
        type,
        route_order,
        map_x,
        map_y,
        latitude,
        longitude,
        cover_image,
        short_intro,
        story_content,
        story_source,
        next_spot_id,
        navigation_url
      FROM spots
      WHERE id = ?
        AND is_published = 1
    `).get(spotId)

    if (!spot) {
      return fail(res, '未找到该公开点位。', 404)
    }

    const audios = db.prepare(`
      SELECT
        id,
        title,
        audio_url,
        duration,
        transcript,
        audio_type,
        record_time,
        record_location,
        narrator,
        sort_order
      FROM audios
      WHERE spot_id = ?
        AND is_public = 1
      ORDER BY sort_order ASC, id ASC
    `).all(spotId)

     const quizQuestions = db.prepare(`
  SELECT
    id,
    question,
    question_type,
    options_json,
    correct_answer,
    explanation
  FROM quiz_questions
  WHERE spot_id = ?
    AND is_published = 1
  ORDER BY id ASC
`).all(spotId)

    // 前端使用更方便：将 options_json 转换为数组
const formattedQuestions = quizQuestions.map((item) => ({
  ...item,
  options: item.options_json
    ? JSON.parse(item.options_json)
    : []
}))

    // 获取下一站基本信息
    let nextSpot = null

    if (spot.next_spot_id) {
      nextSpot = db.prepare(`
        SELECT
          id,
          name,
          route_order,
          map_x,
          map_y,
          navigation_url
        FROM spots
        WHERE id = ?
          AND is_published = 1
      `).get(spot.next_spot_id)
    }

    return success(res, {
      ...spot,
      audios,
      quiz_questions: formattedQuestions,
      next_spot: nextSpot
    }, '获取点位详情成功。')
  } catch (error) {
    console.error('获取点位详情失败：', error)
    return fail(res, '获取点位详情失败。', 500)
  }
})

module.exports = router