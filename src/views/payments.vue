<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.payments') }}</h2>
      <el-button type="primary" @click="dialog = true"><el-icon><Plus /></el-icon>&nbsp;New payment</el-button>
    </div>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="amount" label="Amount" width="150" />
      <el-table-column prop="currency" label="Currency" width="100" />
      <el-table-column prop="status" label="Status" width="130">
        <template #default="{ row }"><el-tag :type="row.status === 'success' ? 'success' : 'warning'">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="transaction_id" label="Transaction ID" min-width="180">
        <template #default="{ row }">{{ row.transaction_id || '—' }}</template>
      </el-table-column>
      <el-table-column label="Actions" width="120" align="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="row.status === 'success'" @click="verify(row)">Verify</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" title="New payment" width="460px">
      <el-form label-position="top">
        <el-form-item label="Order">
          <el-select v-model="form.order" filterable placeholder="Select order" style="width: 100%">
            <el-option v-for="o in orders" :key="o.id" :label="o.order_number" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Amount">
          <el-input-number v-model="form.amount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
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
import { listOrders } from '../api/orders'
import { createPayment, listPayments, verifyPayment } from '../api/payments'

const { t } = useI18n()
const rows = ref([])
const orders = ref([])
const loading = ref(false)
const dialog = ref(false)
const form = reactive({ order: null, amount: 0 })

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

async function load() {
  loading.value = true
  try {
    const data = await listPayments()
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
    const result = await createPayment({ order: form.order, amount: form.amount })
    ElMessage.success(`Payment requested · redirect: ${result.redirect_url}`)
    dialog.value = false
    form.order = null
    form.amount = 0
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function verify(row) {
  try {
    await verifyPayment(row.id)
    ElMessage.success('Payment verified')
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
