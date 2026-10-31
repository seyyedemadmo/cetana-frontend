<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.monitoring') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.monitoring') }}</span>
      </template>
    </el-alert>

    <el-empty v-if="!cameras.length" :description="t('monitoring.noCameras')" />

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8" v-for="c in cameras" :key="c.id" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
              <span>{{ c.name }}</span>
              <div style="display: flex; gap: 6px; align-items: center">
                <el-tag size="small" type="info">{{ (c.protocol || '—').toUpperCase() }}</el-tag>
                <el-tag :type="c.active ? 'success' : 'info'">{{ c.active ? 'Active' : 'Inactive' }}</el-tag>
              </div>
            </div>
          </template>
          <div style="color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 8px">
            <div>{{ t('monitoring.facility') }}: {{ c.facility || '—' }}</div>
            <div>{{ t('monitoring.line') }}: {{ c.processing_line || '—' }}</div>
          </div>
          <el-button size="small" type="primary" @click="access(c)">{{ t('monitoring.streamAccess') }}</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialog" :title="t('monitoring.authorizedStream')" width="640px">
      <el-alert
        v-if="streamError"
        type="error"
        :closable="false"
        :title="streamError"
        style="margin-bottom: 14px"
      />
      <el-alert
        v-else-if="streamUrl"
        type="success"
        :closable="false"
        :title="t('monitoring.accessGranted')"
        style="margin-bottom: 14px"
      />
      <el-alert
        v-else
        type="error"
        :closable="false"
        :title="t('monitoring.accessDenied')"
        style="margin-bottom: 14px"
      />

      <div v-if="streamMeta.protocol" class="stream-meta">
        <el-tag size="small">{{ streamMeta.protocol.toUpperCase() }}</el-tag>
        <span v-if="streamMeta.player">{{ t('monitoring.player') }}: {{ streamMeta.player }}</span>
      </div>

      <img
        v-if="streamUrl && streamMeta.player === 'mjpeg'"
        :src="streamUrl"
        alt="MJPEG stream"
        style="width: 100%; border-radius: 8px; background: #111"
      />
      <video
        v-else-if="streamUrl && streamMeta.player !== 'none'"
        :src="streamUrl"
        controls
        autoplay
        muted
        playsinline
        style="width: 100%; border-radius: 8px; background: #111"
      />
      <el-alert
        v-else-if="streamUrl === null && !streamError"
        type="warning"
        :closable="false"
        :title="t('monitoring.protocolUnsupported')"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listCameras, requestStreamAccess, verifyStream } from '../api/monitoring'

const { t } = useI18n()
const cameras = ref([])
const dialog = ref(false)
const streamUrl = ref(null)
const streamError = ref('')
const streamMeta = reactive({ protocol: '', player: '' })

async function load() {
  try {
    const data = await listCameras()
    cameras.value = data.results || data || []
  } catch (e) {
    cameras.value = []
  }
}

async function access(c) {
  streamUrl.value = null
  streamError.value = ''
  streamMeta.protocol = c.protocol || ''
  streamMeta.player = ''
  dialog.value = true
  try {
    const { token } = await requestStreamAccess(c.id)
    const data = await verifyStream(token)
    streamMeta.protocol = data.protocol || c.protocol || ''
    streamMeta.player = data.player || 'video'
    if (data.error) {
      streamError.value = data.error
      streamUrl.value = null
      return
    }
    // Backend returns stream_url; older alias url is also accepted.
    streamUrl.value = data.stream_url || data.url || null
  } catch (e) {
    streamUrl.value = null
    streamError.value = e.response?.data?.error?.message || t('monitoring.accessDenied')
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
.stream-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
