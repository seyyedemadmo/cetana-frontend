<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.monitoring') }}</h2></div>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-row :gutter="16" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" v-for="c in rows" :key="c.id">
        <el-card shadow="hover" style="margin-bottom: 16px">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>{{ c.name }}</span>
              <el-button size="small" type="primary" @click="access(c)">Stream access</el-button>
            </div>
          </template>
          <div style="color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6">
            <div>Facility: {{ c.facility || '—' }}</div>
            <div>Line: {{ c.processing_line || '—' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialog" title="Authorized stream" width="540px">
      <template v-if="streamUrl">
        <el-alert type="success" :closable="false" title="Access granted — short-lived token, scoped to your orders" style="margin-bottom: 14px" />
        <el-input :model-value="streamUrl" readonly />
      </template>
      <el-alert v-else type="error" :closable="false" title="Access denied for this stream" />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listCameras, requestStreamAccess, verifyStream } from '../api/monitoring'

const { t } = useI18n()
const rows = ref([])
const loading = ref(false)
const dialog = ref(false)
const streamUrl = ref('')

async function access(camera) {
  streamUrl.value = ''
  dialog.value = true
  try {
    const access = await requestStreamAccess(camera.id)
    const verified = await verifyStream(access.token)
    streamUrl.value = verified.stream_url
  } catch (e) {
    streamUrl.value = ''
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await listCameras()
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
})
</script>
