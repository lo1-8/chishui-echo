const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { success, fail } = require('../utils/response')
const { requireAdminAuth } = require('../middlewares/auth')

const router = express.Router()

/**
 * 工具函数：将数据库中常见的 0 / 1 / true / false 统一为 0 或 1。
 */
function toBooleanInt(value) {
  return value === true || value === 1 || value === '1'
    ? 1
    : 0
}

/**
 * =====================================================
 * 1. 管理员登录
 * POST /api/admin/login
 * =====================================================
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return fail(res, '用户名和密码不能为空。')
    }

    const admin = db.prepare(`
      SELECT
        id,
        username,
        password_hash,
        display_name
      FROM admins
      WHERE username = ?
    `).get(username)

    if (!admin) {
      return fail(res, '用户名或密码错误。', 401)
    }

    const passwordCorrect = bcrypt.compareSync(
      password,
      admin.password_hash
    )

    if (!passwordCorrect) {
      return fail(res, '用户名或密码错误。', 401)
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    )

    return success(res, {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name
      }
    }, '登录成功。')
  } catch (error) {
    console.error('管理员登录失败：', error)
    return fail(res, '登录失败。', 500)
  }
})

/**
 * 以下所有 /api/admin 接口都必须登录后访问。
 */
router.use(requireAdminAuth)

/**
 * =====================================================
 * 2. 管理点位
 * =====================================================
 */

/**
 * GET /api/admin/spots
 * 获取全部点位，包括未公开点位。
 */
router.get('/spots', (req, res) => {
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
        story_content,
        story_source,
        next_spot_id,
        navigation_url,
        is_published,
        created_at,
        updated_at
      FROM spots
      ORDER BY route_order ASC, id ASC
    `).all()

    return success(res, spots, '获取后台点位列表成功。')
  } catch (error) {
    console.error('获取后台点位失败：', error)
    return fail(res, '获取点位列表失败。', 500)
  }
})

/**
 * POST /api/admin/spots
 * 新增点位。
 */
router.post('/spots', (req, res) => {
  try {
    const {
      name,
      subtitle = '',
      type = '其他',
      route_order = 999,
      map_x = null,
      map_y = null,
      latitude = null,
      longitude = null,
      cover_image = '',
      short_intro = '',
      story_content = '',
      story_source = '',
      next_spot_id = null,
      navigation_url = '',
      is_published = false
    } = req.body

    if (!name || !String(name).trim()) {
      return fail(res, '点位名称不能为空。')
    }

    const result = db.prepare(`
      INSERT INTO spots (
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
        navigation_url,
        is_published,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      String(name).trim(),
      subtitle,
      type,
      Number(route_order) || 999,
      map_x === '' ? null : map_x,
      map_y === '' ? null : map_y,
      latitude === '' ? null : latitude,
      longitude === '' ? null : longitude,
      cover_image,
      short_intro,
      story_content,
      story_source,
      next_spot_id || null,
      navigation_url,
      toBooleanInt(is_published)
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '新增点位成功。')
  } catch (error) {
    console.error('新增点位失败：', error)
    return fail(res, '新增点位失败。', 500)
  }
})

/**
 * PUT /api/admin/spots/:id
 * 编辑点位。
 */
