<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.settings') }}</h2></div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.settings') }}</span>
      </template>
    </el-alert>

    <el-card v-for="(entries, category) in grouped" :key="category" style="margin-bottom: 16px">
      <template #header>{{ category }}</template>
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" v-for="entry in entries" :key="entry.key">
            <el-form-item :label="entry.label">
              <el-switch v-if="entry.type === 'boolean'" v-model="form[entry.key]" />
              <el-select
                v-else-if="entry.type === 'choice'"
                v-model="form[entry.key]"
                style="width: 100%"
                filterable
              >
                <el-option
                  v-for="o in normalizeOptions(entry.options)"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
              <el-input
                v-else-if="entry.type === 'secret'"
                v-model="form[entry.key]"
                type="password"
                show-password
                :placeholder="t('settings.unchangedPlaceholder')"
              />
              <el-input-number v-else-if="entry.type === 'number'" v-model="form[entry.key]" style="width: 100%" />
              <el-input v-else v-model="form[entry.key]" :placeholder="entry.placeholder || ''" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 12px; flex-wrap: wrap">
      <el-button :loading="testing" @click="runTest">{{ t('settings.testOdooConnection') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ t('common.save') }}</el-button>
    </div>

    <el-alert
      v-if="testResult"
      :type="testResult.ok ? 'success' : 'error'"
      :closable="false"
      style="margin-top: 12px"
      :title="testResult.ok
        ? t('settings.testResult', { version: testResult.version?.server_version || '' })
        : t('common.connectionFailed', { error: testResult.error })"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getSettings, saveSettings, testOdoo } from '../api/settings'

const { t, locale } = useI18n()
const schema = ref([])
const form = reactive({})
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

function normalizeOptions(options = []) {
  return options.map((o) =>
    typeof o === 'object' && o !== null
      ? { value: o.value, label: o.label || o.value }
      : { value: o, label: o }
  )
}

function isVisible(entry) {
  const dep = entry.depends_on
  if (!dep || typeof dep !== 'object') return true
  return Object.entries(dep).every(([key, allowed]) => {
    const current = form[key]
    return Array.isArray(allowed) ? allowed.includes(current) : current === allowed
  })
}

async function runTest() {
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testOdoo()
  } catch (e) {
    testResult.value = { ok: false, error: e.response?.data?.error?.message || t('common.operationFailed') }
  } finally {
    testing.value = false
  }
}

const grouped = computed(() => {
  const map = {}
  for (const entry of schema.value) {
    if (!isVisible(entry)) continue
    if (!map[entry.category]) map[entry.category] = []
    map[entry.category].push(entry)
  }
  return map
})

async function load() {
  const data = await getSettings(locale.value)
  schema.value = data.schema || []
  const values = data.values || {}
  for (const entry of schema.value) {
    form[entry.key] = entry.type === 'secret' ? '' : values[entry.key]
  }
}

watch(locale, () => {
  load()
})

async function save() {
  saving.value = true
  try {
    const payload = {}
    for (const entry of schema.value) {
      const value = form[entry.key]
      if (entry.type === 'secret') {
        if (value) payload[entry.key] = value
      } else {
        payload[entry.key] = value
      }
    }
    await saveSettings(payload)
    ElMessage.success(t('common.save'))
    await load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
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
