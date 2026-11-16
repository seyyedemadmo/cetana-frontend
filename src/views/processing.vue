<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.processing') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.processing') }}</span>
      </template>
    </el-alert>

    <el-empty :description="t('processing.emptyHint')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column :label="t('common.order')" width="190">
        <template #default="{ row }">{{ row.order_number || row.order }}</template>
      </el-table-column>
      <el-table-column :label="t('processing.step')" width="160">
        <template #default="{ row }">{{ stepLabel(t, row.step_key, row.step_name || row.step) }}</template>
      </el-table-column>
      <el-table-column prop="state" :label="t('common.status')" width="150">
        <template #default="{ row }"><el-tag :type="stateType(row.state)">{{ stateLabel(row.state) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="attempt" :label="t('processing.attempt')" width="90" />
      <el-table-column :label="t('processing.startedAt')" width="150">
        <template #default="{ row }"><JalaliText :value="row.started_at" mode="datetime" /></template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" min-width="360" align="right">
        <template #default="{ row }">
          <el-button
            v-if="row.state === 'in_progress' && (row.cameras || []).length"
            size="small"
            type="warning"
            plain
            @click="openLive(row)"
          >
            {{ t('processing.liveView') }}
          </el-button>
          <el-button v-if="canStart(row.state)" size="small" type="primary" @click="run(row, 'start')">{{ t('btn.start') }}</el-button>
          <el-button v-if="row.state === 'in_progress'" size="small" @click="run(row, 'pause')">{{ t('btn.pause') }}</el-button>
          <el-button v-if="row.state === 'paused'" size="small" @click="run(row, 'resume')">{{ t('btn.resume') }}</el-button>
          <el-button v-if="row.state === 'in_progress'" size="small" type="success" @click="run(row, 'complete')">{{ t('btn.complete') }}</el-button>
          <el-button v-if="row.state === 'in_progress' || row.state === 'waiting'" size="small" type="danger" plain @click="run(row, 'reject')">{{ t('btn.reject') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="liveDialog" :title="liveTitle" width="720px" destroy-on-close @closed="teardownPlayback">
      <p class="hint">{{ t('processing.liveHint') }}</p>
      <div v-if="liveCameras.length > 1" class="cam-pills">
        <el-button
          v-for="c in liveCameras"
          :key="c.id"
          size="small"
          :type="c.id === activeCameraId ? 'primary' : 'default'"
          @click="playCamera(c)"
        >
          {{ c.name }}
        </el-button>
      </div>
      <div class="player">
        <video v-if="webrtcUrl" ref="videoEl" autoplay playsinline muted class="video" />
        <img v-else-if="mjpegUrl" :src="mjpegUrl" class="video" alt="" />
        <img v-else-if="snapshotSrc" :src="snapshotSrc" class="video" alt="" @load="scheduleSnapshot" @error="onSnapshotError" />
        <el-empty v-else-if="streamError" :description="streamError" />
        <el-empty v-else :description="t('processing.connecting')" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { requestStreamAccess, verifyStream } from '../api/monitoring'
import { executionAction, listExecutions } from '../api/processing'
import { statusLabel, stepLabel } from '../utils/labels'

const { t } = useI18n()
const rows = ref([])
const loading = ref(false)

const liveDialog = ref(false)
const liveTitle = ref('')
const liveCameras = ref([])
const activeCameraId = ref(null)
const videoEl = ref(null)
const webrtcUrl = ref('')
const mjpegUrl = ref('')
const snapshotUrl = ref('')
const snapshotSrc = ref('')
const streamError = ref('')
const iceServers = ref([{ urls: 'stun:stun.l.google.com:19302' }])
let snapshotTimer = null
let peer = null

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
    ElMessage.success(t('processing.actionOk', { action }))
    load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('processing.actionFailed', { action }))
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

function stateLabel(state) {
  const specific = t(`processing.states.${state}`)
  if (specific !== `processing.states.${state}`) return specific
  return statusLabel(t, state)
}

function openLive(row) {
  liveCameras.value = row.cameras || []
  liveTitle.value = `${t('processing.liveView')} · ${row.step_name || row.step_key} · ${row.order_number}`
  liveDialog.value = true
  if (liveCameras.value.length) playCamera(liveCameras.value[0])
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
    try { peer.close() } catch (_) { /* ignore */ }
    peer = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
}

function teardownPlayback() {
  clearTimeout(snapshotTimer)
  stopWebRtc()
  webrtcUrl.value = ''
  mjpegUrl.value = ''
  snapshotUrl.value = ''
  snapshotSrc.value = ''
  streamError.value = ''
  activeCameraId.value = null
}

function nextSnapshot() {
  if (!snapshotUrl.value) return
  const sep = snapshotUrl.value.includes('?') ? '&' : '?'
  snapshotSrc.value = `${snapshotUrl.value}${sep}_=${Date.now()}`
}
function scheduleSnapshot() {
  clearTimeout(snapshotTimer)
  if (!liveDialog.value || !snapshotUrl.value || mjpegUrl.value || webrtcUrl.value) return
  snapshotTimer = setTimeout(nextSnapshot, 1000)
}
function onSnapshotError() {
  clearTimeout(snapshotTimer)
  if (!liveDialog.value) return
  snapshotTimer = setTimeout(nextSnapshot, 3000)
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
  await Promise.race([
    new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') { resolve(); return }
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
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: sdp })
  if (!res.ok) throw new Error(`WebRTC signaling failed (${res.status})`)
  const answer = await res.text()
  await pc.setRemoteDescription({ type: 'answer', sdp: answer })
}

async function playCamera(camera) {
  teardownPlayback()
  activeCameraId.value = camera.id
  try {
    const { token } = await requestStreamAccess(camera.id)
    const data = await verifyStream(token)
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
        if (data.mjpeg_url) mjpegUrl.value = data.mjpeg_url
        else if (data.snapshot_url) nextSnapshot()
        else streamError.value = e.message || t('monitoring.streamFailed')
      }
      return
    }
    if (data.mjpeg_url) {
      mjpegUrl.value = data.mjpeg_url
      return
    }
    if (data.snapshot_url) {
      snapshotUrl.value = data.snapshot_url
      nextSnapshot()
      return
    }
    streamError.value = t('monitoring.streamFailed')
  } catch (e) {
    streamError.value = e.response?.data?.error?.message || t('monitoring.streamFailed')
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
.help-text { font-size: 14px; line-height: 1.6; color: var(--el-color-primary-dark-2); }
.hint { color: var(--el-text-color-secondary); margin: 0 0 12px; }
.cam-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.player {
  min-height: 320px;
  background: #111;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.video { width: 100%; max-height: 420px; object-fit: contain; }
</style>
