<template>
  <div class="forgot-password-container">
    <el-card class="forgot-password-card" :body-style="{ padding: 0 }">
      <div class="card-content">
        <div class="left-panel">
          <div class="brand">
            <img src="../assets/volunteer-logo.svg" alt="Logo" class="logo" />
            <h2 class="brand-name">志愿者平台</h2>
          </div>
          <div class="welcome-text">
            <h1 class="welcome-title">找回密码</h1>
            <p class="welcome-message">重置您的密码，继续您的志愿者旅程</p>
          </div>
          <div class="decoration"></div>
        </div>
        
        <div class="form-panel">
          <h2 class="form-title">密码重置</h2>
          <p class="form-subtitle">请输入您的注册邮箱，我们将发送重置链接到您的邮箱</p>
          
          <el-form
            ref="formRef"
            :model="resetForm"
            :rules="rules"
            class="reset-form"
            label-position="top"
            status-icon
          >
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="resetForm.email"
                placeholder="请输入您的注册邮箱"
                size="default"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <div v-if="step === 'verify'">
              <el-form-item label="验证码" prop="verificationCode">
                <div class="verification-input">
                  <el-input
                    v-model="resetForm.verificationCode"
                    placeholder="请输入验证码"
                    size="default"
                  >
                    <template #prefix>
                      <el-icon><Key /></el-icon>
                    </template>
                  </el-input>
                  <el-button 
                    type="default" 
                    class="send-code-button" 
                    :disabled="countdown > 0"
                    @click="sendVerificationCode"
                  >
                    {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>
            </div>

            <div v-if="step === 'reset'">
              <el-form-item label="新密码" prop="newPassword">
                <el-input
                  v-model="resetForm.newPassword"
                  type="password"
                  placeholder="请设置新密码"
                  show-password
                  size="default"
                >
                  <template #prefix>
                    <el-icon><Lock /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input
                  v-model="resetForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入新密码"
                  show-password
                  size="default"
                >
                  <template #prefix>
                    <el-icon><CircleCheck /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                class="submit-button"
                :loading="loading"
                @click="handleAction"
                round
              >
                {{ buttonText }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>已记起密码？</span>
            <router-link to="/login" class="login-link">返回登录</router-link>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Lock, Key, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const step = ref('email') // 步骤：email -> verify -> reset -> success
const countdown = ref(0)

const resetForm = reactive({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
})

const buttonText = computed(() => {
  switch (step.value) {
    case 'email':
      return '发送验证码'
    case 'verify':
      return '验证并重置'
    case 'reset':
      return '重置密码'
    default:
      return '确认'
  }
})

const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (value === '') {
    callback(new Error('请输入邮箱'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

const validateNewPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else if (value.length < 8) {
    callback(new Error('密码长度不能少于8个字符'))
  } else {
    if (resetForm.confirmPassword !== '') {
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== resetForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, validator: validateEmail, trigger: 'blur' }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码长度应为6位', trigger: 'blur' }
  ],
  newPassword: [
    { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!resetForm.email) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }
  
  try {
    loading.value = true
    // 模拟发送验证码的API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 成功发送后，开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    step.value = 'verify'
    ElMessage.success('验证码已发送至您的邮箱，请查收')
  } catch (error) {
    ElMessage.error(error.message || '发送验证码失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 处理表单操作
const handleAction = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      
      switch (step.value) {
        case 'email':
          await sendVerificationCode()
          break
          
        case 'verify':
          // 模拟验证码验证
          await new Promise(resolve => setTimeout(resolve, 1000))
          step.value = 'reset'
          break
          
        case 'reset':
          // 模拟重置密码API请求
          await new Promise(resolve => setTimeout(resolve, 1500))
          ElMessage({
            message: '密码重置成功！请使用新密码登录。',
            type: 'success',
            duration: 3000
          })
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          break
      }
    } catch (error) {
      ElMessage.error(error.message || '操作失败，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 30px 15px;
  
  .forgot-password-card {
    width: 100%;
    max-width: 1000px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    
    .card-content {
      display: flex;
      min-height: 550px;
    }
    
    .left-panel {
      flex: 1;
      background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 40px;
        position: relative;
        z-index: 2;
        
        .logo {
          width: 50px;
          height: 50px;
          filter: brightness(0) invert(1);
        }
        
        .brand-name {
          color: white;
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
      }
      
      .welcome-text {
        position: relative;
        z-index: 2;
        
        .welcome-title {
          color: white;
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 16px;
          letter-spacing: -0.5px;
        }
        
        .welcome-message {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          line-height: 1.5;
          margin: 0;
        }
      }
      
      .decoration {
        position: absolute;
        bottom: -100px;
        right: -100px;
        width: 300px;
        height: 300px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        z-index: 1;
        
        &:before {
          content: '';
          position: absolute;
          top: -50px;
          left: -50px;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
      }
    }
    
    .form-panel {
      flex: 1.2;
      padding: 48px;
      background: white;
      
      .form-title {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px;
      }
      
      .form-subtitle {
        font-size: 14px;
        color: #606266;
        margin: 0 0 32px;
        line-height: 1.5;
      }
      
      .reset-form {
        .verification-input {
          display: flex;
          gap: 12px;
          
          .el-input {
            flex: 1;
          }
          
          .send-code-button {
            white-space: nowrap;
            border-radius: 8px;
            min-width: 110px;
          }
        }
        
        :deep(.el-form-item__label) {
          font-weight: 500;
          color: #606266;
        }
        
        :deep(.el-input__wrapper),
        :deep(.el-select .el-input__wrapper) {
          box-shadow: 0 0 0 1px #dcdfe6 inset;
          transition: all 0.2s;
          border-radius: 8px;
          
          &:hover {
            box-shadow: 0 0 0 1px #c0c4cc inset;
          }
          
          &.is-focus {
            box-shadow: 0 0 0 1px #409eff inset !important;
          }
        }
        
        :deep(.el-input__prefix) {
          color: #909399;
          margin-right: 4px;
        }
        
        .submit-button {
          width: 100%;
          height: 44px;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0.5px;
          background: linear-gradient(90deg, #1e88e5 0%, #1976d2 100%);
          border: none;
          transition: all 0.3s;
          margin-top: 16px;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
          }
          
          &:active {
            transform: translateY(0);
          }
        }
      }
      
      .form-footer {
        text-align: center;
        margin-top: 24px;
        color: #606266;
        
        .login-link {
          color: #1e88e5;
          text-decoration: none;
          font-weight: 500;
          margin-left: 4px;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .forgot-password-container {
    .forgot-password-card {
      .card-content {
        flex-direction: column;
      }
      
      .left-panel {
        padding: 30px;
        min-height: 200px;
        
        .welcome-title {
          font-size: 32px;
        }
      }
      
      .form-panel {
        padding: 30px;
        
        .verification-input {
          flex-direction: column;
          
          .send-code-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>