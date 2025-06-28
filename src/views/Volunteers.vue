<template>
  <div class="volunteers-container">
    <!-- 统计概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-details">
                <div class="stat-value">{{ totalVolunteers }}</div>
                <div class="stat-label">志愿者总数</div>
                <div class="stat-trend positive">
                  <el-icon><ArrowUp /></el-icon>
                  <span>较上月增长 12%</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon active">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-details">
                <div class="stat-value">{{ activeVolunteers }}</div>
                <div class="stat-label">活跃志愿者</div>
                <div class="stat-trend">
                  <el-icon><Histogram /></el-icon>
                  <span>活跃率 {{ (activeVolunteers / totalVolunteers * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="8">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon service">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-details">
                <div class="stat-value">{{ totalHours }}</div>
                <div class="stat-label">总服务时长（小时）</div>
                <div class="stat-trend positive">
                  <el-icon><TrendCharts /></el-icon>
                  <span>平均 {{ (totalHours / totalVolunteers).toFixed(1) }} 小时/人</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 志愿者列表 -->
    <el-card class="list-section" shadow="hover">
      <template #header>
        <div class="list-header">
          <div class="header-left">
            <h3 class="title">志愿者列表</h3>
            <el-tag type="info" effect="plain" class="count-tag" size="medium">
              共 {{ totalVolunteers }} 人
            </el-tag>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索志愿者姓名/账号/联系方式"
              :prefix-icon="Search"
              clearable
              class="search-input"
            />
            <el-button-group>
              <el-button :icon="Refresh" @click="handleRefreshList">刷新</el-button>
              <el-button type="primary" @click="exportExcel":icon="Download">导出</el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredVolunteers"
        style="width: 100%"
        border
      >
        <el-table-column label="志愿者信息" min-width="250" fixed="left" align="center">
          <template #default="{ row }">
            <div class="volunteer-info" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
              <el-avatar :size="46" :src="row.avatar">
                {{ row.email.charAt(0).toUpperCase() }}
              </el-avatar>
              <div class="info-content">
                <div class="primary-info">
                  <span class="email">{{ row.email }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="110" align="center">
          <template #default="{ row }">
            <div class="table-cell-content">
              <el-tag
                  size="medium"
                  :type="row.status === '下线' ? 'info' : 'success'"
                  class="status-tag"
              >
                {{ row.status }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="姓名" min-width="150" align="center">
          <template #default="{ row }">
            <div class="table-cell-content" style="display: flex; align-items: center; justify-content: center;">
              <span>{{ row.nickname || '未设置姓名' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="性别" min-width="110" align="center">
          <template #default="{ row }">
            <div class="table-cell-content" style="display: flex; align-items: center; justify-content: center;">
              <span>{{ row.gender || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="联系方式" min-width="200" align="center">
          <template #default="{ row }">
            <div class="table-cell-content" style="display: flex; align-items: center; justify-content: center;">
              <el-icon><Phone /></el-icon>
              <span>{{ row.phone || '未设置' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="服务时长" min-width="200" align="center">
          <template #default="{ row }">
            <div class="table-cell-content highlight" style="display: flex; align-items: center; justify-content: center;">
              <el-icon><Timer /></el-icon>
              <span>{{ row.duration }} 小时</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="最后活动" min-width="200" align="center">
          <template #default="{ row }">
            <div class="table-cell-content" style="display: flex; align-items: center; justify-content: center;">
              <el-icon><Clock /></el-icon>
              <span>{{ formatDate(row.last_login_time) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" min-width="120" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions" style="display: flex; align-items: center; justify-content: center;">
              <el-button link type="primary" @click="viewDetails(row)">
                详情
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalVolunteers"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      :title="selectedVolunteer?.email + ' 的详细信息'"
      width="800px"
      class="volunteer-details-dialog"
      :modal-class="'details-modal'"
      destroy-on-close
    >
      <div class="details-container">
        <!-- 个人信息区域 -->
        <div class="profile-section">
          <div class="avatar-section">
            <el-avatar :src="selectedVolunteer?.avatar" :size="100">
              {{ selectedVolunteer?.email?.charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="status-badge" :class="selectedVolunteer?.status?.toLowerCase()">
              {{ selectedVolunteer?.status }}
            </div>
          </div>
          <div class="info-section">
            <h2 class="volunteer-name">{{ selectedVolunteer?.email || selectedVolunteer?.nickname }}</h2>
            <div class="basic-info">
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>{{ selectedVolunteer?.nickname }}</span>
              </div>
              <div class="info-item">
                <el-icon><Male /></el-icon>
                <span>{{ selectedVolunteer?.gender || '未设置' }}</span>
              </div>
              <div class="info-item">
                <el-icon><Phone /></el-icon>
                <span>{{ selectedVolunteer?.phone || '未设置' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 统计数据区域 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-value">{{ selectedVolunteer?.duration || 0 }}</div>
            <div class="stat-label">志愿时长（分钟）</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatDate(selectedVolunteer?.last_login_time) || '暂无记录' }}</div>
            <div class="stat-label">最近活动</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ selectedVolunteer?.status }}</div>
            <div class="stat-label">当前状态</div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getVolunteerCount, getUserProfile } from '../api/user'
import { ElMessage } from 'element-plus'
import { 
  UserFilled, Timer, Clock, Search, ArrowUp, ArrowDown,
  Histogram, TrendCharts, Refresh, Download, Edit, List,
  Remove, Phone, CircleCheck, CircleClose, View, User, Male, Female, Location
} from '@element-plus/icons-vue'

const volunteers = ref([])
const searchQuery = ref('')
const totalVolunteers = ref(0)
const activeVolunteers = ref(0)
const totalHours = ref(0)
const showDetailsDialog = ref(false)
const selectedVolunteer = ref({})
const volunteerActivities = ref([])

const filteredVolunteers = computed(() => {
  if (!searchQuery.value) return volunteers.value
  const query = searchQuery.value.toLowerCase()
  return volunteers.value.filter(v => 
    (v.email && v.email.toLowerCase().includes(query)) ||
    (v.nickname && v.nickname.toLowerCase().includes(query)) ||
    (v.phone && v.phone.toLowerCase().includes(query)) ||
    (v.gender && v.gender.toLowerCase().includes(query))
  )
})

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '暂无记录'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchVolunteers = async () => {
  try {
    const { data } = await getVolunteerCount()
    if (data.status === 'success') {
      volunteers.value = data.data.volunteers
      totalVolunteers.value = volunteers.value.length
      activeVolunteers.value = volunteers.value.filter(v => v.status === '活跃').length
      totalHours.value = volunteers.value.reduce((sum, v) => sum + v.duration, 0)
    }
  } catch (error) {
    ElMessage.error('获取志愿者信息失败')
  }
}

const handleRefreshList = () => {
  fetchVolunteers()
}

const exportExcel = () => {
  ElMessage.info('该功能暂未开发')
}

const viewDetails = (volunteer) => {
  selectedVolunteer.value = volunteer
  showDetailsDialog.value = true
}

const getStatusClass = (activity) => {
  switch (activity.status) {
    case 0:
      return 'pending'
    case 1:
      return 'approved'
    case 2:
      return 'rejected'
    default:
      return ''
  }
}

const getStatusType = (activity) => {
  switch (activity.status) {
    case 0:
      return 'warning'
    case 1:
      return 'success'
    case 2:
      return 'danger'
    default:
      return ''
  }
}

const getStatusText = (activity) => {
  switch (activity.status) {
    case 0:
      return '待审核'
    case 1:
      return '已通过'
    case 2:
      return '已拒绝'
    default:
      return ''
  }
}

onMounted(() => {
  fetchVolunteers()
})
</script>

<style lang="scss" scoped>
.volunteers-container {
  .overview-section {
    margin-bottom: 24px;

    .stat-card {
      height: 100%;
      transition: all 0.3s ease;
      border: none;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      :deep(.el-card__body) {
        padding: 24px;
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 20px;

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--el-color-primary-light-7) 0%, var(--el-color-primary-light-3) 100%);
          
          .el-icon {
            font-size: 28px;
            color: var(--el-color-primary);
          }
        }

        .stat-details {
          flex: 1;
          
          .stat-value {
            font-size: 32px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            line-height: 1.2;
            margin-bottom: 8px;
          }

          .stat-label {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin-bottom: 12px;
          }

          .stat-trend {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 13px;
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-regular);

            &.positive {
              color: var(--el-color-success);
              background-color: var(--el-color-success-light-9);
            }

            .el-icon {
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  .list-section {
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    :deep(.el-card__header) {
      padding: 20px 24px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .count-tag {
          font-size: 13px;
          padding: 4px 8px;
          border-radius: 4px;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .search-input {
          width: 240px;
          
          :deep(.el-input__wrapper) {
            box-shadow: 0 0 0 1px var(--el-border-color) inset;
          }
        }
      }
    }

    :deep(.el-table) {
      // 设置表格基础变量
      --el-table-header-bg-color: var(--el-bg-color);
      --el-table-header-text-color: var(--el-text-color-primary);
      --el-table-text-color: var(--el-text-color-regular);
      --el-table-border-color: var(--el-border-color-lighter);
      --el-table-header-border-color: var(--el-border-color-lighter);
      --el-table-row-hover-bg-color: var(--el-fill-color-light);
      --el-table-current-row-bg-color: var(--el-bg-color);
      --el-table-fixed-box-shadow: none;
      
      // 表格整体背景
      background-color: var(--el-bg-color);
      
      // 表头和单元格样式
      th.el-table__cell,
      td.el-table__cell {
        background-color: var(--el-bg-color);
      }
    }

    // 分页器样式
    .table-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--el-border-color-lighter);
      display: flex;
      justify-content: flex-end;
    }
  }

  .volunteer-details-dialog {
    :deep(.el-dialog__header) {
      padding: 24px 32px;
      margin: 0;
      border-bottom: 1px solid var(--border-color);
      
      .el-dialog__title {
        font-size: 24px;
        font-weight: 500;
        background: linear-gradient(to right, #1a1a1a, #4a4a4a);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    
    :deep(.el-dialog__body) {
      padding: 0;
    }

    .details-container {
      .profile-section {
        padding: 32px;
        display: flex;
        gap: 24px;
        align-items: center;
        
        .avatar-section {
          position: relative;
          
          :deep(.el-avatar) {
            border: 4px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .status-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            
            &.活跃 {
              color: #67c23a;
            }
            
            &.下线 {
              color: #909399;
            }
          }
        }
        
        .info-section {
          flex: 1;
          
          .volunteer-name {
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 16px;
            background: linear-gradient(to right, #1a1a1a, #4a4a4a);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .basic-info {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            
            .info-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              background: rgba(0, 0, 0, 0.02);
              border-radius: 12px;
              
              .el-icon {
                font-size: 16px;
                color: #0070f3;
              }
              
              span {
                color: #666;
                font-size: 14px;
              }
            }
          }
        }
      }
      
      .stats-section {
        padding: 0 32px 32px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        
        .stat-card {
          padding: 24px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 16px;
          text-align: center;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            background: rgba(0, 0, 0, 0.03);
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #0070f3;
            margin-bottom: 8px;
          }
          
          .stat-label {
            font-size: 14px;
            color: #666;
          }
        }
      }
    }
  }
}

:deep(.details-modal) {
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.2);
}
</style>