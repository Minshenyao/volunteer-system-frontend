<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside-container">
      <div class="logo-container">
        <img src="../assets/volunteer-logo.svg" alt="Logo" class="logo" />
        <h1 class="title" v-show="!isCollapse">志愿者平台</h1>
      </div>

      <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          :router="true"
          :collapse="isCollapse"
          :collapse-transition="false"
      >
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><List /></el-icon>
          <template #title>志愿活动</template>
        </el-menu-item>
        <!-- 仅当不是管理员时显示这些菜单 -->
        <template v-if="userStore.userInfo.isAdmin">
          <el-menu-item index="/volunteers">
            <el-icon><UserFilled /></el-icon>
            <template #title>志愿者管理</template>
          </el-menu-item>
          <el-menu-item index="/activity-management">
            <el-icon><Management /></el-icon>
            <template #title>志愿活动管理</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header-container">
        <div class="header-left">
          <el-button 
            class="collapse-btn"
            type="text"
            @click="toggleSidebar"
          >
            <el-icon :size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>
        </div>
        <div class="header-right">
          <el-switch
            v-model="isDark"
            @change="toggleTheme"
            :active-icon="Moon"
            :inactive-icon="Sunny"
            inline-prompt
          />
          <el-badge :value="unreadMessages" class="message-icon" @click="showMessages">
            <el-icon><Message /></el-icon>
          </el-badge>
          <el-dropdown>
            <el-avatar :src="userStore.avatar" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="showProfileDialog = true">
                  <el-icon><Edit /></el-icon>
                  修改资料
                </el-dropdown-item>
                <el-dropdown-item @click="showPasswordDialog = true">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改资料对话框 -->
  <el-dialog
    v-model="showProfileDialog"
    title="个人资料"
    width="600px"
    class="profile-dialog"
  >
    <div class="profile-container">
      <div class="profile-header">
        <div class="avatar-section">
          <el-avatar :size="80" :src="userStore.userInfo.avatar" />
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleAvatarChange"
          >
            <el-button size="small" type="primary" text>更换头像</el-button>
          </el-upload>
        </div>
        <div class="user-info">
          <h3>{{ userStore.userInfo.email }}</h3>
          <p class="status">
            <el-tag :type="userStore.userInfo.status === '下线' ? 'info' : 'success'" size="small">
              {{ userStore.userInfo.status || '离线' }}
            </el-tag>
          </p>
        </div>
      </div>

      <el-divider />

      <div class="profile-content">
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100px"
        >
          <el-form-item label="姓名" prop="nickName">
            <el-input 
              v-model="profileForm.nickName"
              placeholder="请输入姓名"
              :modelValue="userStore.userInfo.nickName"
            />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select 
              v-model="profileForm.gender" 
              placeholder="请选择性别" 
              style="width: 100%"
              :modelValue="userStore.userInfo.gender"
            >
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
              <el-option label="保密" value="保密" />
            </el-select>
          </el-form-item>
          <el-form-item label="联系方式" prop="phone">
            <el-input 
              v-model="profileForm.phone"
              placeholder="请输入联系方式"
              :modelValue="userStore.userInfo.phone"
            />
          </el-form-item>
        </el-form>

        <el-divider />

        <div class="stats-section">
          <div class="stat-item">
            <div class="stat-value">{{ userStore.userInfo.duration || 0 }}</div>
            <div class="stat-label">志愿时长（小时）</div>
          </div>
          <el-divider direction="vertical" />
          <div class="stat-item">
            <div class="stat-value">
              {{ new Date(userStore.userInfo.lastActivity).toLocaleDateString() }}
            </div>
            <div class="stat-label">最近活动</div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showProfileDialog = false">取消</el-button>
      <el-button type="primary" @click="handleUpdateProfile" :loading="updating">
        保存修改
      </el-button>
    </template>
  </el-dialog>

  <!-- 修改密码对话框 -->
  <el-dialog
    v-model="showPasswordDialog"
    title="修改密码"
    width="500px"
  >
    <el-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      label-width="100px"
    >
      <el-form-item label="当前密码" prop="currentPassword">
        <el-input
          v-model="passwordForm.currentPassword"
          type="password"
          show-password
          placeholder="请输入当前密码"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showPasswordDialog = false">取消</el-button>
      <el-button type="primary" @click="handleUpdatePassword" :loading="updating">
        确认
      </el-button>
    </template>
  </el-dialog>

  <!-- 消息对话框 -->
  <el-dialog
    v-model="showMessagesDialog"
    title="消息通知"
    width="500px"
    class="message-dialog"
  >
    <div class="message-list">
      <div v-if="!messages || messages.length === 0" class="no-messages">
        暂无消息
      </div>
      <div v-else v-for="message in messages" :key="message.id" class="message-item">
        <div class="message-content">
          <el-icon :class="['message-icon', { unread: message.status === 'unread' }]">
            <InfoFilled v-if="message.status === 'unread'" />
            <SuccessFilled v-else />
          </el-icon>
          <div class="message-text">
            <div class="message-title">{{ message.title }}</div>
            <div class="message-desc">{{ message.content }}</div>
            <div class="message-time">{{ message.time }}</div>
          </div>
          <el-button 
            v-if="message.status === 'unread'"
            type="primary" 
            link 
            @click="markAsRead(message.id)"
          >
            标记已读
          </el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button 
        @click="handleReadAll" 
        type="primary" 
        plain
        :disabled="!messages.some(msg => msg.status === 'unread')"
      >
        全部已读
      </el-button>
      <el-button @click="showMessagesDialog = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { 
  DataBoard, List, User, Fold, Expand, 
  Moon, Sunny, Edit, Lock, SwitchButton, Male, Phone, UserFilled, Message, InfoFilled, SuccessFilled 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getMessages, markMessageAsRead } from '../api/message'

