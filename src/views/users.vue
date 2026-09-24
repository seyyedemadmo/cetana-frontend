<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.users') }}</h2>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>&nbsp;New user</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="username" label="Username" min-width="140" />
      <el-table-column prop="email" label="Email" min-width="180" />
      <el-table-column prop="phone" label="Phone" width="140" />
      <el-table-column label="Roles" min-width="200">
        <template #default="{ row }">
          <el-tag v-for="r in row.roles" :key="r.id" size="small" style="margin-inline-end: 6px">{{ r.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Status" width="110">
        <template #default="{ row }">
          <el-tag :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? 'Active' : 'Banned' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" min-width="300" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">Edit</el-button>
          <el-button size="small" :type="row.is_active ? 'warning' : 'success'" plain @click="toggleActive(row)">
            {{ row.is_active ? 'Ban' : 'Unban' }}
          </el-button>
          <el-button size="small" @click="openPassword(row)">Password</el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="editing ? 'Edit user' : 'New user'" width="520px">
      <el-form label-position="top">
        <el-form-item label="Username"><el-input v-model="form.username" :disabled="editing" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="First name"><el-input v-model="form.first_name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="Last name"><el-input v-model="form.last_name" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="Email"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="Phone"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item v-if="!editing" label="Password"><el-input v-model="form.password" type="password" show-password /></el-form-item>
        <el-form-item label="Roles">
          <el-select v-model="form.role_ids" multiple style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Active"><el-switch v-model="form.is_active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pwDialog" title="Reset password" width="420px">
      <el-input v-model="newPassword" type="password" show-password placeholder="New password" />
      <template #footer>
        <el-button @click="pwDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!newPassword" @click="doResetPassword">Set password</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createUser, deleteUser, listRoles, listUsers, setUserPassword, updateUser } from '../api/users'

const { t } = useI18n()
const rows = ref([])
const roles = ref([])
const loading = ref(false)
const dialog = ref(false)
const editing = ref(false)
const currentId = ref(null)
const pwDialog = ref(false)
const newPassword = ref('')
const pwUserId = ref(null)

const form = reactive({
  username: '', first_name: '', last_name: '', email: '', phone: '',
  password: '', role_ids: [], is_active: true
})

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

function reset() {
  Object.assign(form, {
    username: '', first_name: '', last_name: '', email: '', phone: '',
    password: '', role_ids: [], is_active: true
  })
}

async function load() {
  loading.value = true
  try {
    rows.value = (await listUsers()).results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    roles.value = (await listRoles()).results || []
  } catch (e) {
    roles.value = []
  }
}

function openCreate() {
  editing.value = false
  currentId.value = null
  reset()
  dialog.value = true
}

function openEdit(row) {
  editing.value = true
  currentId.value = row.id
  Object.assign(form, {
    username: row.username,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    password: '',
    role_ids: (row.roles || []).map((r) => r.id),
    is_active: row.is_active
  })
  dialog.value = true
}

async function save() {
  try {
    const payload = {
      first_name: form.first_name, last_name: form.last_name, email: form.email,
      phone: form.phone, role_ids: form.role_ids, is_active: form.is_active
    }
    if (editing.value) {
      await updateUser(currentId.value, payload)
    } else {
      await createUser({ ...payload, username: form.username, password: form.password || 'changeme123' })
    }
    ElMessage.success('Saved')
    dialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function toggleActive(row) {
  try {
    await updateUser(row.id, { is_active: !row.is_active })
    ElMessage.success(row.is_active ? 'User banned' : 'User unbanned')
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

function openPassword(row) {
  pwUserId.value = row.id
  newPassword.value = ''
  pwDialog.value = true
}

async function doResetPassword() {
  try {
    await setUserPassword(pwUserId.value, newPassword.value)
    ElMessage.success('Password set')
    pwDialog.value = false
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(`Delete user "${row.username}"?`, 'Confirm', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('Deleted')
    load()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e))
  }
}

onMounted(() => {
  load()
  loadRoles()
})
</script>
