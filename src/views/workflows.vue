<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.workflows') }}</h2>
      <el-button type="primary" @click="refresh"><el-icon><Refresh /></el-icon>&nbsp;Refresh</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="name" label="Name" min-width="180" />
      <el-table-column prop="slug" label="Slug" width="200" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="Actions" width="240" align="right">
        <template #default="{ row }">
          <el-button v-if="auth.hasPerm('workflow.update')" size="small" @click="$router.push(`/workflows/${row.id}`)">Design</el-button>
          <el-button v-if="auth.hasPerm('workflow.publish')" size="small" type="success" plain :disabled="row.status === 'active'" @click="publish(row)">Publish</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import { listWorkflows, publishWorkflow } from '../api/workflows'

const { t } = useI18n()
const auth = useAuthStore()
const rows = ref([])
const loading = ref(false)

async function refresh() {
  loading.value = true
  try {
    const data = await listWorkflows()
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function publish(row) {
  try {
    await publishWorkflow(row.id)
    ElMessage.success('Workflow published')
    refresh()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Publish failed')
  }
}

onMounted(refresh)
</script>
