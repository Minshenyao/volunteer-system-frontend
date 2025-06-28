<template>
  <div class="activities-container">
    <div class="activities-header">
      <el-button type="primary" class="create-btn" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <!-- 添加加载状态显示 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 添加空状态显示 -->
    <el-empty
      v-else-if="!tasks.length"
      description="暂无活动"
    />

    <div v-else class="activities-grid">
      <el-row :gutter="24">
        <el-col v-for="task in tasks" :key="task.id" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="activity-card" :class="{ 'is-full': task.joined >= task.limit }">
            <div class="card-content">
              <div class="activity-status">
                <el-tag :type="getStatusType(task)" effect="light">
                  {{ getStatusText(task) }}
                </el-tag>
                <span class="spots-left">
                  {{ task.limit - task.joined }} 个名额
                </span>
              </div>
              
              <h2 class="activity-name">{{ task.name }}</h2>
              
              <div class="activity-info">
                <div class="info-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDateRange(task.start_time, task.end_time) }}</span>
                </div>
                <div class="info-item">
                  <el-icon><Location /></el-icon>
                  <span>{{ task.location }}</span>
                </div>
                <div class="info-item">
                  <el-icon><Timer /></el-icon>
                  <span>{{ formatTimeRange(task.start_time, task.end_time) }}</span>
                </div>
              </div>

              <div class="progress-section">
                <div class="progress-text">
                  <span>报名进度</span>
                  <span>{{ task.joined }}/{{ task.limit }}</span>
                </div>
                <el-progress 
                  :percentage="(task.joined / task.limit) * 100"
                  :status="task.joined >= task.limit ? 'success' : ''"
                />
              </div>

              <div class="card-actions">
                <el-button 
                  type="primary" 
                  :disabled="isActivityDisabled(task)"
                  @click="handleJoin(task)"
                >
                  {{ getButtonText(task) }}
                </el-button>
                <el-button type="info" text @click="handleViewDetails(task)">
                  查看详情
                </el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 创建活动对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建活动"
      width="600px"
      class="create-dialog"
    >
      <el-form 
        :model="newActivity" 
        :rules="rules" 
        ref="formRef" 
        label-width="100px"
      >
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="newActivity.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="newActivity.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            :locale="zhCn"
            :default-time="[
              new Date(2000, 1, 1, 8, 0, 0),
              new Date(2000, 1, 1, 17, 0, 0)
            ]"
            :shortcuts="[
              {
                text: '未来一周',
                value: () => {
                  const start = new Date()
                  const end = new Date()
                  end.setTime(start.getTime() + 3600 * 1000 * 24 * 7)
                  return [start, end]
                },
              },
              {
                text: '未来一个月',
                value: () => {
                  const start = new Date()
                  const end = new Date()
                  end.setTime(start.getTime() + 3600 * 1000 * 24 * 30)
                  return [start, end]
                },
              }
            ]"
            :disabledDate="disabledDate"
          />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="newActivity.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="人数限制" prop="limit">
          <el-input-number v-model="newActivity.limit" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      :title="currentTask?.name"
      width="800px"
      class="details-dialog"
      :modal-class="'details-modal'"
      destroy-on-close
    >
      <div class="task-details">
        <div class="header-section">
          <div class="status-tag" :class="getStatusType(currentTask)">
            {{ getStatusText(currentTask) }}
          </div>
          <h3 class="section-title">活动详情</h3>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <el-icon><Calendar /></el-icon>
            <div class="info-content">
              <div class="info-label">活动时间</div>
              <div class="info-value">{{ formatDateRange(currentTask?.start_time, currentTask?.end_time) }}</div>
              <div class="info-value time">{{ formatTimeRange(currentTask?.start_time, currentTask?.end_time) }}</div>
            </div>
          </div>
          <div class="info-item">
            <el-icon><Location /></el-icon>
            <div class="info-content">
              <div class="info-label">活动地点</div>
              <div class="info-value">{{ currentTask?.location }}</div>
            </div>
          </div>
          <div class="info-item">
            <el-icon><User /></el-icon>
            <div class="info-content">
              <div class="info-label">报名情况</div>
              <div class="info-value">
                <el-progress 
                  :percentage="(currentTask?.joined / currentTask?.limit) * 100"
                  :format="() => `${currentTask?.joined}/${currentTask?.limit}`"
                  :stroke-width="8"
                  class="progress"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="participants-section">
          <h3 class="section-title">参与人员</h3>
          <div v-if="!currentTask?.participants?.length" class="no-participants">
            <el-empty description="暂无人员报名" />
          </div>
          <div v-else class="participants-grid">
            <div v-for="participant in currentTask.participants" 
                 :key="participant.Email"
                 class="participant-card"
            >
              <el-avatar :src="participant.Avatar" :size="56" />
              <div class="participant-info">
                <div class="name">{{ participant.Nickname }}</div>
                <div class="contact">{{ participant.Email }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus, Calendar, Location, Timer, User } from '@element-plus/icons-vue'
