<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.settings') }}</h2></div>

    <el-card v-for="(entries, category) in grouped" :key="category" style="margin-bottom: 16px">
      <template #header>{{ category }}</template>
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" v-for="entry in entries" :key="entry.key">
            <el-form-item :label="entry.label">
              <el-switch v-if="entry.type === 'boolean'" v-model="form[entry.key]" />
              <el-select v-else-if="entry.type === 'choice'" v-model="form[entry.key]" style="width: 100%">
                <el-option v-for="o in entry.options" :key="o" :label="o" :value="o" />
              </el-select>
              <el-input
                v-else-if="entry.type === 'secret'"
                v-model="form[entry.key]"
                type="password"
                show-password
                placeholder="unchanged — leave blank to keep"
              />
              <el-input-number v-else-if="entry.type === 'number'" v-model="form[entry.key]" style="width: 100%" />
              <el-input v-else v-model="form[entry.key]" :placeholder="entry.placeholder || ''" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 12px; flex-wrap: wrap">
      <el-button :loading="testing" @click="runTest">Test Odoo connection</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.save') }}</el-button>
    </div>

    <el-alert
      v-if="testResult"
      :type="testResult.ok ? 'success' : 'error'"
      :closable="false"
      style="margin-top: 12px"
      :title="testResult.ok
        ? `Connected to Odoo ${testResult.version?.server_version || ''} (uid ${testResult.uid})`
        : `Connection failed: ${testResult.error}`"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getSettings, saveSettings, testOdoo } from '../api/settings'

const { t } = useI18n()
const schema = ref([])
const form = reactive({})
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

async function runTest() {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testOdoo()
  } catch (e) {
    testResult.value = { ok: false, error: e.response?.data?.error?.message || 'Request failed' }
  } finally {
    testing.value = false
  }
}

const grouped = computed(() => {
  const map = {}
  for (const entry of schema.value) {
    if (!map[entry.category]) map[entry.category] = []
    map[entry.category].push(entry)
  }
  return map
})

async function load() {
  const data = await getSettings()
  schema.value = data.schema || []
  const values = data.values || {}
  for (const entry of schema.value) {
    form[entry.key] = entry.type === 'secret' ? '' : values[entry.key]
  }
}

async function save() {
  saving.value = true
  try {
    const payload = {}
    for (const entry of schema.value) {
      const value = form[entry.key]
      if (entry.type === 'secret') {
        if (value) payload[entry.key] = value // only send changed secrets
      } else {
        payload[entry.key] = value
      }
    }
    await saveSettings(payload)
    ElMessage.success('Settings saved')
    await load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
