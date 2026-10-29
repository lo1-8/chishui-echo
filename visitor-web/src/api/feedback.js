import request from './request'

/**
 * 提交红色声音体验五维评价。
 */
export function submitFeedback(payload) {
  return request.post('/feedbacks', payload)
}