import { getTasks, createTask, joinTask, getTaskDetails, getTaskStatus } from '../api/task'
import { createMessage } from '../api/message'
import { useUserStore } from '../stores/user'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const tasks = ref([])
const showCreateDialog = ref(false)
const loading = ref(false)
const showDetailsDialog = ref(false)
const currentTask = ref(null)
const taskDetails = ref(null)

const newActivity = ref({
  name: '',
  timeRange: [],
  location: '',
  limit: 1
})

const userStore = useUserStore()

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' }
  ],
  timeRange: [
    { required: true, message: '请选择活动时间', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入活动地点', trigger: 'blur' }
  ],
  limit: [
    { required: true, message: '请输入人数限制', trigger: 'change' }
  ]
}

const formRef = ref(null)

// 获取布局组件的引用
const layoutRef = inject('layoutRef')

// 获取活动列表
const fetchTasks = async () => {
  try {
    loading.value = true
    const response = await getTasks()
    if (response?.data?.data?.tasks) {
      tasks.value = response.data.data.tasks
      // 获取每个任务的状态
      await Promise.all(tasks.value.map(task => updateTaskStatus(task)))
    } else {
      ElMessage.error('数据格式错误')
    }
  } catch (error) {
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 格式化时间范围
const formatTimeRange = (start, end) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

// 格式化日期范围
const formatDateRange = (start, end) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  return `${startDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })} 至 ${endDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`
}

// 将字符串时间转换为时间戳
const parseDateTime = (dateTimeStr) => {
  // 将字符串格式 "2025-01-23 15:46:38" 转换为时间戳
  const [date, time] = dateTimeStr.split(' ')
  const [year, month, day] = date.split('-')
  const [hour, minute, second] = time.split(':')
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // 月份从0开始
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  ).getTime()
}

// 获取状态文本
const getStatusText = (task) => {
  const now = new Date().getTime()
  const endTime = parseDateTime(task.end_time)
  
  // 首先检查任务状态
  if (task.status === 0) return '待审核'
  if (task.status === 1) return '已通过'
  if (task.status === 2) return '未通过'
  
  // 如果没有状态或状态为3（未参加），则显示常规状态
  if (task.joined >= task.limit) return '名额已满'
  if (now > endTime) return '已结束'
  return '报名中'
}

// 获取状态类型（用于标签样式）
const getStatusType = (task) => {
  const now = new Date().getTime()
  const endTime = parseDateTime(task.end_time)
  
  // 首先检查任务状态
  if (task.status === 0) return 'warning'  // 待审核：黄色
  if (task.status === 1) return 'success'  // 已通过：绿色
  if (task.status === 2) return 'danger'   // 未通过：红色
  
  // 如果没有状态或状态为3（未参加），则显示常规状态
  if (task.joined >= task.limit) return 'info'    // 名额已满：灰色
  if (now > endTime) return 'danger'              // 已结束：红色
  return 'success'                                // 报名中：绿色
}

// 获取按钮文本
const getButtonText = (task) => {
  const now = new Date().getTime()
  const endTime = parseDateTime(task.end_time)
  
  if (task.status === 0) return '审核中'
  if (task.status === 1) return '已通过'
  if (task.status === 2) return '未通过'
  if (task.joined >= task.limit) return '名额已满'
  if (now > endTime) return '活动已结束'
  return '立即报名'
}

