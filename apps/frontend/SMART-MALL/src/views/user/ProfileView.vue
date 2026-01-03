<script setup lang="ts">
/**
 * 个人中心页面
 * 用户信息查看和编辑
 */
import { ref, computed, onMounted } from 'vue'
import { Modal } from '@/components'
import { useUserStore } from '@/stores'
import { userApi, passwordApi } from '@/api'
import type { UserProfile, UpdateProfileRequest } from '@/api/user.api'

const userStore = useUserStore()

// ============================================================================
// State
// ============================================================================

const isLoading = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const profile = ref<UserProfile | null>(null)
const editForm = ref<UpdateProfileRequest>({
  email: '',
  phone: '',
})

// 修改密码弹窗
const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref<string | null>(null)
const isChangingPassword = ref(false)

// ============================================================================
// Computed
// ============================================================================

const roleDisplayName = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: '管理员',
    MERCHANT: '商家',
    USER: '用户',
  }
  return roleMap[profile.value?.role || ''] || '用户'
})

const statusDisplayName = computed(() => {
  const statusMap: Record<string, string> = {
    ACTIVE: '正常',
    INACTIVE: '未激活',
    BANNED: '已禁用',
  }
  return statusMap[profile.value?.status || ''] || '未知'
})

const avatarLetter = computed(() => {
  return profile.value?.username?.charAt(0).toUpperCase() || 'U'
})

const isPasswordFormValid = computed(() => {
  return (
    passwordForm.value.currentPassword.length >= 6 &&
    passwordForm.value.newPassword.length >= 6 &&
    passwordForm.value.newPassword === passwordForm.value.confirmPassword
  )
})

// ============================================================================
// Methods
// ============================================================================

async function loadProfile() {
  isLoading.value = true
  error.value = null
  
  try {
    // 使用 store 中的数据作为基础
    profile.value = {
      id: userStore.currentUser?.id || 0,
      username: userStore.currentUser?.username || '',
      email: userStore.currentUser?.email || '',
      phone: userStore.currentUser?.phone || '',
      avatar: undefined,
      role: userStore.role || 'USER',
      status: userStore.currentUser?.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    }
    
    editForm.value = {
      email: profile.value.email,
      phone: profile.value.phone,
    }
  } catch (e: any) {
    error.value = e.message || '加载用户信息失败'
  } finally {
    isLoading.value = false
  }
}

function startEditing() {
  editForm.value = {
    email: profile.value?.email || '',
    phone: profile.value?.phone || '',
  }
  isEditing.value = true
  error.value = null
  successMessage.value = null
}

function cancelEditing() {
  isEditing.value = false
  error.value = null
}

async function saveProfile() {
  if (!profile.value) return
  
  isSaving.value = true
  error.value = null
  successMessage.value = null
  
  try {
    const updated = await userApi.updateProfile(editForm.value)
    profile.value = updated
    isEditing.value = false
    successMessage.value = '保存成功'
    
    // 3秒后清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (e: any) {
    error.value = e.message || '保存失败'
  } finally {
    isSaving.value = false
  }
}

function openPasswordModal() {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  passwordError.value = null
  showPasswordModal.value = true
}

