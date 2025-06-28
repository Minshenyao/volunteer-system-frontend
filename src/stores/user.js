import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, register as registerApi } from '../api/auth'
import { getUserProfile, uploadAvatar, changePassword, changeProfile } from '../api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref({})
  const avatar = ref('')
  const updating = ref(false)

  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const { data } = await getUserProfile()
      if (data.status === 'success') {
        userInfo.value = data.data
        avatar.value = data.data.avatar
        return Promise.resolve(data)
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const login = async (credentials) => {
    try {
      const { data } = await loginApi(credentials)
      if (data.status === 'success') {
        token.value = data.data.token
        localStorage.setItem('token', data.data.token)
        ElMessage.success(data.message)
        // 登录成功后获取用户信息
        await getUserInfo()
        return Promise.resolve(data)
      } else {
        ElMessage.error(data.message || '登录失败')
        return Promise.reject(data)
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '登录失败')
      return Promise.reject(error)
    }
  }

  const register = async (userData) => {
    try {
      const { data } = await registerApi(userData)
      if (data.status === 'success') {
        ElMessage.success(data.message)
        return Promise.resolve(data)
      } else {
        ElMessage.error(data.message || '注册失败')
        return Promise.reject(data)
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '注册失败')
      return Promise.reject(error)
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = {}
    avatar.value = ''
    localStorage.removeItem('token')
  }

  // 上传头像
  const updateAvatar = async (file) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const { data } = await uploadAvatar(formData)
      if (data.status === 'success') {
        ElMessage.success(data.message)
        // 更新成功后重新获取用户信息
        await getUserInfo()
        return Promise.resolve(data)
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '上传失败')
      return Promise.reject(error)
    }
  }

  const updatePassword = async (passwordData) => {
    try {
      const { data } = await changePassword(passwordData)
      if (data.status === 'success') {
        ElMessage.success(data.message)
        return Promise.resolve(data)
      }
      ElMessage.error(data.message || '修改失败')
      return Promise.reject(data)
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '修改失败')
      return Promise.reject(error)
    } finally {
        updating.value = false;
    }
  }

  const updateProfile = async (profileData) => {
    if (updating.value) return; // 如果正在更新，则直接返回
    try {
      updating.value = true; // 请求开始时设置为 true
      const { data } = await changeProfile(profileData)
      if (data.status === 'success') {
        ElMessage.success(data.message);
        return Promise.resolve(data);
      } else {
        ElMessage.error(data.message || '更新失败');
        return Promise.reject(data);
      }
    } catch (error) {
      ElMessage.error(error.response?.data?.message || '更新资料失败，请重试');
      return Promise.reject(error);
    } finally {
        updating.value = false;
    }
  } 

  return {
    token,
    userInfo,
    avatar,
    login,
    register,
    logout,
    getUserInfo,
    updateAvatar,
    updatePassword,
    updateProfile,
    updating
  }
})