// 检查活动是否应该禁用报名按钮
const isActivityDisabled = (task) => {
  const now = new Date().getTime()
  const endTime = parseDateTime(task.end_time)
  return task.joined >= task.limit || now > endTime || task.status === 0 || task.status === 1 || task.status === 2
}

// 获取任务状态并更新
const updateTaskStatus = async (task) => {
  try {
    const response = await getTaskStatus(task.id)
    if (response?.data?.data?.taskStatus) {
      task.status = response.data.data.taskStatus.status
    }
  } catch (error) {
    return
  }
}

// 处理报名
const handleJoin = async (task) => {
  try {
    // 检查活动状态
    const now = new Date().getTime()
    const endTime = parseDateTime(task.end_time)

    if (task.status === 0) {
      ElMessage.warning('您的报名正在审核中')
      return
    }

    if (task.status === 1) {
      ElMessage.success('您已成功报名该活动')
      return
    }

    if (task.joined >= task.limit) {
      ElMessage.error('该活动名额已满')
      return
    }

    if (now > endTime) {
      ElMessage.error('该活动已结束')
      return
    }

    // 准备报名数据
    const joinData = {
      id: task.id,
      name: task.name,
      start_time: task.start_time,
      end_time: task.end_time,
      location: task.location
    }

    await joinTask(joinData)
    ElMessage.success('报名成功，请等待审核')
    
    // 创建未读消息
    try {
      await createMessage({
        userID: userStore.userInfo.volunteerID,
        title: '活动报名申请',
        content: `您已成功申请参加"${task.name}"活动，请等待审核`
      })
      
      // 显示通知
      ElNotification({
        title: '报名申请提交成功',
        message: `您已成功申请参加"${task.name}"活动，请等待审核`,
        type: 'success',
        duration: 5000
      })

      // 刷新右上角的消息数量
      if (layoutRef?.value?.fetchMessages) {
        await layoutRef.value.fetchMessages()
      }
    } catch (error) {
      return
    }
    
    // 刷新任务状态
    await updateTaskStatus(task)
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '报名失败')
  }
}

// 查看详情
const handleViewDetails = async (task) => {
  try {
    currentTask.value = task
    showDetailsDialog.value = true
    
    const response = await getTaskDetails()
    if (response?.data?.data?.taskDetails) {
      // 找到当前任务的详细信息
      const taskDetail = response.data.data.taskDetails.find(t => t.id === task.id)
      if (taskDetail) {
        currentTask.value = taskDetail
        taskDetails.value = response.data.data  // 设置 taskDetails 的值
      }
    }
  } catch (error) {
    ElMessage.error('获取任务详情失败')
  }
}

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
}

// 处理创建活动
const handleCreate = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 确保 timeRange 存在且包含两个值
    if (!newActivity.value.timeRange || newActivity.value.timeRange.length !== 2) {
      ElMessage.error('请选择完整的活动时间范围')
      return
    }

    const [startTime, endTime] = newActivity.value.timeRange

    // 验证开始时间必须早于结束时间
    if (new Date(startTime) >= new Date(endTime)) {
      ElMessage.error('开始时间必须早于结束时间')
      return
    }

    const taskData = {
      name: newActivity.value.name,
      startTime,
      endTime,
      location: newActivity.value.location,
      limit: newActivity.value.limit
    }

    await createTask(taskData)
    ElMessage.success('活动创建成功')
    showCreateDialog.value = false
    
    // 重置表单
    newActivity.value = {
      name: '',
      timeRange: [],
      location: '',
      limit: 1
    }
    
    // 刷新活动列表
    await fetchTasks()
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '创建活动失败')
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style lang="scss" scoped>
.activities-container {
  padding: 24px;
  
  .activities-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 32px;
    
    .create-btn {
      font-weight: 500;
    }
  }
  
  .activities-grid {
    .activity-card {
      background: var(--bg-color);
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
      margin-bottom: 24px;
      border: 1px solid var(--border-color);
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      }
      
      &.is-full {
        opacity: 0.8;
      }
      
      .card-content {
        padding: 24px;
        
        .activity-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          
          .spots-left {
            font-size: 14px;
            color: var(--text-secondary);
          }
        }
        
        .activity-name {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--text-primary);
        }
        
        .activity-info {
          margin-bottom: 20px;
          
          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: var(--text-regular);
            
            .el-icon {
              font-size: 16px;
              color: var(--primary-color);
            }
          }
        }
        
        .progress-section {
          margin-bottom: 20px;
          
          .progress-text {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: var(--text-regular);
            font-size: 14px;
          }
        }
        
        .card-actions {
          display: flex;
          gap: 12px;
          
          .el-button {
            flex: 1;
          }
        }
      }
    }
  }

  .loading-container {
    padding: 20px;
  }
}

