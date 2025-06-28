<template>
  <div class="register-container">
    <el-card class="register-card" :body-style="{ padding: 0 }">
      <div class="card-content">
        <div class="left-panel">
          <div class="brand">
            <img src="../assets/volunteer-logo.svg" alt="Logo" class="logo" />
            <h2 class="brand-name">志愿者平台</h2>
          </div>
          <div class="welcome-text">
            <h1 class="welcome-title">加入我们</h1>
            <p class="welcome-message">成为志愿者，让世界更美好</p>
          </div>
          <div class="decoration"></div>
        </div>
        
        <div class="form-panel">
          <h2 class="form-title">创建您的账号</h2>
          
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            class="register-form"
            label-position="top"
            status-icon
          >
            <el-form-item label="邮箱" prop="email">
              <el-input 
                v-model="form.email" 
                placeholder="请输入您的邮箱地址"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="昵称" prop="nickname">
              <el-input 
                v-model="form.nickname" 
                placeholder="请输入您的昵称"
              >
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="性别" prop="gender">
                  <el-select 
                    v-model="form.gender" 
                    placeholder="请选择"
                    class="w-full"
                  >
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                    <el-option label="保密" value="保密" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input 
                    v-model="form.phone" 
                    placeholder="请输入手机号"
                  >
                    <template #prefix>
                      <el-icon><Iphone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请设置您的密码"
                show-password
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password
              >
                <template #prefix>
                  <el-icon><CircleCheck /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item class="agreement">
              <el-checkbox v-model="form.agreement">
                我已阅读并同意 <a href="#" class="link">《用户协议》</a> 和 <a href="#" class="link">《隐私政策》</a>
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="submit-button"
                :loading="loading"
                @click="handleRegister"
                round
              >
                立即注册
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>已有账号？</span>
            <router-link to="/login" class="login-link">立即登录</router-link>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { Message, User, Lock, Iphone, CircleCheck } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  email: '',
  nickname: '',
  gender: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    callback(new Error('密码长度不能少于8个字符'))
  } else {
    if (form.confirmPassword !== '') {
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请阅读并同意用户协议和隐私政策'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应为2-20个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agreement: [
    { validator: validateAgreement, trigger: 'change' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!form.agreement) {
        ElMessage.warning('请先同意用户协议和隐私政策')
        return
      }
      
      try {
        loading.value = true
        await userStore.register(form)
        ElMessage({
          message: '注册成功！正在跳转到登录页面...',
          type: 'success',
          duration: 2000
        })
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } catch (error) {
        ElMessage({
          message: error.message || '注册失败，请稍后重试',
          type: 'error',
          duration: 3000
        })
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 30px 15px;
  
  .register-card {
    width: 100%;
    max-width: 1000px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    
    .card-content {
      display: flex;
      min-height: 600px;
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
        margin: 0 0 32px;
      }
      
      .register-form {
        .w-full {
          width: 100%;
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
        
        .agreement {
          margin-top: 8px;
          margin-bottom: 24px;
          
          :deep(.el-checkbox__label) {
            color: #606266;
            font-size: 14px;
          }
          
          .link {
            color: #1e88e5;
            text-decoration: none;
            
            &:hover {
              text-decoration: underline;
            }
          }
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
  .register-container {
    .register-card {
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
      }
    }
  }
}
</style>