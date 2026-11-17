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
        <ListToolbar
          v-model:search="search"
          :search-placeholder="t('common.searchPlaceholder')"
          @search="onSearchInput"
        >
          <el-select
            v-model="filters.status"
            clearable
            :placeholder="t('common.status')"
            style="width: 180px"
            @change="onFilterChange"
          >
            <el-option :label="t('common.all')" value="" />
            <el-option v-for="s in reservationStatuses" :key="s" :label="statusLabel(t, s)" :value="s" />
          </el-select>
        </ListToolbar>
        <el-table :data="rows" v-loading="loading" stripe>
          <el-table-column prop="title" :label="t('reservations.titleField')" min-width="160">
            <template #default="{ row }">{{ row.title || '—' }}</template>
          </el-table-column>
          <el-table-column prop="customer_name" :label="t('common.customer')" min-width="160" />
          <el-table-column :label="t('reservations.date')" width="120">
            <template #default="{ row }"><JalaliText :value="row.slot?.date" /></template>
          </el-table-column>
          <el-table-column :label="t('reservations.time')" width="150">
            <template #default="{ row }">{{ formatTimeRange(row.slot?.start_time, row.slot?.end_time) }}</template>
          </el-table-column>
          <el-table-column :label="t('common.created')" width="150">
            <template #default="{ row }"><JalaliText :value="row.created_at" mode="datetime" /></template>
          </el-table-column>
          <el-table-column prop="status" :label="t('common.status')" width="140">
            <template #default="{ row }"><el-tag :type="tagType(row.status)">{{ statusLabel(t, row.status) }}</el-tag></template>
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
        <ListPagination
          :total="total"
          :page="page"
          :page-size="pageSize"
          @page-change="onPageChange"
          @size-change="onSizeChange"
        />
      </el-tab-pane>

      <!-- SLOTS -->
      <el-tab-pane :label="t('reservations.slots')">
        <el-alert type="success" :closable="false" class="slot-auto-hint" show-icon style="margin-bottom: 12px">
          <template #title>
            <span>{{ t('reservations.autoSlotsHint') }}</span>
          </template>
        </el-alert>
        <div style="margin-bottom: 12px; display: flex; gap: 8px; justify-content: space-between; flex-wrap: wrap; align-items: center">
          <ListToolbar
            v-model:search="slotSearch"
            :search-placeholder="t('common.searchPlaceholder')"
            @search="onSlotSearchInput"
            style="margin-bottom: 0; flex: 1"
          >
            <el-select
              v-model="slotFilters.facility"
              clearable
              filterable
              :placeholder="t('monitoring.facility')"
              style="width: 180px"
              @change="onSlotFilterChange"
            >
              <el-option v-for="f in facilities" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
            <el-select
              v-model="slotFilters.blocked"
              clearable
              :placeholder="t('reservations.blocked')"
              style="width: 140px"
              @change="onSlotFilterChange"
            >
              <el-option :label="t('common.all')" value="" />
              <el-option :label="boolLabel(t, true)" :value="true" />
              <el-option :label="boolLabel(t, false)" :value="false" />
            </el-select>
          </ListToolbar>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <el-button v-if="auth.hasPerm('slot.manage')" @click="doGenerateHorizon" :loading="horizonLoading">
              {{ t('reservations.generateUpcoming') }}
            </el-button>
            <el-button v-if="auth.hasPerm('slot.manage')" type="primary" @click="genDialog = true">
              <el-icon><Calendar /></el-icon>&nbsp;{{ t('reservations.generateOneDay') }}
            </el-button>
          </div>
        </div>
        <el-table :data="slots" v-loading="slotsLoading" stripe>
          <el-table-column prop="facility_name" :label="t('monitoring.facility')" min-width="150" />
          <el-table-column :label="t('reservations.date')" width="130">
            <template #default="{ row }"><JalaliText :value="row.date" /></template>
          </el-table-column>
          <el-table-column :label="t('reservations.time')" width="160">
            <template #default="{ row }">{{ formatTimeRange(row.start_time, row.end_time) }}</template>
          </el-table-column>
          <el-table-column :label="t('reservations.bookedCapacity')" width="160">
            <template #default="{ row }">{{ row.booked_count }} / {{ row.capacity }}</template>
          </el-table-column>
          <el-table-column prop="blocked" :label="t('reservations.blocked')" width="100">
            <template #default="{ row }"><el-tag :type="row.blocked ? 'danger' : 'info'">{{ boolLabel(t, row.blocked) }}</el-tag></template>
          </el-table-column>
        </el-table>
        <ListPagination
          :total="slotsTotal"
          :page="slotsPage"
          :page-size="slotsPageSize"
          @page-change="onSlotsPageChange"
          @size-change="onSlotsSizeChange"
        />
      </el-tab-pane>

      <!-- SCHEDULE -->
      <el-tab-pane :label="t('reservations.addDaySchedule')">
        <div style="margin-bottom: 12px; display: flex; gap: 8px; justify-content: space-between; flex-wrap: wrap; align-items: center">
          <ListToolbar
            v-model:search="schedSearch"
            :show-search="false"
            style="margin-bottom: 0; flex: 1"
          >
            <el-select
              v-model="schedFilters.facility"
              clearable
              filterable
              :placeholder="t('monitoring.facility')"
              style="width: 180px"
              @change="onSchedFilterChange"
            >
              <el-option v-for="f in facilities" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </ListToolbar>
          <el-button v-if="auth.hasPerm('slot.manage')" type="primary" @click="schedDialog = true">
            <el-icon><Plus /></el-icon>&nbsp;{{ t('reservations.addDaySchedule') }}
          </el-button>
        </div>
        <el-table :data="schedules" v-loading="schedLoading" stripe>
          <el-table-column prop="facility_name" :label="t('monitoring.facility')" min-width="150" />
          <el-table-column :label="t('reservations.date')" width="130">
            <template #default="{ row }"><JalaliText :value="row.date" /></template>
          </el-table-column>
          <el-table-column :label="t('common.open')" width="100">
            <template #default="{ row }"><el-tag :type="row.is_open ? 'success' : 'danger'">{{ openLabel(t, row.is_open) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="capacity" :label="t('common.capacity')" width="110" />
          <el-table-column :label="t('common.hours')" width="170">
            <template #default="{ row }">{{ formatTimeRange(row.start_time, row.end_time) }}</template>
          </el-table-column>
          <el-table-column :label="t('common.actions')" width="110" align="right">
            <template #default="{ row }">
              <el-button v-if="auth.hasPerm('slot.manage')" size="small" type="danger" plain @click="removeSchedule(row)">{{ t('common.delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
        <ListPagination
          :total="schedTotal"
          :page="schedPage"
          :page-size="schedPageSize"
          @page-change="onSchedPageChange"
          @size-change="onSchedSizeChange"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- New reservation -->
    <el-dialog v-model="newDialog" :title="t('reservations.newReservation')" width="480px" @closed="resetNewForm">
      <el-form label-position="top">
        <el-form-item :label="t('reservations.titleField')">
          <el-input v-model="form.title" :placeholder="t('reservations.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('reservations.date')">
          <JalaliDatePicker v-model="form.date" @update:modelValue="onBookDateChange" />
        </el-form-item>
        <el-form-item v-if="form.date" :label="t('reservations.time')">
          <div v-loading="daySlotsLoading" class="time-grid">
            <el-empty
              v-if="!daySlotsLoading && !daySlots.length"
              :description="t('reservations.noTimesThatDay')"
              :image-size="64"
            />
            <el-button
              v-for="s in daySlots"
              :key="s.id"
              size="default"
              :type="form.slot === s.id ? 'primary' : 'default'"
              :disabled="!s.available"
              class="time-chip"
              @click="form.slot = s.id"
            >
              {{ formatTimeRange(s.start_time, s.end_time) }}
              <span class="time-left">({{ Math.max(0, (s.capacity || 0) - (s.booked_count || 0)) }} {{ t('reservations.left') }})</span>
            </el-button>
          </div>
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
        <el-form-item :label="t('common.amount')">
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
        <el-form-item :label="t('common.open')">
          <el-switch v-model="schedForm.is_open" />
        </el-form-item>
        <el-form-item :label="t('reservations.capacityPerSlot')">
          <el-input-number v-model="schedForm.capacity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="t('common.note')">
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
import {
  approveReservation, cancelReservation, createReservation, createSchedule, deleteSchedule,
  generateSlotHorizon, generateSlots, listFacilities, listReservations, listSchedules, listSlots,
  rejectReservation
} from '../api/reservations'
import { createPayment } from '../api/payments'
import ListPagination from '../components/ListPagination.vue'
import ListToolbar from '../components/ListToolbar.vue'
import { useServerList } from '../composables/useServerList'
import { useAuthStore } from '../store/auth'
import { formatTimeRange } from '../utils/jalali'
import { boolLabel, openLabel, statusLabel } from '../utils/labels'

const { t } = useI18n()
const auth = useAuthStore()

const reservationStatuses = [
  'pending', 'confirmed', 'rejected', 'arrived', 'weighed', 'cancelled', 'expired',
]

const {
  rows, loading, total, page, pageSize, search, filters,
  load: loadReservationsList, onSearchInput, onFilterChange, onPageChange, onSizeChange,
} = useServerList(listReservations, { immediate: false })
filters.status = ''

const {
  rows: slots, loading: slotsLoading, total: slotsTotal, page: slotsPage, pageSize: slotsPageSize,
  search: slotSearch, filters: slotFilters,
  load: loadSlotsList, onSearchInput: onSlotSearchInput, onFilterChange: onSlotFilterChange,
  onPageChange: onSlotsPageChange, onSizeChange: onSlotsSizeChange,
} = useServerList(listSlots, { immediate: false })
slotFilters.facility = ''
slotFilters.blocked = ''

const {
  rows: schedules, loading: schedLoading, total: schedTotal, page: schedPage, pageSize: schedPageSize,
  search: schedSearch, filters: schedFilters,
  load: loadSchedulesList, onFilterChange: onSchedFilterChange,
  onPageChange: onSchedPageChange, onSizeChange: onSchedSizeChange,
} = useServerList(listSchedules, { immediate: false })
schedFilters.facility = ''

const daySlots = ref([])
const daySlotsLoading = ref(false)
const facilities = ref([])

const newDialog = ref(false)
const form = reactive({ title: '', date: '', slot: null })

const payDialog = ref(false)
const payAmount = ref(0)
const createdReservation = ref(null)

const genDialog = ref(false)
const genFacility = ref(null)
const genDate = ref('')
const horizonLoading = ref(false)

const schedDialog = ref(false)
const schedForm = reactive({ facility: null, date: '', is_open: true, capacity: 2, note: '' })

const errMsg = (e) => e.response?.data?.error?.message || t('common.operationFailed')

async function load() {
  await Promise.all([loadReservationsList(), loadSlotsList(), loadSchedulesList()])
}

async function loadFacilities() {
  try {
    facilities.value = (await listFacilities()).results || []
  } catch (e) {
    facilities.value = []
  }
}

function resetNewForm() {
  form.title = ''
  form.date = ''
  form.slot = null
  daySlots.value = []
}

async function onBookDateChange(date) {
  form.slot = null
  daySlots.value = []
  if (!date) return
  daySlotsLoading.value = true
  try {
    const data = await listSlots({ date, blocked: false })
    const list = data.results || data || []
    daySlots.value = list
      .filter((s) => s.available !== false)
      .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')))
  } catch (e) {
    daySlots.value = []
    ElMessage.error(errMsg(e))
  } finally {
    daySlotsLoading.value = false
  }
}

async function create() {
  try {
    const reservation = await createReservation({ slot: form.slot, title: form.title })
    ElMessage.success(t('reservations.createdPending'))
    newDialog.value = false
    createdReservation.value = reservation
    payAmount.value = 0
    payDialog.value = true
    resetNewForm()
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function payNow() {
  try {
    const result = await createPayment({ reservation: createdReservation.value.id, amount: payAmount.value })
    ElMessage.success(t('reservations.paymentRequested', { url: result.redirect_url }))
    payDialog.value = false
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function approve(row) {
  try {
    await approveReservation(row.id)
    ElMessage.success(t('reservations.approvedSms'))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function reject(row) {
  try {
    await ElMessageBox.confirm(t('reservations.confirmReject'), t('common.confirmAction'), { type: 'warning' })
    await rejectReservation(row.id)
    ElMessage.success(t('reservations.rejected'))
    load()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(errMsg(e))
  }
}

async function cancel(row) {
  try {
    await cancelReservation(row.id)
    ElMessage.success(t('reservations.cancelled'))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function doGenerate() {
  try {
    const result = await generateSlots(genFacility.value, genDate.value)
    ElMessage.success(t('reservations.slotsCreated', { count: result.created }))
    genDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function doGenerateHorizon() {
  horizonLoading.value = true
  try {
    const result = await generateSlotHorizon()
    ElMessage.success(t('reservations.horizonCreated', { count: result.created, days: result.days }))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  } finally {
    horizonLoading.value = false
  }
}

async function saveSchedule() {
  try {
    await createSchedule({ ...schedForm })
    ElMessage.success(t('reservations.scheduleSaved'))
    schedDialog.value = false
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function removeSchedule(row) {
  try {
    await deleteSchedule(row.id)
    ElMessage.success(t('reservations.deleted'))
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
.time-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 48px;
}
.time-chip {
  margin: 0;
}
.time-left {
  margin-inline-start: 6px;
  opacity: 0.75;
  font-size: 12px;
}
</style>
