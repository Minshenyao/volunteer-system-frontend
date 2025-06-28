<template>
  <div class="dashboard-container">
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <template v-else>
      <div class="welcome-section">
        <h1>欢迎回来，{{ userStore.userInfo?.nickName }}</h1>
        <p class="subtitle">今天是 {{ getCurrentDate() }}，让我们继续为社会贡献力量</p>
      </div>

      <div class="stats-grid">
        <!-- 活动统计卡片 -->
        <div class="stat-card">
          <div class="stat-header">
            <el-icon><Calendar /></el-icon>
            <span>活动统计</span>
          </div>
          <div class="stat-content">
            <div class="stat-item">
              <div class="stat-value">{{ stats.totalActivities || 0 }}</div>
              <div class="stat-label">总活动数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.joinedActivities || 0 }}</div>
              <div class="stat-label">已通过</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ stats.pendingActivities || 0 }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </div>

        <!-- 志愿时长卡片 -->
        <div class="stat-card">
          <div class="stat-header">
            <el-icon><Timer /></el-icon>
            <span>志愿时长</span>
          </div>
          <div class="stat-content">
            <el-progress 
              type="dashboard"
              :percentage="Math.min((stats.volunteerHours / 24) * 100, 100)"
              :color="progressColor"
            >
              <template #default="{ percentage }">
                <div class="progress-value">
                  <span class="value">{{ stats.volunteerHours }}</span>
                  <span class="unit">小时</span>
                </div>
              </template>
            </el-progress>
            <div class="progress-label">志愿服务时长</div>
          </div>
        </div>

        <!-- 最近活动卡片 -->
        <div class="stat-card recent-activities">
          <div class="stat-header">
            <el-icon><List /></el-icon>
            <span>最近活动</span>
          </div>
          <div class="stat-content">
            <div v-if="!recentActivities.length" class="no-data">
              暂无活动记录
            </div>
            <div v-else class="activity-list">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                <div class="activity-info">
                  <div class="activity-name">{{ activity.name }}</div>
                  <div class="activity-time">{{ formatDate(activity.start_time) }}</div>
                </div>
                <el-tag :type="getStatusType(activity)" size="small">
                  {{ getStatusText(activity) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知提醒卡片 -->
        <div class="stat-card notifications">
          <div class="stat-header">
            <el-icon><Bell /></el-icon>
            <span>通知提醒</span>
          </div>
          <div class="stat-content">
            <div v-if="!notifications.length" class="no-data">
              暂无通知
            </div>
            <div v-else class="notification-list">
              <div v-for="notification in notifications" :key="notification.id" class="notification-item">
                <el-icon :class="{ unread: !notification.read }"><InfoFilled /></el-icon>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useUserStore } from '../stores/user'
import { getTasks, getTaskDetails, getTaskStatus } from '../api/task'
import { getMessages } from '../api/message'
import { Calendar, Timer, List, Bell, InfoFilled } from '@element-plus/icons-vue'

const userStore = useUserStore()
const stats = ref({})
const recentActivities = ref([])
const notifications = ref([])
const loading = ref(true)

// 获取当前日期
const getCurrentDate = () => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

// 格式化日期
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric'
  })
}

