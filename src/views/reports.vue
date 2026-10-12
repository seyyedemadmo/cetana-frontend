<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.reports') }}</h2>
      <el-button type="primary" @click="genDialog = true"><el-icon><Plus /></el-icon>&nbsp;{{ t('reports.generateReport') }}</el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.reports') }}</span>
      </template>
    </el-alert>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="order_number" label="Order" width="180" />
      <el-table-column prop="status" :label="t('common.status')" width="140" />
      <el-table-column :label="t('common.actions')" width="140" align="right">
        <template #default="{ row }">
          <el-button size="small" type="success" plain @click="downloadPdf(row)">{{ t('btn.pdf') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="genDialog" :title="t('reports.generateReport')" width="460px">
      <el-select v-model="genOrder" filterable :placeholder="t('reports.selectOrder')" style="width: 100%">
        <el-option v-for="o in orders" :key="o.id" :label="`${o.order_number} · ${o.status}`" :value="o.id" />
      </el-select>
      <template #footer>
        <el-button @click="genDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!genOrder" @click="generate">{{ t('common.generate') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { downloadReportPdf, generateReport, listFinalReports } from '../api/reports'
import { listOrders } from '../api/orders'

const { t } = useI18n()
const rows = ref([])
const orders = ref([])
const loading = ref(false)
const genDialog = ref(false)
const genOrder = ref(null)

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

async function load() {
  loading.value = true
  try {
    const data = await listFinalReports()
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadOrders() {
  try {
    const data = await listOrders()
    orders.value = data.results || []
  } catch (e) {
    orders.value = []
  }
}

async function generate() {
  try {
    await generateReport(genOrder.value)
    ElMessage.success(t('reports.generateReport'))
    genDialog.value = false
    genOrder.value = null
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function downloadPdf(row) {
  try {
    const blob = await downloadReportPdf(row.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${row.order_number}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

onMounted(() => {
  load()
  loadOrders()
})
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
