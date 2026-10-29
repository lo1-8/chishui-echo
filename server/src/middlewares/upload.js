const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { fail } = require('../utils/response')

// 线上可通过 UPLOADS_PATH 将上传文件保存到持久磁盘
const uploadsRoot = process.env.UPLOADS_PATH
  ? path.resolve(process.env.UPLOADS_PATH)
  : path.join(process.cwd(), 'uploads')

const imageDirectory = path.join(
  uploadsRoot,
  'images'
)

const audioDirectory = path.join(
  uploadsRoot,
  'audios'
)

// 确保上传目录存在
fs.mkdirSync(imageDirectory, { recursive: true })
fs.mkdirSync(audioDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const isImage = file.mimetype.startsWith('image/')
    const isAudio = file.mimetype.startsWith('audio/')

    if (isImage) {
      return cb(null, imageDirectory)
    }

    if (isAudio) {
      return cb(null, audioDirectory)
    }

    return cb(new Error('仅支持上传图片或音频文件。'))
  },

  filename(req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase()

    // 文件名组成：
    // 时间戳 + 随机数 + 原扩展名
    const safeFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`

    cb(null, safeFileName)
  }
})

const upload = multer({
  storage,

  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024
  },

  fileFilter(req, file, cb) {
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    const allowedAudioTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/aac',
      'audio/mp4',
      'audio/ogg'
    ]

    const allowedTypes = [
      ...allowedImageTypes,
      ...allowedAudioTypes
    ]

    if (allowedTypes.includes(file.mimetype)) {
      return cb(null, true)
    }

    return cb(
      new Error('不支持该文件格式。图片仅支持 JPG、PNG、WebP；音频建议使用 MP3、WAV、AAC、OGG。')
    )
  }
})

/**
 * 统一处理 Multer 文件上传错误。
 */
function handleUploadError(error, req, res, next) {
  if (!error) {
    return next()
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return fail(res, '上传文件过大，请控制在 20MB 以内。')
    }

    return fail(res, `文件上传失败：${error.message}`)
  }

  return fail(res, error.message || '上传文件失败。')
}

module.exports = {
  upload,
  handleUploadError
}