// 获取状态类型
const getStatusType = (activity) => {
  switch (activity.status) {
    case 0:
      return 'warning'  // 待审核：黄色
    case 1:
      return 'success'  // 已通过：绿色
    case 2:
      return 'danger'   // 未通过：红色
    case 3:
      const now = new Date().getTime()
      const endTime = new Date(activity.end_time).getTime()
      if (activity.joined >= activity.limit) return 'info'    // 名额已满：灰色
      if (now > endTime) return 'danger'                      // 已结束：红色
      return 'primary'                                        // 报名中：蓝色
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (activity) => {
  switch (activity.status) {
    case 0:
      return '待审核'
    case 1:
      return '已通过'
    case 2:
      return '未通过'
    case 3:
      const now = new Date().getTime()
      const endTime = new Date(activity.end_time).getTime()
      if (activity.joined >= activity.limit) return '名额已满'
      if (now > endTime) return '已结束'
      return '报名中'
    default:
      return '报名中'
  }
}

// 进度条颜色
const progressColor = (percentage) => {
  if (percentage < 30) return '#909399'
  if (percentage < 70) return '#e6a23c'
  return '#67c23a'
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true

    // 获取所有数据
    const [tasksResponse, messagesResponse] = await Promise.all([
      getTasks(),
      getMessages(userStore.userInfo?.volunteerID)
    ])

    if (tasksResponse?.data?.data?.tasks) {
      const tasks = tasksResponse.data.data.tasks

      // 获取每个任务的状态
      const taskStatusPromises = tasks.map(async task => {
        try {
          const response = await getTaskStatus(task.id)
          const status = response?.data?.data?.taskStatus?.status
          // 如果获取到状态，使用该状态，否则默认为未参加(3)
          return {
            ...task,
            status: typeof status === 'number' ? status : 3
          }
        } catch (error) {
          return {
            ...task,
            status: 3 // 如果获取失败，默认为未参加
          }
        }
      })

      const tasksWithStatus = await Promise.all(taskStatusPromises)

      // 计算统计数据
      stats.value = {
        totalActivities: tasks.length,
        joinedActivities: tasksWithStatus.filter(t => t.status === 1).length, // 已通过
        pendingActivities: tasksWithStatus.filter(t => t.status === 0).length, // 待审核
        volunteerHours: ((userStore.userInfo?.duration || 0) / 60).toFixed(1),
        completionRate: calculateCompletionRate(tasksWithStatus)
      }

      // 获取最近5个活动，并包含状态信息
      recentActivities.value = tasksWithStatus
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    }

    if (messagesResponse?.data) {
      notifications.value = messagesResponse.data
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5)
    }
  } catch (error) {
    return
  } finally {
    loading.value = false
  }
}

// 计算完成率
const calculateCompletionRate = (tasks) => {
  if (!tasks.length) return 0
  // 只计算已通过和待审核的任务
  const participated = tasks.filter(t => t.status === 0 || t.status === 1).length
  return Math.round((participated / tasks.length) * 100)
}

// 监听用户信息变化
watch(() => userStore.userInfo, (newVal) => {
  if (newVal?.volunteerID) {
    fetchStats()
  }
}, { immediate: true })

// 在组件挂载时获取用户信息和数据
onMounted(async () => {
  if (!userStore.userInfo?.volunteerID) {
    await userStore.getUserInfo()
  }
  await fetchStats()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 32px;
  
  .welcome-section {
    margin-bottom: 40px;
    
    h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 12px;
      background: linear-gradient(45deg, var(--primary-color), #409eff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 16px;
      color: var(--text-secondary);
      margin: 0;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    
    .stat-card {
      background: var(--bg-color);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      }
      
      .stat-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        
        .el-icon {
          font-size: 24px;
          color: var(--primary-color);
        }
        
        span {
          font-size: 18px;
          font-weight: 500;
          color: var(--text-primary);
        }
      }
      
      .stat-content {
        .stat-item {
          text-align: center;
          
          .stat-value {
            font-size: 36px;
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 8px;
          }
          
          .stat-label {
            font-size: 14px;
            color: var(--text-secondary);
          }
        }
        
        .progress-value {
          text-align: center;
          
          .value {
            font-size: 28px;
            font-weight: 600;
            color: var(--primary-color);
          }
          
          .unit {
            font-size: 14px;
            color: var(--text-secondary);
            margin-left: 4px;
          }
        }
        
        .progress-label {
          text-align: center;
          margin-top: 12px;
          color: var(--text-secondary);
        }
      }
      
      &.recent-activities,
      &.notifications {
        .activity-list,
        .notification-list {
          .activity-item,
          .notification-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--border-color);
            
            &:last-child {
              border-bottom: none;
            }
            
            .activity-info,
            .notification-content {
              .activity-name,
              .notification-title {
                font-weight: 500;
                margin-bottom: 4px;
              }
              
              .activity-time,
              .notification-time {
                font-size: 12px;
                color: var(--text-secondary);
              }
            }
            
            .el-icon {
              &.unread {
                color: var(--primary-color);
              }
            }
          }
        }
        
        .no-data {
          text-align: center;
          color: var(--text-secondary);
          padding: 40px 0;
        }
      }
    }
  }

  .loading-container {
    padding: 40px;
  }

  .stats-grid {
    .stat-card {
      opacity: 1;
      transition: opacity 0.3s ease;
      
      &.loading {
        opacity: 0.6;
        pointer-events: none;
      }
    }
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style> 