<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.monitoring') }}</h2>
      <div style="display: flex; gap: 8px; flex-wrap: wrap">
        <el-button v-if="canAssign" @click="openAssign">{{ t('monitoring.assignStages') }}</el-button>
        <el-button v-if="canSync" :loading="syncing" @click="sync">
          <el-icon><Refresh /></el-icon>{{ t('monitoring.syncNvr') }}
        </el-button>
      </div>
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
        {{ t('monitoring.nvr') }}: {{ overview.device.machine_name || overview.device.model }}
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
          <el-button size="small" type="primary" @click="access(c)">{{ t('monitoring.liveView') }}</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="assignDialog" :title="t('monitoring.assignStages')" width="520px">
      <p class="hint">{{ t('monitoring.assignHint') }}</p>
      <el-form label-position="top">
        <el-form-item :label="t('monitoring.stage')">
          <el-select v-model="assignStep" filterable style="width: 100%" @change="loadStepAssignment">
            <el-option v-for="s in serviceSteps" :key="s.id" :label="stepLabel(t, s.key, s.name)" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('monitoring.cameras')">
          <el-select v-model="assignCameraIds" multiple filterable style="width: 100%">
            <el-option v-for="c in cameras" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!assignStep" @click="saveAssignment">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialog" :title="dialogTitle" width="720px" @closed="teardownPlayback">
      <el-alert
        v-if="streamError"
        type="error"
        :closable="false"
        :title="streamError"
        style="margin-bottom: 14px"
      />
      <el-alert
        v-else-if="webrtcUrl || streamUrl || snapshotUrl || mjpegUrl"
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
        <span v-if="streamMeta.player">{{ t('monitoring.player') }}: {{ playerLabel(t, streamMeta.player) }}</span>
      </div>

      <video
        v-if="webrtcUrl"
        ref="videoEl"
        autoplay
        muted
        playsinline
        controls
        style="width: 100%; border-radius: 8px; background: #111; min-height: 240px"
      />
      <img
        v-else-if="mjpegUrl"
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
        v-else-if="streamUrl === null && !streamError && !snapshotUrl && !mjpegUrl && !webrtcUrl"
        type="warning"
        :closable="false"
        :title="t('monitoring.protocolUnsupported')"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  getMonitoringOverview,
  listCameras,
  listStepCameras,
  replaceStepCameras,
  requestStreamAccess,
  syncCameras,
  verifyStream
} from '../api/monitoring'
import { listSteps, listWorkflows } from '../api/workflows'
import { useAuthStore } from '../store/auth'
import { playerLabel, stepLabel } from '../utils/labels'

const { t } = useI18n()
const auth = useAuthStore()
const canSync = computed(() => auth.hasPerm('monitoring.manage'))
const canAssign = computed(() => auth.hasPerm('monitoring.manage'))
const assignDialog = ref(false)
const assignStep = ref(null)
const assignCameraIds = ref([])
const serviceSteps = ref([])
const cameras = ref([])
const overview = ref(null)
const syncing = ref(false)
const dialogTitle = ref('')
const snapshotUrl = ref('')
const snapshotSrc = ref('')
const mjpegUrl = ref('')
const webrtcUrl = ref('')
const iceServers = ref([{ urls: 'stun:stun.l.google.com:19302' }])
const snapshotRefreshMs = ref(1000)
let snapshotTimer = null
let peer = null
const videoEl = ref(null)
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

function nextSnapshot() {
  const sep = snapshotUrl.value.includes('?') ? '&' : '?'
  snapshotSrc.value = `${snapshotUrl.value}${sep}_=${Date.now()}`
}
function scheduleSnapshot() {
  clearTimeout(snapshotTimer)
  streamError.value = ''
  if (!dialog.value || !snapshotUrl.value) return
  snapshotTimer = setTimeout(nextSnapshot, snapshotRefreshMs.value)
}
function onSnapshotError() {
  clearTimeout(snapshotTimer)
  if (!dialog.value || !snapshotUrl.value) return
  if (!streamError.value) {
    streamError.value = t('monitoring.streamFailed')
  }
  snapshotTimer = setTimeout(nextSnapshot, 3000)
}
function fallBackToSnapshots() {
  mjpegUrl.value = ''
  webrtcUrl.value = ''
  stopWebRtc()
  if (snapshotUrl.value) {
    nextSnapshot()
    return
  }
  streamError.value = t('monitoring.streamFailed')
}

