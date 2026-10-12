<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.monitoring') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.monitoring') }}</span>
      </template>
    </el-alert>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8" v-for="c in cameras" :key="c.id" style="margin-bottom: 16px">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span>{{ c.name }}</span>
              <el-tag :type="c.active ? 'success' : 'info'">{{ c.active ? 'Active' : 'Inactive' }}</el-tag>
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

    <el-dialog v-model="dialog" :title="t('monitoring.authorizedStream')" width="540px">
      <el-alert v-if="streamUrl" type="success" :closable="false" :title="t('monitoring.accessGranted')" style="margin-bottom: 14px" />
      <el-alert v-else type="error" :closable="false" :title="t('monitoring.accessDenied')" />
      <video v-if="streamUrl" :src="streamUrl" controls style="width: 100%; border-radius: 8px" />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listCameras, requestStreamAccess, verifyStream } from '../api/monitoring'

const { t } = useI18n()
const cameras = ref([])
const dialog = ref(false)
const streamUrl = ref(null)

async function load() {
  try {
    const data = await listCameras()
    cameras.value = data.results || []
  } catch (e) {
    cameras.value = []
  }
}

async function access(c) {
  streamUrl.value = null
  dialog.value = true
  try {
    const { token } = await requestStreamAccess(c.id)
    const { url } = await verifyStream(token)
    streamUrl.value = url
  } catch (e) {
    streamUrl.value = null
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
</style>