const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)
const isDark = ref(document.documentElement.classList.contains('dark'))

const activeMenu = computed(() => router.currentRoute.value.path)

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const toggleTheme = (value) => {
  if (value) {
    document.documentElement.classList.add('dark')
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.body.removeAttribute('arco-theme')
  }
}

const logout = () => {
  userStore.logout()
  router.push('/login')
}

// 对话框显示状态
const showProfileDialog = ref(false)
const showPasswordDialog = ref(false)
const updating = ref(false)

// 表单相关
const passwordFormRef = ref(null)
const profileFormRef = ref(null)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileForm = ref({
  nickName: '',
  gender: '',
  phone: ''
})

// 表单校验规则
const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ]
}

const profileRules = {
  nickName: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  contactInfo: [
    { required: true, message: '请输入联系方式', trigger: 'blur' }
  ]
}

// 处理修改密码
const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        updating.value = true
        await userStore.updatePassword(passwordForm.value)
        showPasswordDialog.value = false
        passwordForm.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        ElMessage.success('密码修改成功')
      } catch (error) {
        console.error('修改密码失败:', error)
      } finally {
        updating.value = false
      }
    }
  })
}

// 处理修改个人资料
const handleUpdateProfile = async () => {
  try {
    updating.value = true; // 请求开始时设置为 true
    const response = await userStore.updateProfile(profileForm.value);
    showProfileDialog.value = false; // 关闭对话框
    ElMessage.success('个人资料修改成功');
  } catch (error) {
    console.error('修改个人资料失败:', error);
    ElMessage.error('修改个人资料失败，请重试');
  } finally {
    updating.value = false; // 请求完成后设置为 false
  }
}

// 监听对话框显示状态，打开时初始化表单数据
watch(showProfileDialog, (val) => {
  if (val) {
    const { nickName, gender, phone } = userStore.userInfo
    profileForm.value = {
      nickName: nickName || '',
      gender: gender || '',
      phone: phone || ''
    }
  }
})

