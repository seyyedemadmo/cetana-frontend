<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.reports') }}</h2></div>

    <el-tabs>
      <el-tab-pane label="Report definitions">
        <el-table :data="definitions" v-loading="loading" stripe>
          <el-table-column prop="name" label="Name" min-width="200" />
          <el-table-column prop="active" label="Active" width="100">
            <template #default="{ row }"><el-tag :type="row.active ? 'success' : 'info'">{{ row.active }}</el-tag></template>
          </el-table-column>
          <el-table-column label="Fields" min-width="300">
            <template #default="{ row }">
              <el-tag v-for="f in row.fields" :key="f.key" size="small" style="margin-inline-end: 6px">{{ f.label }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Final reports">
        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end">
          <el-button type="primary" @click="genDialog = true"><el-icon><Plus /></el-icon>&nbsp;Generate report</el-button>
        </div>
        <el-table :data="finalReports" v-loading="loading" stripe>
          <el-table-column label="Order" width="200">
            <template #default="{ row }">{{ row.data?.order_number || row.order }}</template>
          </el-table-column>
          <el-table-column label="Net weight" width="120">
            <template #default="{ row }">{{ row.data?.net_weight_kg || '—' }}</template>
          </el-table-column>
          <el-table-column label="Total" width="180">
            <template #default="{ row }">{{ row.data?.price?.total ? `${row.data.price.total} ${row.data.price.currency}` : '—' }}</template>
          </el-table-column>
          <el-table-column label="Actions" align="right" width="120">
            <template #default="{ row }">
              <el-button size="small" type="success" plain @click="downloadPdf(row)">PDF</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="genDialog" title="Generate report" width="460px">
      <el-select v-model="genOrder" filterable placeholder="Select an order" style="width: 100%">
        <el-option v-for="o in orders" :key="o.id" :label="o.order_number" :value="o.id" />
      </el-select>
      <template #footer>
        <el-button @click="genDialog = false">Cancel</el-button>
        <el-button type="primary" :disabled="!genOrder" @click="generate">Generate</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listOrders } from '../api/orders'
import { downloadReportPdf, generateReport, listFinalReports, listReportDefinitions } from '../api/reports'

const { t } = useI18n()
const definitions = ref([])
const finalReports = ref([])
const orders = ref([])
const loading = ref(false)
const genDialog = ref(false)
const genOrder = ref(null)

async function load() {
  loading.value = true
  try {
    definitions.value = (await listReportDefinitions()).results || []
    finalReports.value = (await listFinalReports()).results || []
  } catch (e) {
    definitions.value = []
    finalReports.value = []
  } finally {
    loading.value = false
  }
}

async function loadOrders() {
  try {
    orders.value = (await listOrders()).results || []
  } catch (e) {
    orders.value = []
  }
}

async function generate() {
  try {
    await generateReport(genOrder.value)
    ElMessage.success('Report generated')
    genDialog.value = false
    genOrder.value = null
    load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || 'Generation failed')
  }
}

async function downloadPdf(row) {
  try {
    const blob = await downloadReportPdf(row.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.data?.order_number || 'report'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('PDF download failed')
  }
}

onMounted(() => {
  load()
  loadOrders()
})
</script>
