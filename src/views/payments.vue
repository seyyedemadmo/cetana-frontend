<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.payments') }}</h2>
      <el-button type="primary" @click="dialog = true"><el-icon><Plus /></el-icon>&nbsp;{{ t('payments.newPayment') }}</el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.payments') }}</span>
      </template>
    </el-alert>

    <ListToolbar
      v-model:search="search"
      :search-placeholder="t('common.searchPlaceholder')"
      @search="onSearchInput"
    >
      <el-select
        v-model="filters.status"
        clearable
        :placeholder="t('common.status')"
        style="width: 160px"
        @change="onFilterChange"
      >
        <el-option :label="t('common.all')" value="" />
        <el-option v-for="s in paymentStatuses" :key="s" :label="statusLabel(t, s)" :value="s" />
      </el-select>
    </ListToolbar>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="transaction_id" :label="t('payments.transaction')" min-width="180" />
      <el-table-column prop="gateway" :label="t('payments.gateway')" width="120" />
      <el-table-column prop="amount" :label="t('common.amount')" width="140" />
      <el-table-column prop="currency" :label="t('common.currency')" width="90" />
      <el-table-column prop="status" :label="t('common.status')" width="130">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(t, row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('payments.requestTime')" width="150">
        <template #default="{ row }"><JalaliText :value="row.request_time || row.created_at" mode="datetime" /></template>
      </el-table-column>
      <el-table-column :label="t('payments.verifiedAt')" width="150">
        <template #default="{ row }"><JalaliText :value="row.verification_time" mode="datetime" /></template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="120" align="right">
        <template #default="{ row }">
          <el-button size="small" :disabled="row.status === 'success'" @click="verify(row)">{{ t('btn.verify') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ListPagination
      :total="total"
      :page="page"
      :page-size="pageSize"
      @page-change="onPageChange"
      @size-change="onSizeChange"
    />

    <el-dialog v-model="dialog" :title="t('payments.newPayment')" width="460px">
      <el-form label-position="top">
        <el-form-item :label="t('common.order')">
          <el-select v-model="form.order" filterable :placeholder="t('payments.selectOrder')" style="width: 100%">
            <el-option v-for="o in orders" :key="o.id" :label="o.order_number" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.amount')">
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
import { createPayment, listPayments, verifyPayment } from '../api/payments'
import { listOrders } from '../api/orders'
import ListPagination from '../components/ListPagination.vue'
import ListToolbar from '../components/ListToolbar.vue'
import { useServerList } from '../composables/useServerList'
import { statusLabel } from '../utils/labels'

const { t } = useI18n()
const paymentStatuses = ['pending', 'success', 'failed', 'cancelled']
const orders = ref([])
const dialog = ref(false)
const form = reactive({ order: null, amount: 0 })

const {
  rows, loading, total, page, pageSize, search, filters,
  load, onSearchInput, onFilterChange, onPageChange, onSizeChange,
} = useServerList(listPayments, { immediate: false })
filters.status = ''

const errMsg = (e) => e.response?.data?.error?.message || t('common.operationFailed')

async function loadOrders() {
  try {
    const data = await listOrders({ page_size: 200 })
    orders.value = data.results || []
  } catch (e) {
    orders.value = []
  }
}

async function create() {
  try {
    await createPayment({ order: form.order, amount: form.amount })
    ElMessage.success(t('payments.newPayment'))
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
    ElMessage.success(t('btn.verify'))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

function statusType(status) {
  return { success: 'success', pending: 'warning', failed: 'danger', cancelled: 'info' }[status] || 'info'
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
