<template>
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="POPOVER_WIDTH"
    trigger="click"
    popper-class="jalali-picker-popper"
    :teleported="true"
  >
    <template #reference>
      <el-input
        class="jalali-picker"
        :model-value="displayText"
        :placeholder="placeholder || t('jalali.pickDate')"
        :disabled="disabled"
        :clearable="clearable"
        readonly
        @clear="clear"
        @focus="onFocus"
        @keydown.enter.prevent="visible = !visible"
      >
        <template #prefix>
          <el-icon><Calendar /></el-icon>
        </template>
      </el-input>
    </template>

    <div class="jp" :dir="rtl ? 'rtl' : 'ltr'">
      <!-- header -->
      <div class="jp-header">
        <el-button-group>
          <el-button size="small" text :aria-label="t('jalali.previousYear')" @click="stepYear(-1)">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          <el-button size="small" text :aria-label="t('jalali.previousMonth')" @click="stepMonth(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </el-button-group>

        <span class="jp-title">
          {{ monthLabel }} {{ viewYear }}
        </span>

        <el-button-group>
          <el-button size="small" text :aria-label="t('jalali.nextMonth')" @click="stepMonth(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
          <el-button size="small" text :aria-label="t('jalali.nextYear')" @click="stepYear(1)">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>

      <!-- weekday row, Saturday first -->
      <div class="jp-grid jp-weekdays">
        <span v-for="(day, i) in weekdayHeaders" :key="i" class="jp-weekday">{{ day }}</span>
      </div>

      <!-- days -->
      <div class="jp-grid">
        <button
          v-for="cell in cells"
          :key="cell.key"
          type="button"
          class="jp-day"
          :class="{
            'is-outside': !cell.inMonth,
            'is-selected': cell.iso === modelValue,
            'is-today': cell.iso === todayIso
          }"
          :disabled="isDisabled(cell.iso)"
          @click="pick(cell)"
        >
          {{ cell.day }}
        </button>
      </div>

      <!-- footer -->
      <div class="jp-footer">
        <el-button size="small" text @click="pickToday">{{ t('jalali.today') }}</el-button>
        <el-button v-if="clearable" size="small" text @click="clear">{{ t('jalali.clear') }}</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
/**
 * Jalali calendar date picker.
 *
 * The model stays ISO Gregorian ("2026-03-21") because that is what the API
 * speaks — only the calendar the user picks from and the text they read are
 * Jalali. Keeping the wire format untouched means no API, filter or database
 * change is needed, and a date picked here round-trips through the parent
 * exactly as before.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  JALALI_WEEKDAY_HEADERS, PERSIAN_MONTHS,
  formatJalaliDate, isoFromJalali, jalaliMonthGrid, jalaliToday,
  shiftJalaliMonth, toIsoDate, toJalaliParts
} from '../utils/jalali'

const POPOVER_WIDTH = 288

const props = defineProps({
  /** ISO Gregorian "YYYY-MM-DD", or null/'' when empty. */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  /** (isoDateString) => boolean */
  disabledDate: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'change'])

const { t, locale } = useI18n()
const visible = ref(false)

/** Mirror the app locale so the grid's arrow order flips with the rest of the UI. */
const rtl = computed(() => locale.value === 'fa')

const todayIso = computed(() => {
  const t2 = jalaliToday()
  return isoFromJalali(t2.jy, t2.jm, t2.jd)
})

// --- What the trigger shows -------------------------------------------------
const displayText = computed(() => formatJalaliDate(props.modelValue) || '')

// --- Which month the grid is showing ---------------------------------------
// Falls back to today so opening an empty picker is never blank.
const selected = computed(() => toJalaliParts(props.modelValue))
const viewYear = ref(jalaliToday().jy)
const viewMonth = ref(jalaliToday().jm)

function syncViewToModel() {
  if (selected.value) {
    viewYear.value = selected.value.jy
    viewMonth.value = selected.value.jm
  } else {
    const now = jalaliToday()
    viewYear.value = now.jy
    viewMonth.value = now.jm
  }
}

// Re-centre whenever the model changes, so a value set from outside never
// leaves the grid parked on a stale month.
watch(() => props.modelValue, syncViewToModel, { immediate: true })

// Re-centre on open too: the "today" default above goes stale if the tab sits
// open across midnight.
watch(visible, (open) => { if (open) syncViewToModel() })

function onFocus() {
  visible.value = true
}

// --- Navigation -------------------------------------------------------------
function stepMonth(delta) {
  const next = shiftJalaliMonth(viewYear.value, viewMonth.value, delta)
  viewYear.value = next.jy
  viewMonth.value = next.jm
}

function stepYear(delta) {
  viewYear.value += delta
}

// --- Grid -------------------------------------------------------------------
// Month names and weekdays come from i18n so the calendar reads correctly in
// both locales; Persian is the fallback since these names belong to the
// calendar system rather than the UI language.
const monthLabel = computed(() => t(`jalali.months.${viewMonth.value}`) === `jalali.months.${viewMonth.value}`
  ? PERSIAN_MONTHS[viewMonth.value - 1]
  : t(`jalali.months.${viewMonth.value}`))

const weekdayHeaders = computed(() => JALALI_WEEKDAY_HEADERS)

const cells = computed(() => jalaliMonthGrid(viewYear.value, viewMonth.value).map((cell) => ({
  ...cell,
  iso: isoFromJalali(cell.jy, cell.jm, cell.jd)
})))

// --- Selection --------------------------------------------------------------
function isDisabled(iso) {
  if (props.disabled) return true
  return props.disabledDate ? Boolean(props.disabledDate(iso)) : false
}

function pick(cell) {
  if (isDisabled(cell.iso)) return
  emit('update:modelValue', cell.iso)
  emit('change', cell.iso)
  visible.value = false
}

function pickToday() {
  if (isDisabled(todayIso.value)) return
  emit('update:modelValue', todayIso.value)
  emit('change', todayIso.value)
  visible.value = false
}

function clear() {
  emit('update:modelValue', '')
  emit('change', '')
  visible.value = false
}

// `toIsoDate` is re-exported for parents that build defaults alongside the picker.
defineExpose({ toIsoDate })
</script>

<style scoped>
.jp {
  padding: 4px;
  user-select: none;
}

.jp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.jp-title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.jp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.jp-weekdays {
  margin-bottom: 4px;
}

.jp-weekday {
  text-align: center;
  font-size: 11px;
  line-height: 26px;
  color: var(--el-text-color-secondary);
}

.jp-day {
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.jp-day:hover:not(:disabled) {
  background: var(--el-fill-color-light);
}

.jp-day.is-outside {
  color: var(--el-text-color-placeholder);
}

/* Outline rather than a fill: a fill would collide with .is-today's ring. */
.jp-day.is-selected {
  background: var(--el-color-primary);
  color: #fff;
  font-weight: 600;
}

.jp-day.is-today:not(.is-selected) {
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
  color: var(--el-color-primary);
  font-weight: 600;
}

.jp-day:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
  text-decoration: line-through;
}

.jp-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--el-border-color-lighter);
}

:global(.jalali-picker-popper .el-popover__body) {
  padding: 8px;
}
</style>