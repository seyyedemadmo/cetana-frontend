<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.reservations') }}</h2>
      <el-button type="primary" @click="newDialog = true">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('reservations.newReservation') }}
      </el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.reservations') }}</span>
      </template>
    </el-alert>

    <el-tabs>
      <!-- RESERVATIONS -->
      <el-tab-pane :label="t('reservations.title')">
        <el-table :data="rows" v-loading="loading" stripe>
          <el-table-column prop="title" :label="t('reservations.titleField')" min-width="160">
            <template #default="{ row }">{{ row.title || '—' }}</template>
          </el-table-column>
          <el-table-column prop="customer_name" label="Customer" min-width="160" />
          <el-table-column :label="t('reservations.date')" width="120">
            <template #default="{ row }">{{ fmtDate(row.slot?.date) || '—' }}</template>
          </el-table-column>
          <el-table-column :label="t('reservations.time')" width="150">
            <template #default="{ row }">{{ fmtTimeRange(row.slot?.start_time, row.slot?.end_time) }}</template>
          </el-table-column>
          <el-table-column prop="status" :label="t('common.status')" width="140">
            <template #default="{ row }"><el-tag :type="tagType(row.status)">{{ row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" min-width="260" align="right">
            <template #default="{ row }">
              <template v-if="auth.hasPerm('reservation.approve')">
                <el-button size="small" type="success" :disabled="row.status !== 'pending'" @click="approve(row)">{{ t('btn.approve') }}</el-button>
                <el-button size="small" type="warning" plain :disabled="!['pending','confirmed'].includes(row.status)" @click="reject(row)">{{ t('btn.reject') }}</el-button>
              </template>
              <el-button size="small" type="danger" plain :disabled="['cancelled','rejected'].includes(row.status)" @click="cancel(row)">{{ t('common.cancel') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- SLOTS -->
      <el-tab-pane label="Slots">
        <div style="margin-bottom: 12px; text-align: right">
          <el-button v-if="auth.hasPerm('slot.manage')" type="primary" @click="genDialog = true">
            <el-icon><Calendar /></el-icon>&nbsp;{{ t('reservations.generateSlots') }}
          </el-button>
        </div>
        <el-table :data="slots" v-loading="loading" stripe>
          <el-table-column prop="facility_name" :label="t('monitoring.facility')" min-width="150" />
          <el-table-column :label="t('reservations.date')" width="130">
            <template #default="{ row }">{{ fmtDate(row.date) || '—' }}</template>
          </el-table-column>
          <el-table-column :label="t('reservations.time')" width="160">
            <template #default="{ row }">{{ fmtTimeRange(row.start_time, row.end_time) }}</template>
          </el-table-column>
          <el-table-column label="Booked / Capacity" width="160">
            <template #default="{ row }">{{ row.booked_count }} / {{ row.capacity }}</template>
          </el-table-column>
          <el-table-column prop="blocked" label="Blocked" width="100">
            <template #default="{ row }"><el-tag :type="row.blocked ? 'danger' : 'info'">{{ row.blocked }}</el-tag></template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- SCHEDULE -->
      <el-tab-pane :label="t('reservations.addDaySchedule')">
        <div style="margin-bottom: 12px; text-align: right">
          <el-button v-if="auth.hasPerm('slot.manage')" type="primary" @click="schedDialog = true">
            <el-icon><Plus /></el-icon>&nbsp;{{ t('reservations.addDaySchedule') }}
          </el-button>
        </div>
        <el-table :data="schedules" v-loading="loading" stripe>
          <el-table-column prop="facility_name" :label="t('monitoring.facility')" min-width="150" />
          <el-table-column :label="t('reservations.date')" width="130">
            <template #default="{ row }">{{ fmtDate(row.date) || '—' }}</template>
          </el-table-column>
          <el-table-column label="Open" width="100">
            <template #default="{ row }"><el-tag :type="row.is_open ? 'success' : 'danger'">{{ row.is_open ? 'Open' : 'Closed' }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="capacity" label="Capacity" width="110" />
          <el-table-column label="Hours" width="170">
            <template #default="{ row }">{{ fmtTimeRange(row.start_time, row.end_time) }}</template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="110" align="right">
            <template #default="{ row }">
              <el-button v-if="auth.hasPerm('slot.manage')" size="small" type="danger" plain @click="removeSchedule(row)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- New reservation -->
    <el-dialog v-model="newDialog" :title="t('reservations.newReservation')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="t('reservations.titleField')">
          <el-input v-model="form.title" :placeholder="t('reservations.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('reservations.selectSlot')">
          <el-select v-model="form.slot" :placeholder="t('reservations.selectSlot')" style="width: 100%">
            <el-option
              v-for="s in slots"
              :key="s.id"
              :label="`${fmtDate(s.date)} · ${fmtTime(s.start_time)} (${s.capacity - s.booked_count} left)`"
              :value="s.id"
              :disabled="!s.available"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!form.slot" @click="create">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Payment for reservation -->
    <el-dialog v-model="payDialog" :title="t('reservations.payForReservation')" width="420px">
      <p style="color: var(--el-text-color-secondary)">
        {{ t('reservations.payForReservation') }}
      </p>
      <el-form label-position="top">
        <el-form-item label="Amount">
          <el-input-number v-model="payAmount" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialog = false">{{ t('common.skip') }}</el-button>
        <el-button type="primary" @click="payNow">{{ t('common.pay') }}</el-button>
      </template>
    </el-dialog>

    <!-- Generate slots -->
    <el-dialog v-model="genDialog" :title="t('reservations.generateSlots')" width="460px">
      <el-form label-position="top">
        <el-form-item :label="t('reservations.selectFacility')">
          <el-select v-model="genFacility" :placeholder="t('reservations.selectFacility')" style="width: 100%">
            <el-option v-for="f in facilities" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('reservations.date')">
          <JalaliDatePicker v-model="genDate" />
        </el-form-item>
        <el-alert type="info" :closable="false" :title="t('reservations.generateSlotsHint')" />
      </el-form>
      <template #footer>
        <el-button @click="genDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!genFacility || !genDate" @click="doGenerate">{{ t('common.generate') }}</el-button>
      </template>
    </el-dialog>

    <!-- Add schedule -->
    <el-dialog v-model="schedDialog" :title="t('reservations.addDaySchedule')" width="460px">
      <el-form label-position="top">
        <el-form-item :label="t('reservations.selectFacility')">
          <el-select v-model="schedForm.facility" :placeholder="t('reservations.selectFacility')" style="width: 100%">
            <el-option v-for="f in facilities" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('reservations.date')">
          <JalaliDatePicker v-model="schedForm.date" />
        </el-form-item>
        <el-form-item label="Open">
          <el-switch v-model="schedForm.is_open" />
        </el-form-item>
        <el-form-item label="Capacity per slot">
          <el-input-number v-model="schedForm.capacity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Note">
          <el-input v-model="schedForm.note" :placeholder="t('reservations.notePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="schedDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :disabled="!schedForm.facility || !schedForm.date" @click="saveSchedule">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import {
  approveReservation, cancelReservation, createReservation, createSchedule, deleteSchedule,
  generateSlots, listFacilities, listReservations, listSchedules, listSlots,
  rejectReservation
} from '../api/reservations'
import { createPayment } from '../api/payments'
import JalaliDatePicker from '../components/JalaliDatePicker.vue'
import { formatJalaliDate as fmtDate, formatTime as fmtTime, formatTimeRange as fmtTimeRange } from '../utils/jalali'

const { t } = useI18n()
const auth = useAuthStore()

const rows = ref([])
const slots = ref([])
const facilities = ref([])
const schedules = ref([])
const loading = ref(false)

const newDialog = ref(false)
const form = reactive({ title: '', slot: null })

const payDialog = ref(false)
const payAmount = ref(0)
const createdReservation = ref(null)

const genDialog = ref(false)
const genFacility = ref(null)
const genDate = ref('')

const schedDialog = ref(false)
const schedForm = reactive({ facility: null, date: '', is_open: true, capacity: 2, note: '' })

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

async function load() {
  loading.value = true
  try {
    rows.value = (await listReservations()).results || []
    slots.value = (await listSlots()).results || []
    schedules.value = (await listSchedules()).results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadFacilities() {
  try {
    facilities.value = (await listFacilities()).results || []
  } catch (e) {
    facilities.value = []
  }
}

async function create() {
  try {
    const reservation = await createReservation({ slot: form.slot, title: form.title })
    ElMessage.success('Reservation created (pending approval)')
    newDialog.value = false
    createdReservation.value = reservation
    payAmount.value = 0
    payDialog.value = true
    form.title = ''
    form.slot = null
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function payNow() {
  try {
    const result = await createPayment({ reservation: createdReservation.value.id, amount: payAmount.value })
    ElMessage.success(`Payment requested · ${result.redirect_url}`)
    payDialog.value = false
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function approve(row) {
  try {
    await approveReservation(row.id)
    ElMessage.success('Approved — SMS sent to customer')
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function reject(row) {
  try {
    await ElMessageBox.confirm(t('reservations.confirmReject'), t('common.confirmAction'), { type: 'warning' })
    await rejectReservation(row.id)
    ElMessage.success('Rejected')
    load()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e))
  }
}

async function cancel(row) {
  try {
    await cancelReservation(row.id)
    ElMessage.success('Cancelled')
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function doGenerate() {
  try {
    const result = await generateSlots(genFacility.value, genDate.value)
    ElMessage.success(`${result.created} slot(s) created`)
    genDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function saveSchedule() {
  try {
    await createSchedule({ ...schedForm })
    ElMessage.success('Schedule saved')
    schedDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function removeSchedule(row) {
  try {
    await deleteSchedule(row.id)
    ElMessage.success('Deleted')
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

function tagType(status) {
  return {
    confirmed: 'success', pending: 'warning', rejected: 'danger',
    cancelled: 'info', weighed: 'primary', arrived: 'primary'
  }[status] || 'info'
}

onMounted(() => {
  load()
  loadFacilities()
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
