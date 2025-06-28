import request from '../utils/request'

// 获取任务列表
export function getTasks() {
  return request({
    url: '/task/tasks',
    method: 'get'
  })
}

// 创建任务
export function createTask(data) {
  return request({
    url: '/admin/create_task',
    method: 'post',
    data: {
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      limit: data.limit
    }
  })
}

// 更新任务
export function updateTask(data) {
  return request({
    url: '/admin/update',
    method: 'post',
    data: {
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      limit: data.limit
    }
  })
}

// 删除任务
export function deleteTask(taskId) {
  return request({
    url: '/admin/delete_task',
    method: 'delete',
    params: {
      TaskId: taskId
    }
  })
}

// 报名参加任务
export function joinTask(data) {
  return request({
    url: '/task/join',
    method: 'post',
    data: {
      id: data.id,
      name: data.name,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location
    }
  })
}

// 获取任务详情
export function getTaskDetails() {
  return request({
    url: '/task/getTaskDetails',
    method: 'get'
  })
}

// 获取任务状态
export function getTaskStatus(taskId) {
  return request({
    url: '/task/getTaskStatus',
    method: 'get',
    params: {
      TaskId: taskId
    }
  })
}

// 获取指定项目待审核人员名单
export function getTaskAuditDetail(data){
  return request({
    url: "/admin/GetTaskAuditDetail",
    method: "post",
    data: {
      taskId: data.TaskId
    }
  })
}

// 通过审核
export function approveVolunteer(data){
  return request({
    url: "/admin/approveVolunteer",
    method: "post",
    data: {
      taskId: data.TaskId,
      email: data.email,
    }
  })
}

// 拒绝审核
export function rejectVolunteer(data){
  return request({
    url: "/admin/rejectVolunteer",
    method: "post",
    data: {
      taskId: data.TaskId,
      email: data.email,
    }
  })
}

