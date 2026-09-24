<template>
  <div class="page">
    <div class="page-header"><h2>My profile</h2></div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>Account information</template>
          <el-form label-position="top">
            <el-form-item label="Username">
              <el-input :model-value="auth.user?.username" disabled />
            </el-form-item>
            <el-form-item label="First name">
              <el-input v-model="form.first_name" />
            </el-form-item>
            <el-form-item label="Last name">
              <el-input v-model="form.last_name" />
            </el-form-item>
            <el-form-item label="Email">
              <el-input v-model="form.email" />
            </el-form-item>
            <el-form-item label="Phone">
              <el-input v-model="form.phone" />
            </el-form-item>
            <el-button type="primary" :loading="saving" @click="save">Save</el-button>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>Change password</template>
          <el-form label-position="top">
            <el-form-item label="Current password">
              <el-input v-model="pw.old" type="password" show-password />
            </el-form-item>
            <el-form-item label="New password">
              <el-input v-model="pw.newPass" type="password" show-password />
            </el-form-item>
            <el-button type="primary" :loading="changing" @click="doChangePassword">Change password</el-button>
          </el-form>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>Roles</template>
          <el-tag v-for="r in auth.user?.roles || []" :key="r.id" style="margin-inline-end: 6px">{{ r.name }}</el-tag>
          <span v-if="!(auth.user?.roles || []).length" style="color: var(--el-text-color-secondary)">No roles</span>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import { changePassword, updateProfile } from '../api/profile'

const auth = useAuthStore()
const saving = ref(false)
const changing = ref(false)
const form = reactive({ first_name: '', last_name: '', email: '', phone: '' })
const pw = reactive({ old: '', newPass: '' })

onMounted(async () => {
  if (!auth.user) await auth.loadMe()
  const u = auth.user || {}
  Object.assign(form, {
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    email: u.email || '',
    phone: u.phone || ''
  })
})

async function save() {
  saving.value = true
  try {
    await updateProfile({ ...form })
    await auth.loadMe()
    ElMessage.success('Profile updated')
  } catch (e) {
    ElMessage.error('Update failed')
  } finally {
    saving.value = false
  }
}

async function doChangePassword() {
  changing.value = true
  try {
    await changePassword(pw.old, pw.newPass)
    ElMessage.success('Password changed')
    pw.old = ''
    pw.newPass = ''
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Change failed')
  } finally {
    changing.value = false
  }
}
</script>
