import request from './request'

/* =========================
   管理员认证
========================= */

export function adminLogin(payload) {
  return request.post('/admin/login', payload)
}

/* =========================
   数据概览
========================= */

export function getAdminStatistics() {
  return request.get('/admin/statistics')
}

/* =========================
   点位管理
========================= */

export function getAdminSpots() {
  return request.get('/admin/spots')
}

export function createSpot(payload) {
  return request.post('/admin/spots', payload)
}

export function updateSpot(id, payload) {
  return request.put(`/admin/spots/${id}`, payload)
}

export function deleteSpot(id) {
  return request.delete(`/admin/spots/${id}`)
}

/* =========================
   文件上传
========================= */

export function uploadFile(file) {
  const formData = new FormData()

  formData.append('file', file)

  return request.post('/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/* =========================
   音频管理
========================= */

export function getAdminAudios(params = {}) {
  return request.get('/admin/audios', { params })
}

export function createAudio(payload) {
  return request.post('/admin/audios', payload)
}

export function updateAudio(id, payload) {
  return request.put(`/admin/audios/${id}`, payload)
}

export function deleteAudio(id) {
  return request.delete(`/admin/audios/${id}`)
}

/* =========================
   问答管理
========================= */

export function getAdminQuestions(params = {}) {
  return request.get('/admin/questions', { params })
}

export function createQuestion(payload) {
  return request.post('/admin/questions', payload)
}

export function updateQuestion(id, payload) {
  return request.put(`/admin/questions/${id}`, payload)
}

export function deleteQuestion(id) {
  return request.delete(`/admin/questions/${id}`)
}

/* =========================
   服务设施管理
========================= */

export function getAdminServicePoints() {
  return request.get('/admin/service-points')
}

export function createServicePoint(payload) {
  return request.post('/admin/service-points', payload)
}

export function updateServicePoint(id, payload) {
  return request.put(`/admin/service-points/${id}`, payload)
}

export function deleteServicePoint(id) {
  return request.delete(`/admin/service-points/${id}`)
}

/* =========================
   反馈数据
========================= */

export function getAdminFeedbacks(params = {}) {
  return request.get('/admin/feedbacks', { params })
}