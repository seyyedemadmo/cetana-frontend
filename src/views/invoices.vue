<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.invoices') }}</h2>
      <el-button type="primary" @click="dialog = true"><el-icon><Plus /></el-icon>&nbsp;New invoice</el-button>
    </div>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="number" label="Number" width="220" />
      <el-table-column prop="amount" label="Amount" width="150" />
      <el-table-column prop="currency" label="Currency" width="100" />
      <el-table-column prop="sync_state" label="Sync state" width="150">
        <template #default="{ row }"><el-tag :type="row.sync_state === 'synchronized' ? 'success' : 'info'">{{ row.sync_state }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="odoo_invoice_id" label="Odoo ID" min-width="160">
        <template #default="{ row }">{{ row.odoo_invoice_id || '—' }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="110" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="sync(row)">Sync to Odoo</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" title="New invoice" width="460px">
      <el-select v-model="form.order" filterable placeholder="Select a confirmed order" style="width: 100%">
        <el-option v-for="o in orders" :key="o.id" :label="`${o.order_number} · ${o.price_snapshot?.total || '—'}`" :value="o.id" />
      </el-select>
      <template #footer>
        <el-button @click="dialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!form.order" @click="create">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createInvoice, listInvoices, syncInvoice } from '../api/invoices'
import { listOrders } from '../api/orders'

const { t } = useI18n()
const rows = ref([])
const orders = ref([])
const loading = ref(false)
const dialog = ref(false)
const form = reactive({ order: null })

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

async function load() {
  loading.value = true
  try {
    const data = await listInvoices()
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

async function create() {
  try {
    await createInvoice(form.order)
    ElMessage.success('Invoice created')
    dialog.value = false
    form.order = null
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function sync(row) {
  try {
    await syncInvoice(row.id)
    ElMessage.success('Invoice synced to Odoo')
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

onMounted(() => {
  load()
  loadOrders()
})
</script>
