<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.processing') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.processing') }}</span>
      </template>
    </el-alert>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column label="Order" width="190">
        <template #default="{ row }">{{ row.order_number || row.order }}</template>
      </el-table-column>
      <el-table-column label="Step" width="150">
        <template #default="{ row }">{{ row.step_key || row.step }}</template>
      </el-table-column>
      <el-table-column prop="state" :label="t('common.status')" width="150">
        <template #default="{ row }"><el-tag :type="stateType(row.state)">{{ row.state }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="attempt" label="Attempt" width="90" />
      <el-table-column :label="t('common.actions')" min-width="300" align="right">
        <template #default="{ row }">
          <el-button v-if="canStart(row.state)" size="small" type="primary" @click="run(row, 'start')">{{ t('btn.start') }}</el-button>
          <el-button v-if="row.state === 'in_progress'" size="small" @click="run(row, 'pause')">{{ t('btn.pause') }}</el-button>
          <el-button v-if="row.state === 'paused'" size="small" @click="run(row, 'resume')">{{ t('btn.resume') }}</el-button>
          <el-button v-if="row.state === 'in_progress'" size="small" type="success" @click="run(row, 'complete')">{{ t('btn.complete') }}</el-button>
          <el-button v-if="row.state === 'in_progress' || row.state === 'waiting'" size="small" type="danger" plain @click="run(row, 'reject')">{{ t('btn.reject') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { executionAction, listExecutions } from '../api/processing'

const { t } = useI18n()
const rows = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await listExecutions()
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function run(row, action) {
  try {
    await executionAction(row.id, action)
    ElMessage.success(`${action} ok`)
    load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || `${action} failed`)
  }
}

function canStart(state) {
  return ['pending', 'ready', 'rework_required'].includes(state)
}

function stateType(state) {
  return {
    completed: 'success', in_progress: 'primary', paused: 'warning',
    rejected: 'danger', rework_required: 'danger', failed: 'danger', ready: 'info', pending: 'info'
  }[state] || 'info'
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
