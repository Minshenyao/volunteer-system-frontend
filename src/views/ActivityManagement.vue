<template>
  <div class="activity-management-container">
    <div class="header">
      <h1>志愿活动管理</h1>
      <el-button type="primary" class="create-btn" @click="handleCreateClick">
        <el-icon><Plus /></el-icon>
        创建活动
      </el-button>
    </div>

    <el-table :data="tasks" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="活动名称" />
      <el-table-column prop="location" label="活动地点" />
      <el-table-column label="开始时间">
        <template #default="{ row }">
          {{ formatDateTime(row.start_time) }}
        </template>
      </el-table-column>
      <el-table-column label="结束时间">
        <template #default="{ row }">
          {{ formatDateTime(row.end_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button type="info" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-popconfirm
            title="确定要删除这个活动吗？"
            @confirm="handleDelete(row.id)"
          >
            <template #reference>
              <el-button type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
          <el-button type="success" size="small" @click="handleReviewApplications(row)">审核申请</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑活动对话框 -->
    <el-dialog
      v-model="showActivityDialog"
      :title="isEdit ? '修改活动' : '创建活动'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form 
        :model="activityForm" 
        :rules="rules" 
        ref="activityFormRef" 
        label-width="100px"
        status-icon
      >
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="activityForm.name" placeholder="请输入活动名称" readonly />
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="activityForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            :shortcuts="dateShortcuts"
            :disabledDate="disabledDate"
          />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="activityForm.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="人数限制" prop="limit">
          <el-input-number v-model="activityForm.limit" :min="1" :max="1000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showActivityDialog = false">取消</el-button>
        <el-button type="primary" @click="submitActivityForm" :loading="submitting">
          {{ isEdit ? '保存修改' : '创建活动' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 审核申请对话框 -->
    <el-dialog
      v-model="showReviewDialog"
      title="审核申请"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="selectedActivity">
        <h3>{{ selectedActivity.name }} 的申请列表</h3>
        <el-table 
          :data="auditVolunteers" 
          style="width: 100%" 
          v-loading="loadingApplications"
          empty-text="暂无申请"
        >
          <el-table-column prop="nickname" label="申请人" />
          <el-table-column prop="apply_time" label="申请时间" v-if="hasApplyTime">
            <template #default="{ row }">
              {{ formatDateTime(row.apply_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="success" 
                size="small" 
                @click="handleApplicationAction(row, 'approve')"
                :disabled="row.status !== 0"
              >通过</el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleApplicationAction(row, 'reject')"
                :disabled="row.status !== 0"
              >拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container" v-if="auditVolunteers.length > 0">
          <el-pagination
            layout="prev, pager, next"
            :total="totalApplications"
            :page-size="pageSize"
            :current-page="currentPage"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask,
  getTaskAuditDetail,
  approveVolunteer,
  rejectVolunteer
} from '../api/task'

// 数据和状态
const tasks = ref([])
const loading = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)

// 对话框控制
const showActivityDialog = ref(false)
const showReviewDialog = ref(false)
const activityFormRef = ref(null)

// 表单数据
const activityForm = reactive({
  name: '',
  timeRange: [],
  location: '',
  limit: 1
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
  limit: [
    { required: true, message: '请输入人数限制', trigger: 'change' },
    { type: 'number', min: 1, message: '人数限制至少为1人', trigger: 'change' }
  ]
}

// 申请审核相关
const selectedActivity = ref(null)
const auditVolunteers = ref([])
const loadingApplications = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalApplications = ref(0)

// 检查是否有申请时间字段
const hasApplyTime = computed(() => {
  return auditVolunteers.value.length > 0 && 'apply_time' in auditVolunteers.value[0]
})

// 日期配置
const dateShortcuts = [
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
]

// 日期禁用判断（禁用过去的日期）
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用昨天及之前的日期
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 将Date对象转换为字符串
const formatDateToString = (date) => {
  if (!date) return null
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  if (status === 0) return '待审核'
  if (status === 1) return '已通过'
  if (status === 2) return '已拒绝'
  return '未知状态'
}

// 创建活动按钮点击处理
const handleCreateClick = () => {
  isEdit.value = false
  currentEditId.value = null
  resetActivityForm()
  showActivityDialog.value = true
}

// 重置活动表单
const resetActivityForm = () => {
  activityForm.name = ''
  activityForm.timeRange = []
  activityForm.location = ''
  activityForm.limit = 1
  if (activityFormRef.value) {
    activityFormRef.value.resetFields()
  }
}

// 获取活动列表
const fetchTasks = async () => {
  loading.value = true
  try {
    const response = await getTasks()
    if (response?.data?.data?.tasks) {
      tasks.value = response.data.data.tasks
    }
  } catch (error) {
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

// 提交活动表单（创建或编辑）
const submitActivityForm = async () => {
  if (!activityFormRef.value) return

  try {
    await activityFormRef.value.validate()
    
    // 确保时间范围存在且合法
    if (!activityForm.timeRange || activityForm.timeRange.length !== 2) {
      ElMessage.error('请选择完整的活动时间范围')
      return
    }

    submitting.value = true

    // 将时间对象转换为格式化的字符串
    let startTime, endTime
    
    if (Array.isArray(activityForm.timeRange) && activityForm.timeRange.length === 2) {
      startTime = activityForm.timeRange[0] instanceof Date 
        ? formatDateToString(activityForm.timeRange[0])
        : activityForm.timeRange[0]
      
      endTime = activityForm.timeRange[1] instanceof Date
        ? formatDateToString(activityForm.timeRange[1])
        : activityForm.timeRange[1]
    }

    // 验证开始时间必须早于结束时间
    if (new Date(startTime) >= new Date(endTime)) {
      ElMessage.error('开始时间必须早于结束时间')
      submitting.value = false
      return
    }

    const taskData = {
      name: activityForm.name,
      startTime,
      endTime,
      location: activityForm.location,
      limit: activityForm.limit
    }

    if (isEdit.value && currentEditId.value) {
      // 编辑现有活动
      taskData.id = currentEditId.value
      await updateTask(taskData)
      ElMessage.success('活动更新成功')
    } else {
      // 创建新活动
      await createTask(taskData)
      ElMessage.success('活动创建成功')
    }

    showActivityDialog.value = false
    resetActivityForm()
    fetchTasks()
  } catch (error) {
    console.error('Error submitting form:', error)
    ElMessage.error(error.response?.data?.message || '操作失败：' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 编辑活动
const handleEdit = (task) => {
  isEdit.value = true
  currentEditId.value = task.id
  
  // 填充表单数据
  activityForm.name = task.name
  activityForm.location = task.location
  activityForm.limit = task.limit || 1
  
  // 处理时间格式
  if (task.start_time && task.end_time) {
    try {
      // 将字符串转换为日期对象
      const startDate = new Date(task.start_time)
      const endDate = new Date(task.end_time)
      
      // 确保日期是有效的
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        activityForm.timeRange = [startDate, endDate]
      } else {
        ElMessage.warning('活动时间格式有误，请重新设置')
        activityForm.timeRange = []
      }
    } catch (err) {
      console.error('Error parsing dates:', err)
      ElMessage.warning('活动时间解析错误，请重新设置')
      activityForm.timeRange = []
    }
  } else {
    activityForm.timeRange = []
  }
  
  showActivityDialog.value = true
}

// 删除活动
const handleDelete = async (id) => {
  loading.value = true
  try {
    await deleteTask(id)
    ElMessage.success('活动删除成功')
    fetchTasks()
  } catch (error) {
    ElMessage.error('删除活动失败')
  } finally {
    loading.value = false
  }
}

// 获取待审核人员名单
const fetchAuditVolunteers = async (taskId) => {
  if (!taskId) {
    return
  }
  
  try {
    const response = await getTaskAuditDetail({ TaskId: taskId })
    
    if (response?.data?.data?.taskDetails?.volunteers) {
      auditVolunteers.value = response.data.data.taskDetails.volunteers
      totalApplications.value = auditVolunteers.value.length || 0
    } else {
      auditVolunteers.value = []
      totalApplications.value = 0
    }
  } catch (error) {
    auditVolunteers.value = []
    totalApplications.value = 0
  }
}

// 审核申请
const handleReviewApplications = async (activity) => {
  if (!activity || !activity.id) {
    ElMessage.warning('无效的活动信息')
    return
  }

  // 先设置选中的活动
  selectedActivity.value = activity
  // 先显示弹窗，避免加载时间过长导致用户体验不佳
  showReviewDialog.value = true
  
  // 重置页面为第一页
  currentPage.value = 1
  
  // 开始加载数据
  loadingApplications.value = true
  
  try {
    // 获取审核数据
    await fetchAuditVolunteers(activity.id)
  } catch (error) {
    ElMessage.error('加载审核数据失败')
  } finally {
    loadingApplications.value = false
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  if (!selectedActivity.value || !selectedActivity.value.id) {
    ElMessage.warning('活动信息丢失，请重新选择活动')
    return
  }
  
  currentPage.value = page
  fetchAuditVolunteers(selectedActivity.value.id)
}

// 处理申请操作（通过/拒绝）
const handleApplicationAction = async (application, action) => {
  const actionText = action === 'approve' ? '通过' : '拒绝'
  const confirmMessage = `确定要${actionText}此申请吗？`
  
  try {
    await ElMessageBox.confirm(confirmMessage, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    loadingApplications.value = true
    
    // 调用相应的 API 接口
    if (action === 'approve') {
      await approveVolunteer({ TaskId: selectedActivity.value.id, email: application.email })
    } else {
      await rejectVolunteer({ TaskId: selectedActivity.value.id, email: application.email })
    }
    
    // 更新本地状态
    const index = auditVolunteers.value.findIndex(v => v.email === application.email)
    if (index !== -1) {
      auditVolunteers.value[index].status = action === 'approve' ? 1 : 2 // 更新状态
    }
    
    ElMessage.success(`申请已${actionText}`)
    // 如果需要，可以重新获取最新数据
    // await fetchAuditVolunteers(selectedActivity.value.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`Error ${action}ing application:`, error)
      ElMessage.error(`${actionText}申请失败：` + (error.message || '未知错误'))
    }
  } finally {
    loadingApplications.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.activity-management-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>