// 在组件挂载时获取用户信息
onMounted(async () => {
  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    toggleTheme(prefersDark)

    // 获取用户信息
    await userStore.getUserInfo()
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

// 监听路由变化，确保用户信息是最新的
watch(
  () => router.currentRoute.value.path,
  async () => {
    try {
      await userStore.getUserInfo()
      await fetchMessages()
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }
)

const handleAvatarChange = async (file) => {
  try {
    updating.value = true
    await userStore.updateAvatar(file.raw)
    // 更新头像后自动刷新用户信息
    await userStore.getUserInfo()
  } catch (error) {
    console.error('上传头像失败:', error)
  } finally {
    updating.value = false
  }
}

const messages = ref([])
const unreadMessages = ref(0)
const showMessagesDialog = ref(false)

// 获取消息列表
const fetchMessages = async () => {
  try {
    await userStore.getUserInfo()
    const response = await getMessages(userStore.userInfo.volunteerID)
    
    if (response?.data) {
      messages.value = response.data
      // 计算未读消息数量，根据 status 字段判断
      unreadMessages.value = messages.value.filter(msg => msg.status === 'unread').length
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    ElMessage.error('获取消息列表失败')
  }
}

// 标记消息为已读
const markAsRead = async (messageId) => {
  try {
    await markMessageAsRead(messageId)
    // 更新本地消息状态
    const message = messages.value.find(msg => msg.id === messageId)
    if (message) {
      message.status = 'read'
      unreadMessages.value = messages.value.filter(msg => msg.status === 'unread').length
    }
  } catch (error) {
    ElMessage.error('标记消息已读失败')
  }
}

// 全部标记为已读
const handleReadAll = async () => {
  try {
    await Promise.all(
      messages.value
        .filter(msg => msg.status === 'unread')
        .map(msg => markAsRead(msg.id))
    )
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 显示消息对话框
const showMessages = async () => {
  showMessagesDialog.value = true
  await fetchMessages()
}

// 在组件挂载时获取消息列表
onMounted(async () => {
  await fetchMessages()
})

// 添加消息的方法
const addMessage = async (title, content) => {
  try {
    
    await createMessage({
      userID: userStore.userInfo.volunteerID,
      title,
      content
    })
    
    // 刷新消息列表
    await fetchMessages()
  } catch (error) {
    console.error('创建消息失败:', error)
  }
}

// 暴露方法给其他组件使用
defineExpose({
  addMessage,
  fetchMessages
})
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  
  .aside-container {
    background-color: var(--bg-color-secondary);
    border-right: 1px solid var(--border-color);
    transition: width 0.3s;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    .logo-container {
      height: 60px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
      border-bottom: 1px solid var(--border-color);
      
      .logo {
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }
      
      .title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .sidebar-menu {
      flex: 1;
      border-right: none;
      background-color: var(--bg-color-secondary);
      
      :deep(.el-menu-item) {
        &.is-active {
          background-color: var(--primary-color-light);
          color: var(--primary-color);
        }
        
        &:hover {
          background-color: var(--hover-color);
        }
      }
    }
  }
  
  .header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
    padding: 0 20px;
    
    .header-left {
      .collapse-btn {
        padding: 0;
        color: var(--text-regular);
        
        &:hover {
          color: var(--primary-color);
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .el-switch {
        --el-switch-on-color: var(--primary-color);
      }
      
      .el-avatar {
        cursor: pointer;
        border: 2px solid transparent;
        
        &:hover {
          border-color: var(--primary-color);
        }
      }
    }
  }
  
  .el-main {
    background-color: var(--bg-color);
    padding: 20px;
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-icon {
    margin-right: 5px;
  }
}

.el-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 40px;
  }
}

.profile-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
  
  .profile-container {
    .profile-header {
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
      background-color: var(--bg-color-secondary);
      
      .avatar-section {
        text-align: center;
        
        .avatar-uploader {
          margin-top: 8px;
        }
      }
      
      .user-info {
        h3 {
          margin: 0 0 8px;
          font-size: 20px;
          color: var(--text-primary);
        }
        
        .status {
          margin: 0;
        }
      }
    }
    
    .profile-content {
      padding: 24px;
      
      .info-section {
        .info-item {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          
          .label {
            width: 100px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
            
            .el-icon {
              font-size: 16px;
            }
          }
          
          .value {
            flex: 1;
            color: var(--text-primary);
          }
        }
      }
      
      .stats-section {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 16px 0;
        
        .stat-item {
          text-align: center;
          
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-color);
            margin-bottom: 8px;
          }
          
          .stat-label {
            color: var(--text-secondary);
            font-size: 14px;
          }
        }
      }
    }
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;

  .message-icon {
    cursor: pointer;
    color: var(--text-regular);
    
    &:hover {
      color: var(--primary-color);
    }
  }
}

.message-dialog {
  .message-list {
    max-height: 400px;
    overflow-y: auto;

    .no-messages {
      text-align: center;
      color: var(--text-secondary);
      padding: 40px 0;
    }

    .message-item {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .message-content {
        display: flex;
        gap: 12px;

        .message-icon {
          font-size: 20px;
          color: var(--text-secondary);

          &.unread {
            color: var(--primary-color);
          }
        }

        .message-text {
          flex: 1;

          .message-title {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .message-desc {
            color: var(--text-regular);
            margin-bottom: 4px;
          }

          .message-time {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
    }
  }
}
</style> 