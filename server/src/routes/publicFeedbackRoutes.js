const express = require('express')
const db = require('../config/database')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * 将 true / false、1 / 0、"1" / "0" 统一转换为 1 或 0。
 */
function toBooleanInt(value) {
  return value === true || value === 1 || value === '1'
    ? 1
    : 0
}

/**
 * 检查五维评分是否为 1-5 的整数。
 */
function isValidScore(value) {
  const score = Number(value)

  return Number.isInteger(score) &&
    score >= 1 &&
    score <= 5
}

/**
 * POST /api/feedbacks
 * 提交用户五维体验评价与开放反馈。
 */
router.post('/', (req, res) => {
  try {
    const {
      visitor_id,
      completed_spot_count = 0,

      clarity_score,
      immersion_score,
      emotion_score,
      knowledge_score,
      action_score,

      share_intention = false,
      recommend_intention = false,
      revisit_intention = false,
      purchase_intention = false,
      study_intention = false,
      payment_intention = false,

      suggestions = ''
    } = req.body

    if (!visitor_id || typeof visitor_id !== 'string') {
      return fail(res, 'visitor_id 不能为空。')
    }

    const scoreList = [
      clarity_score,
      immersion_score,
      emotion_score,
      knowledge_score,
      action_score
    ]

    if (!scoreList.every(isValidScore)) {
      return fail(res, '五维体验评分必须是 1 到 5 的整数。')
    }

    const result = db.prepare(`
      INSERT INTO feedbacks (
        visitor_id,
        completed_spot_count,
        clarity_score,
        immersion_score,
        emotion_score,
        knowledge_score,
        action_score,
        share_intention,
        recommend_intention,
        revisit_intention,
        purchase_intention,
        study_intention,
        payment_intention,
        suggestions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      visitor_id,
      Number(completed_spot_count) || 0,

      Number(clarity_score),
      Number(immersion_score),
      Number(emotion_score),
      Number(knowledge_score),
      Number(action_score),

      toBooleanInt(share_intention),
      toBooleanInt(recommend_intention),
      toBooleanInt(revisit_intention),
      toBooleanInt(purchase_intention),
      toBooleanInt(study_intention),
      toBooleanInt(payment_intention),

      String(suggestions || '').slice(0, 1000)
    )

    return success(res, {
      id: result.lastInsertRowid
    }, '感谢你的反馈，提交成功。')
  } catch (error) {
    console.error('提交体验反馈失败：', error)
    return fail(res, '提交体验反馈失败。', 500)
  }
})

module.exports = router