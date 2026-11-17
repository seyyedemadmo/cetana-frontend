<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.invoices') }}</h2>
      <el-button type="primary" @click="dialog = true"><el-icon><Plus /></el-icon>&nbsp;{{ t('invoices.newInvoice') }}</el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.invoices') }}</span>
      </template>
    </el-alert>

    <ListToolbar
      v-model:search="search"
      :search-placeholder="t('common.searchPlaceholder')"
      @search="onSearchInput"
    >
      <el-select
        v-model="filters.sync_state"
        clearable
        :placeholder="t('invoices.syncState')"
        style="width: 180px"
        @change="onFilterChange"
      >
        <el-option :label="t('common.all')" value="" />
        <el-option v-for="s in syncStates" :key="s" :label="statusLabel(t, s)" :value="s" />
      </el-select>
    </ListToolbar>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="number" :label="t('common.number')" width="220" />
      <el-table-column prop="amount" :label="t('common.amount')" width="150" />
      <el-table-column prop="currency" :label="t('common.currency')" width="100" />
      <el-table-column prop="sync_state" :label="t('invoices.syncState')" width="150">
        <template #default="{ row }"><el-tag :type="row.sync_state === 'synchronized' ? 'success' : 'info'">{{ statusLabel(t, row.sync_state) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('common.created')" width="150">
        <template #default="{ row }"><JalaliText :value="row.created_at" mode="datetime" /></template>
      </el-table-column>
      <el-table-column :label="t('invoices.syncedAt')" width="150">
        <template #default="{ row }"><JalaliText :value="row.synced_at" mode="datetime" /></template>
      </el-table-column>
      <el-table-column prop="odoo_invoice_id" :label="t('invoices.odooId')" min-width="160">
        <template #default="{ row }">{{ row.odoo_invoice_id || '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="110" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="sync(row)">{{ t('btn.syncToOdoo') }}</el-button>
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

    <el-dialog v-model="dialog" :title="t('invoices.newInvoice')" width="460px">
      <el-select v-model="form.order" filterable :placeholder="t('invoices.selectOrder')" style="width: 100%">
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
import ListPagination from '../components/ListPagination.vue'
import ListToolbar from '../components/ListToolbar.vue'
import { useServerList } from '../composables/useServerList'
import { statusLabel } from '../utils/labels'

const { t } = useI18n()
const syncStates = ['pending', 'processing', 'synchronized', 'failed']
const orders = ref([])
const dialog = ref(false)
const form = reactive({ order: null })

const {
  rows, loading, total, page, pageSize, search, filters,
  load, onSearchInput, onFilterChange, onPageChange, onSizeChange,
} = useServerList(listInvoices, { immediate: false })
filters.sync_state = ''

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
    await createInvoice(form.order)
    ElMessage.success(t('invoices.newInvoice'))
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
    ElMessage.success(t('btn.syncToOdoo'))
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
