import request from '../utils/request'

export function login(data) {
  return request({
    url: '/api/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/api/register',
    method: 'post',
    data
  })
} 