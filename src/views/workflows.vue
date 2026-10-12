<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.workflows') }}</h2>
      <el-button type="primary" @click="refresh"><el-icon><Refresh /></el-icon>&nbsp;{{ t('common.loading') }}</el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.workflows') }}</span>
      </template>
    </el-alert>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="name" label="Name" min-width="180" />
      <el-table-column prop="slug" label="Slug" width="200" />
      <el-table-column prop="status" :label="t('common.status')" width="120">
        <template #default="{ row }"><el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="240" align="right">
        <template #default="{ row }">
          <el-button v-if="auth.hasPerm('workflow.update')" size="small" @click="$router.push(`/workflows/${row.id}`)">{{ t('btn.design') }}</el-button>
          <el-button v-if="auth.hasPerm('workflow.publish')" size="small" type="success" plain :disabled="row.status === 'active'" @click="publish(row)">{{ t('btn.publish') }}</el-button>
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
    ElMessage.success(t('workflows.publish'))
    refresh()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('workflows.publish'))
  }
}

onMounted(refresh)
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