.create-dialog {
  :deep(.el-dialog__body) {
    padding: 24px 40px;
  }
}

.activity-status {
  .el-tag {
    // 添加一些过渡效果
    transition: all 0.3s ease;
    
    &.el-tag--info {
      background-color: #909399;
      border-color: #909399;
      color: #fff;
    }
    
    &.el-tag--warning {
      background-color: #e6a23c;
      border-color: #e6a23c;
      color: #fff;
    }
    
    &.el-tag--success {
      background-color: #67c23a;
      border-color: #67c23a;
      color: #fff;
    }
    
    &.el-tag--danger {
      background-color: #f56c6c;
      border-color: #f56c6c;
      color: #fff;
    }
  }
}

.activity-info {
  .info-item {
    // 增加日期范围的显示空间
    &:first-child {
      margin-bottom: 12px;  // 给日期范围更多空间
    }
  }
}

.card-actions {
  .el-button {
    &.is-disabled {
      opacity: 0.8;
      cursor: not-allowed;
      
      // 为不同状态添加不同样式
      &[disabled="true"] {
        &.status-pending {
          background-color: #e6a23c;
          border-color: #e6a23c;
          color: #fff;
        }
        
        &.status-approved {
          background-color: #67c23a;
          border-color: #67c23a;
          color: #fff;
        }
        
        &.status-rejected {
          background-color: #f56c6c;
          border-color: #f56c6c;
          color: #fff;
        }
      }
    }
  }
}

.details-dialog {
  :deep(.el-dialog__header) {
    padding: 24px 32px;
    margin: 0;
    border-bottom: 1px solid var(--border-color);
    
    .el-dialog__title {
      font-size: 24px;
      font-weight: 500;
      color: var(--text-primary);
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }

  .task-details {
    .header-section {
      padding: 24px 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      
      .status-tag {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        
        &.warning {
          background-color: #fdf6ec;
          color: #e6a23c;
        }
        
        &.success {
          background-color: #f0f9eb;
          color: #67c23a;
        }
        
        &.danger {
          background-color: #fef0f0;
          color: #f56c6c;
        }
        
        &.info {
          background-color: #f4f4f5;
          color: #909399;
        }
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      padding: 24px 32px;
      background-color: var(--bg-color-overlay);
      
      .info-item {
        display: flex;
        gap: 16px;
        
        .el-icon {
          font-size: 24px;
          color: var(--primary-color);
        }
        
        .info-content {
          flex: 1;
          
          .info-label {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 8px;
          }
          
          .info-value {
            font-size: 16px;
            color: var(--text-primary);
            
            &.time {
              font-size: 14px;
              color: var(--text-secondary);
              margin-top: 4px;
            }
          }
          
          .progress {
            margin-top: 8px;
          }
        }
      }
    }

    .participants-section {
      padding: 24px 32px;
      
      .section-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--text-primary);
        margin: 0 0 24px;
      }
      
      .participants-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
        
        .participant-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-color-overlay);
          border-radius: 12px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          
          .participant-info {
            .name {
              font-size: 16px;
              font-weight: 500;
              color: var(--text-primary);
              margin-bottom: 4px;
            }
            
            .contact {
              font-size: 14px;
              color: var(--text-secondary);
            }
          }
        }
      }
    }
  }
}

// 添加全局样式
:deep(.details-modal) {
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.2);
}
</style> 