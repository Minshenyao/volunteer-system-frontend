<template>
  <div class="login-container">
    <el-card class="login-card" :body-style="{ padding: 0 }">
      <div class="card-content">
        <div class="left-panel">
          <div class="brand">
            <img src="../assets/volunteer-logo.svg" alt="Logo" class="logo" />
            <h2 class="brand-name">志愿者平台</h2>
          </div>
          <div class="welcome-text">
            <h1 class="welcome-title">欢迎回来</h1>
            <p class="welcome-message">登录以继续您的志愿者旅程</p>
          </div>
          <div class="decoration"></div>
        </div>
        
        <div class="form-panel">
          <h2 class="form-title">使用您的账号登录</h2>
          
          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            class="login-form"
            label-position="top"
            status-icon
          >
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="loginForm.email"
                placeholder="请输入邮箱"
                size="default"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                size="default"
              >
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            
            <div class="remember-forgot">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <a href="#" class="forgot-link">忘记密码？</a>
            </div>

            <el-form-item>
              <el-button
                type="primary"
                class="submit-button"
                :loading="loading"
                @click="handleLogin"
                round
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="form-footer">
            <span>还没有账号？</span>
            <router-link to="/register" class="register-link">立即注册</router-link>
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
import { Message, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        // 调整登录接口参数，使用email替代username
        const res = await userStore.login({
          email: loginForm.email, // 后端可能仍使用username作为参数名
          password: loginForm.password,
        })
        if (res.status === 'success') {
          ElMessage({
            message: '登录成功！',
            type: 'success',
            duration: 2000
          })
          router.push('/')
        }
      } catch (error) {
        ElMessage({
          message: error.message || '登录失败，请检查邮箱和密码',
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
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  padding: 30px 15px;
  
  .login-card {
    width: 100%;
    max-width: 1000px;
    border: none;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    
    .card-content {
      display: flex;
      min-height: 500px;
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
      
      .login-form {
        .remember-forgot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          
          .forgot-link {
            color: #1e88e5;
            text-decoration: none;
            font-size: 14px;
            
            &:hover {
              text-decoration: underline;
            }
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
          margin-top: 8px;
          
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
        
        .register-link {
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
  .login-container {
    .login-card {
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