import request from '../utils/request'

// 创建消息
export function createMessage(data) {
  return request({
    url: '/message/',
    method: 'post',
    data: {
      userID: data.userID,
      title: data.title,
      content: data.content
    }
  })
}

// 获取消息列表
export function getMessages(userId) {
  return request({
    url: `/message/${userId}`,
    method: 'get'
  })
}

// 标记消息为已读
export function markMessageAsRead(messageId) {
  return request({
    url: `/message/${messageId}/read`,
    method: 'put'
  })
} 