const express = require('express')
const path = require('path')
const { requireAdminAuth } = require('../middlewares/auth')
const {
  upload,
  handleUploadError
} = require('../middlewares/upload')
const { success, fail } = require('../utils/response')

const router = express.Router()

/**
 * POST /api/admin/upload
 *
 * 请求类型：multipart/form-data
 * 字段名：file
 */
router.post(
  '/',
  requireAdminAuth,
  upload.single('file'),
  handleUploadError,
  (req, res) => {
    try {
      if (!req.file) {
        return fail(res, '未接收到上传文件。')
      }

      const isImage = req.file.mimetype.startsWith('image/')
      const folder = isImage ? 'images' : 'audios'

      const fileUrl = `/uploads/${folder}/${req.file.filename}`

      return success(res, {
        original_name: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }, '文件上传成功。')
    } catch (error) {
      console.error('上传文件处理失败：', error)
      return fail(res, '上传文件失败。', 500)
    }
  }
)

module.exports = router