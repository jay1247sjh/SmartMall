<script setup lang="ts">
/**
 * 个人中心视图
 *
 * 用户查看和编辑个人信息的页面。
 *
 * 业务职责：
 * - 展示用户基本信息（用户名、邮箱、手机号、角色、状态）
 * - 编辑个人资料（邮箱、手机号）
 * - 修改登录密码
 *
 * 设计原则：
 * - 使用 Element Plus 组件构建一致的 UI
 * - 使用 HTML5 语义化标签（article、section、header、footer、hgroup）
 * - 卡片式布局，信息清晰
 * - 编辑模式切换：查看模式和编辑模式
 * - 密码修改使用模态框
 *
 * 数据流：
 * - 页面加载时从 userStore 获取用户信息
 * - 编辑后通过 API 保存到后端
 * - 密码修改需要验证当前密码
 *
 * 安全考虑：
 * - 密码修改需要输入当前密码验证身份
 * - 新密码需要二次确认
 * - 密码最少 6 位
 *
 * 用户角色：
 * - 所有已登录用户可访问
 * - 只能编辑自己的信息
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores'
import { userApi, passwordApi } from '@/api'
import type { UserProfile, UpdateProfileRequest } from '@/api/user.api'
import {
  ElCard,
  ElAvatar,
  ElTag,
  ElDescriptions,
  ElDescriptionsItem,
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElDialog,
  ElAlert,
  ElSkeleton,
  ElSpace,
  ElDivider,
} from 'element-plus'
import { Edit, Lock } from '@element-plus/icons-vue'

const { t } = useI18n()
const userStore = useUserStore()

const isLoading = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const profile = ref<UserProfile | null>(null)
const editForm = ref<UpdateProfileRequest>({ email: '', phone: '' })

const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref<string | null>(null)
const isChangingPassword = ref(false)

const roleDisplayName = computed(() => {
  const roleMap: Record<string, string> = {
    ADMIN: t('roles.admin'),
    MERCHANT: t('roles.merchant'),
    USER: t('roles.user'),
  }
  return roleMap[profile.value?.userType || ''] || t('roles.user')
})

const statusDisplayName = computed(() => {
  const statusMap: Record<string, string> = {
    ACTIVE: t('profile.statusActive'),
    INACTIVE: t('profile.statusInactive'),
    BANNED: t('profile.statusBanned'),
  }
  return statusMap[profile.value?.status || ''] || t('profile.statusUnknown')
})

const avatarLetter = computed(() => 
  profile.value?.username?.charAt(0).toUpperCase() || 'U'
)

const isPasswordFormValid = computed(() =>
  passwordForm.value.currentPassword.length >= 6 &&
  passwordForm.value.newPassword.length >= 6 &&
  passwordForm.value.newPassword === passwordForm.value.confirmPassword
)

async function loadProfile() {
  isLoading.value = true
  error.value = null
  
  try {
    profile.value = {
      id: userStore.currentUser?.userId || '',
      username: userStore.currentUser?.username || '',
      email: userStore.currentUser?.email || '',
      phone: userStore.currentUser?.phone || '',
      avatar: undefined,
      userType: userStore.role || 'USER',
      status: userStore.currentUser?.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    }
    
    editForm.value = {
      email: profile.value.email,
      phone: profile.value.phone,
    }
  } catch (e: unknown) {
    error.value = (e as Error).message || t('profile.loadFailed')
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
    successMessage.value = t('profile.saveSuccess')
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (e: unknown) {
    error.value = (e as Error).message || t('profile.saveFailed')
  } finally {
    isSaving.value = false
  }
}

function openPasswordModal() {
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
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
    successMessage.value = t('profile.passwordChanged')
    setTimeout(() => { successMessage.value = null }, 3000)
  } catch (e: unknown) {
    passwordError.value = (e as Error).message || t('profile.passwordChangeFailed')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <article class="profile-page">
    <!-- 加载状态 -->
    <ElSkeleton v-if="isLoading" :rows="6" animated />

    <!-- 提示消息 -->
    <ElAlert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      closable
      class="message-alert"
      @close="error = null"
    />
    
    <ElAlert
      v-if="successMessage"
      :title="successMessage"
      type="success"
      show-icon
      closable
      class="message-alert"
      @close="successMessage = null"
    />

    <!-- 用户信息卡片 -->
    <ElCard v-if="profile && !isLoading" shadow="never" class="profile-card">
      <!-- 头部：头像和基本信息 -->
      <template #header>
        <header class="profile-header">
          <ElAvatar :size="80" class="profile-avatar">
            {{ avatarLetter }}
          </ElAvatar>
          <hgroup class="profile-info">
            <h2 class="profile-name">{{ profile.username }}</h2>
            <ElTag type="primary" size="small">{{ roleDisplayName }}</ElTag>
          </hgroup>
        </header>
      </template>

      <!-- 详细信息 -->
      <section class="profile-details">
        <ElForm v-if="isEditing" label-position="top">
          <ElFormItem :label="t('profile.email')">
            <ElInput v-model="editForm.email" :placeholder="t('profile.emailPlaceholder')" />
          </ElFormItem>
          <ElFormItem :label="t('profile.phone')">
            <ElInput v-model="editForm.phone" :placeholder="t('profile.phonePlaceholder')" />
          </ElFormItem>
        </ElForm>

        <ElDescriptions v-else :column="2" border>
          <ElDescriptionsItem :label="t('profile.email')">
            {{ profile.email || t('profile.notSet') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.phone')">
            {{ profile.phone || t('profile.notSet') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.role')">
            {{ roleDisplayName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem :label="t('profile.status')">
            <ElTag :type="profile.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ statusDisplayName }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </section>

      <ElDivider />

      <!-- 操作按钮 -->
      <footer class="profile-actions">
        <ElSpace v-if="isEditing">
          <ElButton @click="cancelEditing" :disabled="isSaving">{{ t('common.cancel') }}</ElButton>
          <ElButton type="primary" @click="saveProfile" :loading="isSaving">
            {{ isSaving ? t('profile.saving') : t('common.save') }}
          </ElButton>
        </ElSpace>
        <ElSpace v-else>
          <ElButton :icon="Lock" @click="openPasswordModal">{{ t('profile.changePassword') }}</ElButton>
          <ElButton type="primary" :icon="Edit" @click="startEditing">{{ t('profile.editProfile') }}</ElButton>
        </ElSpace>
      </footer>
    </ElCard>

    <!-- 修改密码弹窗 -->
    <ElDialog
      v-model="showPasswordModal"
      :title="t('profile.changePassword')"
      width="400px"
      :close-on-click-modal="false"
    >
      <ElAlert
        v-if="passwordError"
        :title="passwordError"
        type="error"
        show-icon
        class="password-error"
      />

      <ElForm label-position="top">
        <ElFormItem :label="t('profile.currentPassword')">
          <ElInput
            v-model="passwordForm.currentPassword"
            type="password"
            :placeholder="t('profile.currentPasswordPlaceholder')"
            show-password
          />
        </ElFormItem>
        <ElFormItem :label="t('profile.newPassword')">
          <ElInput
            v-model="passwordForm.newPassword"
            type="password"
            :placeholder="t('profile.newPasswordPlaceholder')"
            show-password
          />
        </ElFormItem>
        <ElFormItem :label="t('profile.confirmNewPassword')">
          <ElInput
            v-model="passwordForm.confirmPassword"
            type="password"
            :placeholder="t('profile.confirmNewPasswordPlaceholder')"
            show-password
          />
          <small
            v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
            class="password-mismatch"
          >
            {{ t('profile.passwordMismatch') }}
          </small>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <ElSpace>
          <ElButton @click="showPasswordModal = false">{{ t('common.cancel') }}</ElButton>
          <ElButton
            type="primary"
            :disabled="!isPasswordFormValid"
            :loading="isChangingPassword"
            @click="changePassword"
          >
            {{ isChangingPassword ? t('profile.changing') : t('profile.confirmChange') }}
          </ElButton>
        </ElSpace>
      </template>
    </ElDialog>
  </article>
</template>

<style scoped lang="scss">
@use '@/assets/styles/scss/variables' as *;
@use '@/assets/styles/scss/mixins' as *;

.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: $space-6;

  .message-alert {
    margin-bottom: $space-4;
  }

  .profile-card {
    @include card-base;
    border-radius: $radius-lg;

    .profile-header {
      display: flex;
      align-items: center;
      gap: $space-5;

      .profile-avatar {
        background: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
        border: 1px solid var(--border-muted);
        color: var(--accent-primary);
        font-size: 32px;
        font-weight: $font-weight-semibold;
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        gap: $space-2;

        .profile-name {
          margin: 0;
          font-size: 24px;
          font-weight: $font-weight-medium;
          color: var(--text-primary);
        }
      }
    }

    .profile-details {
      padding: $space-4 0;
    }

    .profile-actions {
      display: flex;
      justify-content: flex-end;
    }
  }

  @media (max-width: 600px) {
    padding: $space-4;

    .profile-card {
      .profile-header {
        flex-direction: column;
        text-align: center;
      }
    }
  }
}

.password-error {
  margin-bottom: $space-4;
}

.password-mismatch {
  color: var(--error);
  font-size: $font-size-sm;
  margin-top: $space-1;
}
</style>