async function changePassword() {
  if (!isPasswordFormValid.value) return
  
  isChangingPassword.value = true
  passwordError.value = null
  
  try {
    await passwordApi.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    )
    showPasswordModal.value = false
    successMessage.value = '密码修改成功'
    
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (e: any) {
    passwordError.value = e.message || '密码修改失败'
  } finally {
    isChangingPassword.value = false
  }
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-page">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ error }}
      </div>

      <!-- 成功提示 -->
      <div v-if="successMessage" class="success-message">
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ successMessage }}
      </div>

      <!-- 用户信息卡片 -->
      <div v-if="profile && !isLoading" class="profile-card">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar">{{ avatarLetter }}</div>
          <div class="user-basic">
            <h2 class="username">{{ profile.username }}</h2>
            <span class="role-badge">{{ roleDisplayName }}</span>
          </div>
        </div>

        <!-- 信息区域 -->
        <div class="info-section">
          <div class="info-grid">
            <!-- 邮箱 -->
            <div class="info-item">
              <label>邮箱</label>
              <template v-if="isEditing">
                <input
                  v-model="editForm.email"
                  type="email"
                  class="input"
                  placeholder="请输入邮箱"
                />
              </template>
              <template v-else>
                <span class="info-value">{{ profile.email || '未设置' }}</span>
              </template>
            </div>

            <!-- 手机号 -->
            <div class="info-item">
              <label>手机号</label>
              <template v-if="isEditing">
                <input
                  v-model="editForm.phone"
                  type="tel"
                  class="input"
                  placeholder="请输入手机号"
                />
              </template>
              <template v-else>
                <span class="info-value">{{ profile.phone || '未设置' }}</span>
              </template>
            </div>

            <!-- 角色 -->
            <div class="info-item">
              <label>角色</label>
              <span class="info-value">{{ roleDisplayName }}</span>
            </div>

            <!-- 状态 -->
            <div class="info-item">
              <label>状态</label>
              <span class="info-value status-active">{{ statusDisplayName }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <template v-if="isEditing">
            <button class="btn btn-secondary" @click="cancelEditing" :disabled="isSaving">
              取消
            </button>
            <button class="btn btn-primary" @click="saveProfile" :disabled="isSaving">
              <span v-if="isSaving" class="btn-spinner"></span>
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </template>
          <template v-else>
            <button class="btn btn-secondary" @click="openPasswordModal">
              修改密码
            </button>
            <button class="btn btn-primary" @click="startEditing">
              编辑资料
            </button>
          </template>
        </div>
      </div>

      <!-- 修改密码弹窗 -->
      <Modal
        v-model:visible="showPasswordModal"
        title="修改密码"
        width="400px"
      >
        <div class="password-form">
          <div v-if="passwordError" class="error-message small">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 4.5v4M8 10.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ passwordError }}
          </div>

          <div class="form-item">
            <label>当前密码</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="input"
              placeholder="请输入当前密码"
            />
          </div>

          <div class="form-item">
            <label>新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="input"
              placeholder="请输入新密码（至少6位）"
            />
          </div>

          <div class="form-item">
            <label>确认新密码</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="input"
              placeholder="请再次输入新密码"
            />
            <span
              v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
              class="field-error"
            >
              两次密码不一致
            </span>
          </div>
        </div>

        <template #footer>
          <button class="btn btn-secondary" @click="showPasswordModal = false">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="!isPasswordFormValid || isChangingPassword"
            @click="changePassword"
          >
            <span v-if="isChangingPassword" class="btn-spinner"></span>
            {{ isChangingPassword ? '修改中...' : '确认修改' }}
          </button>
        </template>
      </Modal>
  </div>
</template>


<style scoped>
.profile-page {
  max-width: 800px;
}

/* Loading & Messages */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9aa0a6;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #8ab4f8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message,
.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 14px;
}

.error-message {
  background: rgba(242, 139, 130, 0.1);
  color: #f28b82;
  border: 1px solid rgba(242, 139, 130, 0.2);
}

.error-message.small {
  margin-bottom: 16px;
}

.success-message {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.2);
}

/* Profile Card */
.profile-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px;
  position: relative;
  overflow: hidden;
}

.avatar-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 20%, rgba(168, 85, 247, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

.avatar {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  border-radius: 20px;
  font-size: 32px;
  font-weight: 600;
  color: #fff;
}

.user-basic {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username {
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  color: #e8eaed;
  letter-spacing: -0.02em;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(138, 180, 248, 0.15);
  color: #8ab4f8;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
}

/* Info Section */
.info-section {
  padding: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.info-value {
  font-size: 15px;
  color: #e8eaed;
}

.status-active {
  color: #34d399;
}

.input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 14px 16px;
  font-size: 14px;
  color: #e8eaed;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #8ab4f8;
  background: rgba(138, 180, 248, 0.05);
  box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.1);
}

.input::placeholder {
  color: #5f6368;
}

/* Action Section */
.action-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #60a5fa 0%, #818cf8 100%);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(96, 165, 250, 0.3);
}

.btn-secondary {
  background: transparent;
  color: #9aa0a6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
  color: #e8eaed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Password Form */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 13px;
  color: #9aa0a6;
}

.field-error {
  font-size: 12px;
  color: #f28b82;
}

/* Responsive */
@media (max-width: 600px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-section {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
