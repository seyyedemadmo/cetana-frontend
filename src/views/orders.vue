<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.orders') }}</h2>
      <el-button v-if="auth.hasPerm('reservation.create')" type="primary" @click="newDialog = true">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('orders.newOrder') }}
      </el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.orders') }}</span>
      </template>
    </el-alert>

    <el-empty :description="t('orders.emptyHint')" v-if="!loading && !rows.length" />
    <el-table :data="rows" v-loading="loading" stripe v-else>
      <el-table-column prop="order_number" :label="t('common.order')" width="180" />
      <el-table-column prop="status" :label="t('common.status')" width="160">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ orderStatusLabel(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('orders.netKg')" width="110">
        <template #default="{ row }">{{ row.net_weight_kg ?? '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.total')" width="160">
        <template #default="{ row }">{{ row.price_snapshot?.total ? `${row.price_snapshot.total} ${row.currency}` : '—' }}</template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" min-width="320" align="right">
        <template #default="{ row }">
          <el-button v-if="auth.hasPerm('weighing.create') && !row.net_weight_kg" size="small" type="primary" @click="openWeigh(row)">
            {{ t('orders.stepWeigh') }}
          </el-button>
          <el-button
            v-if="auth.hasPerm('order.select') && row.net_weight_kg && row.status !== 'processing' && row.status !== 'completed'"
            size="small"
            type="primary"
            @click="openSelect(row)"
          >
            {{ t('orders.stepChooseServices') }}
          </el-button>
          <el-button
            v-if="auth.hasPerm('order.confirm') && row.status === 'awaiting_confirmation'"
            size="small"
            type="success"
            @click="confirm(row)"
          >
            {{ t('orders.stepConfirm') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="newDialog" :title="t('orders.newOrder')" width="480px">
      <p class="hint">{{ t('orders.newOrderHint') }}</p>
      <el-select v-model="newReservation" :placeholder="t('orders.selectReservation')" style="width: 100%">
        <el-option v-for="r in reservations" :key="r.id" :label="reservationLabel(r)" :value="r.id" />
      </el-select>
      <template #footer>
        <el-button @click="newDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!newReservation" @click="create">{{ t('common.create') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="weighDialog" :title="t('orders.stepWeigh')" width="420px">
      <p class="hint">{{ t('orders.weighHint') }}</p>
      <el-form label-position="top">
        <el-form-item :label="t('orders.grossWeight')"><el-input-number v-model="weighForm.gross" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item :label="t('orders.tareWeight')"><el-input-number v-model="weighForm.tare" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="weighDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitWeigh">{{ t('orders.saveWeight') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="selectDialog" :title="t('orders.stepChooseServices')" width="520px">
      <p class="hint">{{ t('orders.servicesHint') }}</p>
      <el-checkbox-group v-model="selectedKeys">
        <div v-for="s in steps" :key="s.key" class="service-row">
          <el-checkbox :value="s.key" :disabled="s.required">
            {{ stepLabel(t, s.key, s.name) }}
            <span v-if="s.required" class="req"> ({{ t('orders.requiredService') }})</span>
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <div v-if="priceResult" class="price-box">
        <div v-for="(line, idx) in priceResult.lines || []" :key="idx" class="price-line">
          <span>{{ formatPriceLine(line) }}</span>
          <span>{{ line.amount }} {{ priceResult.currency }}</span>
        </div>
        <div class="price-line muted"><span>{{ t('orders.subtotal') }}</span><span>{{ priceResult.subtotal }} {{ priceResult.currency }}</span></div>
        <div class="price-line muted"><span>{{ t('orders.discount') }}</span><span>{{ priceResult.discounts }} {{ priceResult.currency }}</span></div>
        <div class="price-line muted"><span>{{ t('orders.tax') }}</span><span>{{ priceResult.taxes }} {{ priceResult.currency }}</span></div>
        <div class="price-total">
          <strong>{{ t('orders.estimatedTotal') }}</strong>
          <strong>{{ priceResult.total }} {{ priceResult.currency }}</strong>
        </div>
        <p class="hint">{{ t('orders.priceLockHint') }}</p>
      </div>
      <template #footer>
        <el-button @click="selectDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitSelect">{{ t('orders.saveServices') }}</el-button>
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
import { useAuthStore } from '../store/auth'
import { formatJalaliDate, formatTime } from '../utils/jalali'
import { statusLabel, stepLabel } from '../utils/labels'

const { t } = useI18n()
const auth = useAuthStore()
const rows = ref([])
const reservations = ref([])
const loading = ref(false)

function reservationLabel(r) {
  return `${formatJalaliDate(r.slot?.date) || '—'} ${formatTime(r.slot?.start_time) || '—'} · ${statusLabel(t, r.status)}`
}

const newDialog = ref(false)
const newReservation = ref(null)
const weighDialog = ref(false)
const weighForm = reactive({ gross: 0, tare: 0 })
const selectDialog = ref(false)
const steps = ref([])
const selectedKeys = ref([])
const priceResult = ref(null)
const currentOrder = ref(null)

const errMsg = (e) => e.response?.data?.error?.message || t('common.operationFailed')

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
    reservations.value = (data.results || []).filter((r) => r.status === 'confirmed' || r.status === 'arrived' || r.status === 'weighed')
  } catch (e) {
    reservations.value = []
  }
}

async function create() {
  try {
    await createOrder({ reservation: newReservation.value })
    ElMessage.success(t('orders.orderCreated'))
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
    ElMessage.success(t('orders.weightSaved'))
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
    const data = await listSteps(row.workflow_version, { kind: 'service' })
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
    ElMessage.success(t('orders.servicesSaved'))
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

function orderStatusLabel(status) {
  const specific = t(`orders.status.${status}`)
  if (specific !== `orders.status.${status}`) return specific
  return statusLabel(t, status)
}

function formatPriceLine(line) {
  const name = line.rule || line.step_key || t('orders.lineItem')
  if (line.kind === 'per_kg') {
    return t('orders.linePerKg', { name, qty: line.quantity, unit: line.unit_price })
  }
  if (line.kind === 'discount') return t('orders.lineDiscount', { name })
  if (line.kind === 'tax') return t('orders.lineTax', { name })
  return name
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
.help-text { font-size: 14px; line-height: 1.6; color: var(--el-color-primary-dark-2); }
.hint { color: var(--el-text-color-secondary); margin: 0 0 12px; line-height: 1.5; }
.service-row { margin-bottom: 8px; }
.req { color: var(--el-color-primary); }
.price-box {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.price-line, .price-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.price-total { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--el-border-color); }
.price-line.muted { color: var(--el-text-color-secondary); font-size: 13px; }
</style>
