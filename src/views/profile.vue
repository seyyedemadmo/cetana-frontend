<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('profile.title') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.profile') }}</span>
      </template>
    </el-alert>

    <el-card style="margin-bottom: 16px">
      <template #header>{{ t('profile.accountInfo') }}</template>
      <el-form :model="form" label-width="140px">
        <el-form-item :label="t('login.username')">
          <el-input v-model="form.username" disabled />
        </el-form-item>
        <el-form-item label="Email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item :label="t('login.username')">
          <el-input v-model="form.first_name" />
        </el-form-item>
        <el-form-item label="Last name">
          <el-input v-model="form.last_name" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">{{ t('common.save') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-bottom: 16px">
      <template #header>{{ t('profile.changePassword') }}</template>
      <el-form label-width="140px">
        <el-form-item :label="t('profile.changePassword')">
          <el-input v-model="newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="changing" @click="doChangePassword">{{ t('profile.changePasswordAction') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>{{ t('profile.roles') }}</template>
      <el-tag v-for="r in auth.user?.roles || []" :key="r.id" style="margin-inline-end: 8px">{{ r.name }}</el-tag>
      <span v-if="!(auth.user?.roles || []).length" style="color: var(--el-text-color-secondary)">{{ t('profile.noRoles') }}</span>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import { fetchMe } from '../api/auth'

const { t } = useI18n()
const auth = useAuthStore()

const form = reactive({ username: '', email: '', first_name: '', last_name: '', phone: '' })
const saving = ref(false)
const changing = ref(false)
const newPassword = ref('')

async function load() {
  try {
    const me = await fetchMe()
    Object.assign(form, me)
  } catch (e) {
    /* ignore */
  }
}

async function save() {
  saving.value = true
  try {
    await fetchMe()
    ElMessage.success(t('common.save'))
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Operation failed')
  } finally {
    saving.value = false
  }
}

async function doChangePassword() {
  changing.value = true
  try {
    const { changePassword } = await import('../api/profile')
    await changePassword({ new_password: newPassword.value })
    ElMessage.success(t('profile.changePasswordAction'))
    newPassword.value = ''
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Operation failed')
  } finally {
    changing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.help-banner {
  margin-bottom: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-info-light-9));
  border: 1px solid var(--el-color-primary-light-7);
}
.help-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-color-primary-dark-2);
}
</style>
