<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.monitoring') }}</h2>
      <el-button v-if="canSync" :loading="syncing" @click="sync">
        <el-icon><Refresh /></el-icon>{{ t('monitoring.syncNvr') }}
      </el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.monitoring') }}</span>
      </template>
    </el-alert>

    <div v-if="overview" class="overview">
      <el-tag effect="plain">{{ t('monitoring.total') }}: {{ overview.total }}</el-tag>
      <el-tag type="success" effect="plain">{{ t('monitoring.online') }}: {{ overview.online }}</el-tag>
      <el-tag type="danger" effect="plain">{{ t('monitoring.offline') }}: {{ overview.offline }}</el-tag>
      <span v-if="overview.device.machine_name || overview.device.model" class="overview-device">
        NVR: {{ overview.device.machine_name || overview.device.model }}
      </span>
    </div>

    <el-empty v-if="!cameras.length" :description="t('monitoring.noCameras')" />

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8" v-for="c in cameras" :key="c.id" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">
              <span>{{ c.name }}</span>
              <div style="display: flex; gap: 6px; align-items: center">
                <el-tag size="small" type="info">{{ (c.protocol || '—').toUpperCase() }}</el-tag>
                <el-tag size="small" :type="c.online === true ? 'success' : c.online === false ? 'danger' : 'info'">
                  {{ c.online === true ? t('monitoring.online') : c.online === false ? t('monitoring.offline') : t('monitoring.unknown') }}
                </el-tag>
              </div>
            </div>
          </template>
          <div style="color: var(--el-text-color-secondary); font-size: 13px; margin-bottom: 8px">
            <div v-if="c.description" class="cam-desc">{{ c.description }}</div>
            <div v-if="c.channel != null">{{ t('monitoring.channel') }}: {{ c.channel }}</div>
            <div v-if="c.model">{{ t('monitoring.model') }}: {{ c.model }}</div>
            <div v-if="c.resolution">{{ t('monitoring.resolution') }}: {{ c.resolution }}<span v-if="c.details?.compression"> · {{ c.details.compression }}</span></div>
            <div>{{ t('monitoring.facility') }}: {{ c.facility || '—' }}</div>
            <div>{{ t('monitoring.line') }}: {{ c.processing_line || '—' }}</div>
          </div>
          <el-button size="small" type="primary" @click="access(c)">{{ t('monitoring.streamAccess') }}</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialog" :title="dialogTitle" width="720px" @closed="stopSnapshots">
      <el-alert
        v-if="streamError"
        type="error"
        :closable="false"
        :title="streamError"
        style="margin-bottom: 14px"
      />
      <el-alert
        v-else-if="streamUrl || snapshotUrl || mjpegUrl"
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
        v-if="mjpegUrl"
        :src="mjpegUrl"
        alt="Live stream"
        style="width: 100%; border-radius: 8px; background: #111; min-height: 200px"
        @error="fallBackToSnapshots"
      />
      <img
        v-else-if="snapshotUrl"
        :src="snapshotSrc"
        alt="Camera snapshot"
        style="width: 100%; border-radius: 8px; background: #111; min-height: 200px"
        @load="scheduleSnapshot"
        @error="onSnapshotError"
      />
      <img
        v-else-if="streamUrl && streamMeta.player === 'mjpeg'"
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
        v-else-if="streamUrl === null && !streamError && !snapshotUrl && !mjpegUrl"
        type="warning"
        :closable="false"
        :title="t('monitoring.protocolUnsupported')"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getMonitoringOverview, listCameras, requestStreamAccess, syncCameras, verifyStream } from '../api/monitoring'
import { useAuthStore } from '../store/auth'

const { t } = useI18n()
const auth = useAuthStore()
const canSync = computed(() => auth.hasPerm('settings.manage'))
const cameras = ref([])
const overview = ref(null)
const syncing = ref(false)
const dialogTitle = ref('')
const snapshotUrl = ref('')
const snapshotSrc = ref('')
const mjpegUrl = ref('')
const snapshotRefreshMs = ref(1000)
let snapshotTimer = null
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
  try {
    overview.value = await getMonitoringOverview()
  } catch (e) {
    overview.value = null
  }
}

async function sync() {
  syncing.value = true
  try {
    const r = await syncCameras()
    ElMessage.success(t('monitoring.syncDone', { found: r.found, created: r.created }))
    await load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('monitoring.syncFailed'))
  } finally {
    syncing.value = false
  }
}

// Near-live view: reload the NVR snapshot after each frame finishes loading,
// so slow links never stack up requests.
function nextSnapshot() {
  const sep = snapshotUrl.value.includes('?') ? '&' : '?'
  snapshotSrc.value = `${snapshotUrl.value}${sep}_=${Date.now()}`
}
function scheduleSnapshot() {
  clearTimeout(snapshotTimer)
  if (!dialog.value || !snapshotUrl.value) return
  snapshotTimer = setTimeout(nextSnapshot, snapshotRefreshMs.value)
}
function onSnapshotError() {
  clearTimeout(snapshotTimer)
  if (!dialog.value || !snapshotUrl.value) return
  snapshotTimer = setTimeout(nextSnapshot, 3000)
}
// The MJPEG proxy gives smooth video; if the NVR or network refuses it,
// drop back to polling snapshots (about 1 frame per second).
function fallBackToSnapshots() {
  mjpegUrl.value = ''
  if (snapshotUrl.value) nextSnapshot()
}
function stopSnapshots() {
  clearTimeout(snapshotTimer)
  mjpegUrl.value = ''
  snapshotUrl.value = ''
  snapshotSrc.value = ''
}

async function access(c) {
  stopSnapshots()
  dialogTitle.value = c.name || t('monitoring.authorizedStream')
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
    if (data.player === 'snapshot' && data.snapshot_url) {
      snapshotRefreshMs.value = data.refresh_ms || 1000
      snapshotUrl.value = data.snapshot_url
      if (data.mjpeg_url) {
        mjpegUrl.value = data.mjpeg_url
      } else {
        nextSnapshot()
      }
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
onBeforeUnmount(stopSnapshots)
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
.overview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.overview-device {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.cam-desc {
  margin-bottom: 6px;
  color: var(--el-text-color-regular);
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