function parseIceServers(raw) {
  if (!raw) return [{ urls: 'stun:stun.l.google.com:19302' }]
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [{ urls: 'stun:stun.l.google.com:19302' }]
  } catch {
    return [{ urls: 'stun:stun.l.google.com:19302' }]
  }
}

function stopWebRtc() {
  if (peer) {
    try {
      peer.close()
    } catch (_) {
      /* ignore */
    }
    peer = null
  }
  if (videoEl.value) {
    videoEl.value.srcObject = null
  }
}

async function startWebRtc(url) {
  stopWebRtc()
  const pc = new RTCPeerConnection({ iceServers: iceServers.value })
  peer = pc
  pc.addTransceiver('video', { direction: 'recvonly' })
  pc.addTransceiver('audio', { direction: 'recvonly' })
  pc.ontrack = (ev) => {
    const el = videoEl.value
    if (!el) return
    el.srcObject = ev.streams[0]
    el.play().catch(() => {})
  }
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  // Wait briefly for ICE gathering so go2rtc gets candidates in the offer.
  await Promise.race([
    new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve()
        return
      }
      const done = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', done)
          resolve()
        }
      }
      pc.addEventListener('icegatheringstatechange', done)
    }),
    new Promise((r) => setTimeout(r, 1500)),
  ])
  const sdp = pc.localDescription?.sdp || offer.sdp
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: sdp,
  })
  if (!res.ok) {
    throw new Error(`WebRTC signaling failed (${res.status})`)
  }
  const answer = await res.text()
  await pc.setRemoteDescription({ type: 'answer', sdp: answer })
}

function teardownPlayback() {
  clearTimeout(snapshotTimer)
  stopWebRtc()
  mjpegUrl.value = ''
  webrtcUrl.value = ''
  snapshotUrl.value = ''
  snapshotSrc.value = ''
  streamUrl.value = null
}

async function access(c) {
  teardownPlayback()
  dialogTitle.value = c.name || t('monitoring.authorizedStream')
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
      return
    }
    if (data.player === 'webrtc' && data.webrtc_url) {
      iceServers.value = parseIceServers(data.ice_servers)
      snapshotUrl.value = data.snapshot_url || ''
      mjpegUrl.value = data.mjpeg_url || ''
      webrtcUrl.value = data.webrtc_url
      await nextTick()
      try {
        await startWebRtc(data.webrtc_url)
      } catch (e) {
        webrtcUrl.value = ''
        stopWebRtc()
        if (data.mjpeg_url) {
          mjpegUrl.value = data.mjpeg_url
        } else if (data.snapshot_url) {
          nextSnapshot()
        } else {
          streamError.value = e.message || t('monitoring.streamFailed')
        }
      }
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
    streamUrl.value = data.stream_url || data.url || null
  } catch (e) {
    streamUrl.value = null
    streamError.value = e.response?.data?.error?.message || t('monitoring.accessDenied')
  }
}

async function loadServiceSteps() {
  try {
    const workflows = await listWorkflows()
    const active = (workflows.results || workflows || []).find((w) => w.status === 'active' && w.active_version)
    if (!active?.active_version?.id) {
      serviceSteps.value = []
      return
    }
    const data = await listSteps(active.active_version.id)
    serviceSteps.value = data.results || []
  } catch {
    serviceSteps.value = []
  }
}

async function openAssign() {
  await loadServiceSteps()
  assignStep.value = null
  assignCameraIds.value = []
  assignDialog.value = true
}

async function loadStepAssignment() {
  if (!assignStep.value) {
    assignCameraIds.value = []
    return
  }
  try {
    const data = await listStepCameras({ step: assignStep.value })
    assignCameraIds.value = (data.results || data || []).map((l) => l.camera)
  } catch {
    assignCameraIds.value = []
  }
}

async function saveAssignment() {
  try {
    await replaceStepCameras(assignStep.value, assignCameraIds.value)
    ElMessage.success(t('common.saved'))
    assignDialog.value = false
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('common.operationFailed'))
  }
}

onMounted(load)
onBeforeUnmount(teardownPlayback)
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
.hint { color: var(--el-text-color-secondary); margin: 0 0 12px; line-height: 1.5; }
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
