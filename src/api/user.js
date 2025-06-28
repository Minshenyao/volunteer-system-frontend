import request from '../utils/request'

// 获取用户信息
export function getUserProfile(username) {
  return request({
    url: '/user/profile',
    method: 'get',
    params: { username }
  })
}

// 获取志愿者统计
export function getVolunteerCount() {
    return request({
      url: '/admin/volunteer_count',
      method: 'get'
    })
  } 

// 上传头像
export function uploadAvatar(formData) {
  return request({
    url: '/user/upload_avatar',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData
  })
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/user/change_password',
    method: 'put',
    data: {
      oldPassword: data.currentPassword,
      newPassword: data.newPassword
    }
  })
}

// 更新个人资料
export function changeProfile(data) {
    return request({
      url: '/user/update_profile',
      method: 'put',
      data: {
        name: data.name,
        gender: data.gender,
        contactInfo: data.contactInfo
      }
    })
}