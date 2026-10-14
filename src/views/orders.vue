<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.orders') }}</h2>
      <el-button type="primary" @click="newDialog = true"><el-icon><Plus /></el-icon>&nbsp;{{ t('orders.newOrder') }}</el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.orders') }}</span>
      </template>
    </el-alert>

    <el-empty :description="t('common.noData')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="order_number" label="Order" width="180" />
      <el-table-column prop="status" :label="t('common.status')" width="150">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template>
      </el-table-column>
      <el-table-column label="Net (kg)" width="110">
        <template #default="{ row }">{{ row.net_weight_kg ?? '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.total')" width="160">
        <template #default="{ row }">{{ row.price_snapshot?.total ? `${row.price_snapshot.total} ${row.currency}` : '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" min-width="280" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="openWeigh(row)">{{ t('btn.weigh') }}</el-button>
          <el-button size="small" @click="openSelect(row)">{{ t('btn.steps') }}</el-button>
          <el-button size="small" type="success" :disabled="row.status !== 'awaiting_confirmation'" @click="confirm(row)">{{ t('btn.confirm') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- New order -->
    <el-dialog v-model="newDialog" :title="t('orders.newOrder')" width="480px">
      <el-select v-model="newReservation" :placeholder="t('orders.selectReservation')" style="width: 100%">
        <el-option v-for="r in reservations" :key="r.id" :label="`${fmtDate(r.slot?.date)} ${fmtTime(r.slot?.start_time)} · ${r.status}`" :value="r.id" />
      </el-select>
      <template #footer>
        <el-button @click="newDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!newReservation" @click="create">{{ t('common.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- Weigh -->
    <el-dialog v-model="weighDialog" :title="t('orders.recordWeighing')" width="420px">
      <el-form label-position="top">
        <el-form-item label="Gross weight (kg)"><el-input-number v-model="weighForm.gross" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="Tare weight (kg)"><el-input-number v-model="weighForm.tare" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="weighDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitWeigh">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Select steps -->
    <el-dialog v-model="selectDialog" :title="t('orders.selectProcessingSteps')" width="460px">
      <el-checkbox-group v-model="selectedKeys">
        <div v-for="s in steps" :key="s.key" style="margin-bottom: 6px">
          <el-checkbox :value="s.key" :disabled="s.required">
            {{ s.name }}<span v-if="s.required" style="color: var(--el-color-primary)"> ({{ t('workflows.required') }})</span>
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <el-alert v-if="priceResult" type="success" :closable="false" style="margin-top: 14px"
        :title="`${t('common.total')}: ${priceResult.total} ${priceResult.currency}`" />
      <template #footer>
        <el-button @click="selectDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitSelect">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { confirmOrder, createOrder, listOrders, selectSteps, weighOrder } from '../api/orders'
import { listReservations } from '../api/reservations'
import { listSteps } from '../api/workflows'
import { formatJalaliDate as fmtDate, formatTime as fmtTime } from '../utils/jalali'

const { t } = useI18n()
const rows = ref([])
const reservations = ref([])
const loading = ref(false)

const newDialog = ref(false)
const newReservation = ref(null)

const weighDialog = ref(false)
const weighForm = reactive({ gross: 0, tare: 0 })

const selectDialog = ref(false)
const steps = ref([])
const selectedKeys = ref([])
const priceResult = ref(null)
const currentOrder = ref(null)

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

async function load() {
  loading.value = true
  try {
    const data = await listOrders()
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadReservations() {
  try {
    const data = await listReservations()
    reservations.value = data.results || []
  } catch (e) {
    reservations.value = []
  }
}

async function create() {
  try {
    await createOrder({ reservation: newReservation.value })
    ElMessage.success(t('orders.orderConfirmed'))
    newDialog.value = false
    newReservation.value = null
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

function openWeigh(row) {
  currentOrder.value = row
  weighForm.gross = 0
  weighForm.tare = 0
  weighDialog.value = true
}

async function submitWeigh() {
  try {
    await weighOrder(currentOrder.value.id, weighForm.gross, weighForm.tare)
    ElMessage.success(t('orders.recordWeighing'))
    weighDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function openSelect(row) {
  currentOrder.value = row
  selectedKeys.value = []
  priceResult.value = null
  try {
    const data = await listSteps(row.workflow_version)
    steps.value = data.results || []
    selectedKeys.value = steps.value.filter((s) => s.required).map((s) => s.key)
  } catch (e) {
    steps.value = []
  }
  selectDialog.value = true
}

async function submitSelect() {
  try {
    const order = await selectSteps(currentOrder.value.id, selectedKeys.value)
    priceResult.value = order.price_snapshot
    ElMessage.success(t('orders.selectProcessingSteps'))
    selectDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function confirm(row) {
  try {
    await confirmOrder(row.id)
    ElMessage.success(t('orders.orderConfirmed'))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

function statusType(status) {
  return { confirmed: 'success', completed: 'success', processing: 'primary', awaiting_confirmation: 'warning', cancelled: 'info', draft: 'info' }[status] || 'info'
}

onMounted(() => {
  load()
  loadReservations()
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