router.put('/spots/:id', (req, res) => {
  try {
    const spotId = Number(req.params.id)

    if (!Number.isInteger(spotId) || spotId <= 0) {
      return fail(res, '点位 ID 不合法。')
    }

    const existing = db.prepare(`
      SELECT id FROM spots WHERE id = ?
    `).get(spotId)

    if (!existing) {
      return fail(res, '未找到要编辑的点位。', 404)
    }

    const {
      name,
      subtitle = '',
      type = '其他',
      route_order = 999,
      map_x = null,
      map_y = null,
      latitude = null,
      longitude = null,
      cover_image = '',
      short_intro = '',
      story_content = '',
      story_source = '',
      next_spot_id = null,
      navigation_url = '',
      is_published = false
    } = req.body

    if (!name || !String(name).trim()) {
      return fail(res, '点位名称不能为空。')
    }

    db.prepare(`
      UPDATE spots
      SET
        name = ?,
        subtitle = ?,
        type = ?,
        route_order = ?,
        map_x = ?,
        map_y = ?,
        latitude = ?,
        longitude = ?,
        cover_image = ?,
        short_intro = ?,
        story_content = ?,
        story_source = ?,
        next_spot_id = ?,
        navigation_url = ?,
        is_published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      String(name).trim(),
      subtitle,
      type,
      Number(route_order) || 999,
      map_x === '' ? null : map_x,
      map_y === '' ? null : map_y,
      latitude === '' ? null : latitude,
      longitude === '' ? null : longitude,
      cover_image,
      short_intro,
      story_content,
      story_source,
      next_spot_id || null,
      navigation_url,
      toBooleanInt(is_published),
      spotId
    )

    return success(res, null, '编辑点位成功。')
  } catch (error) {
    console.error('编辑点位失败：', error)
    return fail(res, '编辑点位失败。', 500)
  }
})

/**
 * DELETE /api/admin/spots/:id
 * 删除点位。
 *
 * 注意：
 * 删除点位会级联删除该点位对应的音频与问答。
 */
router.delete('/spots/:id', (req, res) => {
  try {
    const spotId = Number(req.params.id)

    if (!Number.isInteger(spotId) || spotId <= 0) {
      return fail(res, '点位 ID 不合法。')
    }

    const result = db.prepare(`
      DELETE FROM spots
      WHERE id = ?
    `).run(spotId)

    if (result.changes === 0) {
      return fail(res, '未找到要删除的点位。', 404)
    }

    return success(res, null, '删除点位成功。')
  } catch (error) {
    console.error('删除点位失败：', error)
    return fail(res, '删除点位失败。', 500)
  }
})

/**
 * =====================================================
 * 3. 管理音频
 * =====================================================
 */

/**
 * POST /api/admin/audios
 * 新增音频。
 */
router.post('/audios', (req, res) => {
  try {
    const {
      spot_id,
      title,
      audio_url,
      duration = 0,
      transcript = '',
      audio_type = '其他',
      record_time = '',
      record_location = '',
      narrator = '',
      authorization_status = 'pending',
      is_public = false,
      sort_order = 1
    } = req.body

    if (!spot_id || !title || !audio_url) {
      return fail(res, 'spot_id、音频标题、音频地址不能为空。')
    }

    const spot = db.prepare(`
      SELECT id FROM spots WHERE id = ?
    `).get(Number(spot_id))

    if (!spot) {
      return fail(res, '所属点位不存在。')
    }

    const result = db.prepare(`
      INSERT INTO audios (
        spot_id,
        title,
        audio_url,
        duration,
        transcript,
        audio_type,
        record_time,
        record_location,
        narrator,
        authorization_status,
        is_public,
        sort_order,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      Number(spot_id),
      title,
      audio_url,
      Number(duration) || 0,
      transcript,
      audio_type,
      record_time,
      record_location,
      narrator,
      authorization_status,
      toBooleanInt(is_public),
      Number(sort_order) || 1
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '新增音频成功。')
  } catch (error) {
    console.error('新增音频失败：', error)
    return fail(res, '新增音频失败。', 500)
  }
})

/**
 * GET /api/admin/audios?spot_id=1
 * 获取全部音频，也可按点位筛选。
 */
router.get('/audios', (req, res) => {
  try {
    const { spot_id } = req.query

    let sql = `
      SELECT
        audios.*,
        spots.name AS spot_name
      FROM audios
      LEFT JOIN spots ON audios.spot_id = spots.id
    `

    const params = []

    if (spot_id) {
      sql += ' WHERE audios.spot_id = ?'
      params.push(Number(spot_id))
    }

    sql += ' ORDER BY audios.spot_id ASC, audios.sort_order ASC, audios.id ASC'

    const audios = db.prepare(sql).all(...params)

    return success(res, audios, '获取音频列表成功。')
  } catch (error) {
    console.error('获取音频列表失败：', error)
    return fail(res, '获取音频列表失败。', 500)
  }
})

/**
 * =====================================================
 * 4. 管理研学问答
 * =====================================================
 */

/**
 * POST /api/admin/questions
 * 新增研学问题。
 */
router.post('/questions', (req, res) => {
  try {
    const {
      spot_id,
      question,
      question_type = 'single',
      options = [],
      correct_answer = '',
      explanation = '',
      is_published = true
    } = req.body

    if (!spot_id || !question) {
      return fail(res, 'spot_id 和问题内容不能为空。')
    }

    const spot = db.prepare(`
      SELECT id FROM spots WHERE id = ?
    `).get(Number(spot_id))

    if (!spot) {
      return fail(res, '所属点位不存在。')
    }

    const result = db.prepare(`
      INSERT INTO quiz_questions (
        spot_id,
        question,
        question_type,
        options_json,
        correct_answer,
        explanation,
        is_published,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      Number(spot_id),
      question,
      question_type,
      JSON.stringify(options || []),
      correct_answer === null ? '' : String(correct_answer),
      explanation,
      toBooleanInt(is_published)
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '新增研学问题成功。')
  } catch (error) {
    console.error('新增研学问题失败：', error)
    return fail(res, '新增研学问题失败。', 500)
  }
})

/**
 * GET /api/admin/questions?spot_id=1
 * 获取研学问题。
 */
router.get('/questions', (req, res) => {
  try {
    const { spot_id } = req.query

    let sql = `
      SELECT
        quiz_questions.*,
        spots.name AS spot_name
      FROM quiz_questions
      LEFT JOIN spots ON quiz_questions.spot_id = spots.id
    `

    const params = []

    if (spot_id) {
      sql += ' WHERE quiz_questions.spot_id = ?'
      params.push(Number(spot_id))
    }

    sql += ' ORDER BY quiz_questions.spot_id ASC, quiz_questions.id ASC'

    const questions = db.prepare(sql).all(...params)

    const formattedQuestions = questions.map((item) => ({
      ...item,
      options: item.options_json
        ? JSON.parse(item.options_json)
        : []
    }))

    return success(res, formattedQuestions, '获取研学问题成功。')
  } catch (error) {
    console.error('获取研学问题失败：', error)
    return fail(res, '获取研学问题失败。', 500)
  }
})

/**
 * =====================================================
 * 5. 管理服务点
 * =====================================================
 */

/**
 * GET /api/admin/service-points
 * 获取全部服务点。
 */
router.get('/service-points', (req, res) => {
  try {
    const services = db.prepare(`
      SELECT *
      FROM service_points
      ORDER BY id DESC
    `).all()

    return success(res, services, '获取后台服务点成功。')
  } catch (error) {
    console.error('获取后台服务点失败：', error)
    return fail(res, '获取服务点失败。', 500)
  }
})

/**
 * POST /api/admin/service-points
 * 新增服务点。
 */
router.post('/service-points', (req, res) => {
  try {
    const {
      name,
      type = '其他',
      address = '',
      map_x = null,
      map_y = null,
      latitude = null,
      longitude = null,
      description = '',
      opening_hours = '',
      navigation_url = '',
      is_published = true
    } = req.body

    if (!name || !String(name).trim()) {
      return fail(res, '服务点名称不能为空。')
    }

    const result = db.prepare(`
      INSERT INTO service_points (
        name,
        type,
        address,
        map_x,
        map_y,
        latitude,
        longitude,
        description,
        opening_hours,
        navigation_url,
        is_published,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      String(name).trim(),
      type,
      address,
      map_x === '' ? null : map_x,
      map_y === '' ? null : map_y,
      latitude === '' ? null : latitude,
      longitude === '' ? null : longitude,
      description,
      opening_hours,
      navigation_url,
      toBooleanInt(is_published)
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '新增服务点成功。')
  } catch (error) {
    console.error('新增服务点失败：', error)
    return fail(res, '新增服务点失败。', 500)
  }
})

/**
 * =====================================================
 * 6. 后台查看反馈
 * =====================================================
 */

/**
 * GET /api/admin/feedbacks
 * 获取体验反馈。
 *
 * 可选参数：
 * ?limit=100
 * ?offset=0
 */
router.get('/feedbacks', (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    const offset = Math.max(Number(req.query.offset) || 0, 0)

    const total = db.prepare(`
      SELECT COUNT(*) AS count
      FROM feedbacks
    `).get()

    const feedbacks = db.prepare(`
      SELECT *
      FROM feedbacks
      ORDER BY created_at DESC, id DESC
      LIMIT ?
      OFFSET ?
    `).all(limit, offset)

    return success(res, {
      total: total.count,
      list: feedbacks
    }, '获取反馈数据成功。')
  } catch (error) {
    console.error('获取反馈数据失败：', error)
    return fail(res, '获取反馈数据失败。', 500)
  }
})

/**
 * =====================================================
 * 7. 后台基础统计
 * =====================================================
 */

/**
 * GET /api/admin/statistics
 * 获取后台首页可展示的基础数据。
 */
router.get('/statistics', (req, res) => {
  try {
    const totalSpots = db.prepare(`
      SELECT COUNT(*) AS count FROM spots
    `).get()

    const publishedSpots = db.prepare(`
      SELECT COUNT(*) AS count
      FROM spots
      WHERE is_published = 1
    `).get()

    const totalFeedbacks = db.prepare(`
      SELECT COUNT(*) AS count
      FROM feedbacks
    `).get()

    const totalEvents = db.prepare(`
      SELECT COUNT(*) AS count
      FROM user_events
    `).get()

    const totalVisitors = db.prepare(`
      SELECT COUNT(DISTINCT visitor_id) AS count
      FROM user_events
    `).get()

    const totalAudioPlays = db.prepare(`
      SELECT COUNT(*) AS count
      FROM user_events
      WHERE event_type = 'audio_play'
    `).get()

    const totalCheckins = db.prepare(`
      SELECT COUNT(*) AS count
      FROM user_events
      WHERE event_type = 'spot_checkin'
    `).get()

    const totalCollections = db.prepare(`
      SELECT COUNT(*) AS count
      FROM user_events
      WHERE event_type = 'spot_collect'
    `).get()

    const scores = db.prepare(`
      SELECT
        ROUND(AVG(clarity_score), 2) AS clarity_score,
        ROUND(AVG(immersion_score), 2) AS immersion_score,
        ROUND(AVG(emotion_score), 2) AS emotion_score,
        ROUND(AVG(knowledge_score), 2) AS knowledge_score,
        ROUND(AVG(action_score), 2) AS action_score
      FROM feedbacks
    `).get()

    return success(res, {
      spots: {
        total: totalSpots.count,
        published: publishedSpots.count
      },
      feedbacks: {
        total: totalFeedbacks.count
      },
      events: {
        total: totalEvents.count,
        visitors: totalVisitors.count,
        audio_plays: totalAudioPlays.count,
        checkins: totalCheckins.count,
        collections: totalCollections.count
      },
      experience_scores: scores
    }, '获取统计数据成功。')
  } catch (error) {
    console.error('获取统计数据失败：', error)
    return fail(res, '获取统计数据失败。', 500)
  }
})
/* =====================================================
   音频编辑
   PUT /api/admin/audios/:id
   ===================================================== */

router.put('/audios/:id', (req, res) => {
  try {
    const audioId = Number(req.params.id)

    if (!Number.isInteger(audioId) || audioId <= 0) {
      return fail(res, '音频 ID 不合法。')
    }

    const existing = db.prepare(`
      SELECT id
      FROM audios
      WHERE id = ?
    `).get(audioId)

    if (!existing) {
      return fail(res, '未找到要编辑的音频。', 404)
    }

    const {
      spot_id,
      title,
      audio_url,
      duration = 0,
      transcript = '',
      audio_type = '其他',
      record_time = '',
      record_location = '',
      narrator = '',
      authorization_status = 'pending',
      is_public = false,
      sort_order = 1
    } = req.body

    if (!spot_id || !title || !audio_url) {
      return fail(res, 'spot_id、音频标题、音频地址不能为空。')
    }

    db.prepare(`
      UPDATE audios
      SET
        spot_id = ?,
        title = ?,
        audio_url = ?,
        duration = ?,
        transcript = ?,
        audio_type = ?,
        record_time = ?,
        record_location = ?,
        narrator = ?,
        authorization_status = ?,
        is_public = ?,
        sort_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      Number(spot_id),
      title,
      audio_url,
      Number(duration) || 0,
      transcript,
      audio_type,
      record_time,
      record_location,
      narrator,
      authorization_status,
      toBooleanInt(is_public),
      Number(sort_order) || 1,
      audioId
    )

    return success(res, null, '编辑音频成功。')
  } catch (error) {
    console.error('编辑音频失败：', error)
    return fail(res, '编辑音频失败。', 500)
  }
})

/* =====================================================
   音频删除
   DELETE /api/admin/audios/:id
   ===================================================== */

router.delete('/audios/:id', (req, res) => {
  try {
    const audioId = Number(req.params.id)

    const result = db.prepare(`
      DELETE FROM audios
      WHERE id = ?
    `).run(audioId)

    if (result.changes === 0) {
      return fail(res, '未找到要删除的音频。', 404)
    }

    return success(res, null, '删除音频成功。')
  } catch (error) {
    console.error('删除音频失败：', error)
    return fail(res, '删除音频失败。', 500)
  }
})

/* =====================================================
   问答编辑
   PUT /api/admin/questions/:id
   ===================================================== */

router.put('/questions/:id', (req, res) => {
  try {
    const questionId = Number(req.params.id)

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return fail(res, '问答 ID 不合法。')
    }

    const existing = db.prepare(`
      SELECT id
      FROM quiz_questions
      WHERE id = ?
    `).get(questionId)

    if (!existing) {
      return fail(res, '未找到要编辑的问答。', 404)
    }

    const {
      spot_id,
      question,
      question_type = 'single',
      options = [],
      correct_answer = '',
      explanation = '',
      is_published = true
    } = req.body

    if (!spot_id || !question) {
      return fail(res, 'spot_id 和问题内容不能为空。')
    }

    db.prepare(`
      UPDATE quiz_questions
      SET
        spot_id = ?,
        question = ?,
        question_type = ?,
        options_json = ?,
        correct_answer = ?,
        explanation = ?,
        is_published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      Number(spot_id),
      question,
      question_type,
      JSON.stringify(options || []),
      String(correct_answer),
      explanation,
      toBooleanInt(is_published),
      questionId
    )

    return success(res, null, '编辑研学问答成功。')
  } catch (error) {
    console.error('编辑研学问答失败：', error)
    return fail(res, '编辑研学问答失败。', 500)
  }
})

/* =====================================================
   问答删除
   DELETE /api/admin/questions/:id
   ===================================================== */

router.delete('/questions/:id', (req, res) => {
  try {
    const questionId = Number(req.params.id)

    const result = db.prepare(`
      DELETE FROM quiz_questions
      WHERE id = ?
    `).run(questionId)

    if (result.changes === 0) {
      return fail(res, '未找到要删除的研学问答。', 404)
    }

    return success(res, null, '删除研学问答成功。')
  } catch (error) {
    console.error('删除研学问答失败：', error)
    return fail(res, '删除研学问答失败。', 500)
  }
})

/* =====================================================
   服务点编辑
   PUT /api/admin/service-points/:id
   ===================================================== */

router.put('/service-points/:id', (req, res) => {
  try {
    const serviceId = Number(req.params.id)

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      return fail(res, '服务点 ID 不合法。')
    }

    const existing = db.prepare(`
      SELECT id
      FROM service_points
      WHERE id = ?
    `).get(serviceId)

    if (!existing) {
      return fail(res, '未找到要编辑的服务点。', 404)
    }

    const {
      name,
      type = '其他',
      address = '',
      map_x = null,
      map_y = null,
      latitude = null,
      longitude = null,
      description = '',
      opening_hours = '',
      navigation_url = '',
      is_published = true
    } = req.body

    if (!name || !String(name).trim()) {
      return fail(res, '服务点名称不能为空。')
    }

    db.prepare(`
      UPDATE service_points
      SET
        name = ?,
        type = ?,
        address = ?,
        map_x = ?,
        map_y = ?,
        latitude = ?,
        longitude = ?,
        description = ?,
        opening_hours = ?,
        navigation_url = ?,
        is_published = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      String(name).trim(),
      type,
      address,
      map_x === '' ? null : map_x,
      map_y === '' ? null : map_y,
      latitude === '' ? null : latitude,
      longitude === '' ? null : longitude,
      description,
      opening_hours,
      navigation_url,
      toBooleanInt(is_published),
      serviceId
    )

    return success(res, null, '编辑服务点成功。')
  } catch (error) {
    console.error('编辑服务点失败：', error)
    return fail(res, '编辑服务点失败。', 500)
  }
})

/* =====================================================
   服务点删除
   DELETE /api/admin/service-points/:id
   ===================================================== */

router.delete('/service-points/:id', (req, res) => {
  try {
    const serviceId = Number(req.params.id)

    const result = db.prepare(`
      DELETE FROM service_points
      WHERE id = ?
    `).run(serviceId)

    if (result.changes === 0) {
      return fail(res, '未找到要删除的服务点。', 404)
    }

    return success(res, null, '删除服务点成功。')
  } catch (error) {
    console.error('删除服务点失败：', error)
    return fail(res, '删除服务点失败。', 500)
  }
})
module.exports = router