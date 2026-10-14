/**
 * Jalali (Shamsi / Persian) calendar helpers.
 *
 * The backend keeps speaking ISO-8601 Gregorian over the wire; every conversion
 * to Jalali happens here, at the edge of the UI. That keeps database values,
 * django-filter lookups and the Odoo integration untouched.
 *
 * Two rules the rest of the app depends on:
 *
 *  1. Date-only values ("2026-03-14") are parsed as *local* calendar fields, never
 *     via `new Date(value)`. That constructor reads them as UTC midnight, which in
 *     a negative-offset zone lands on the previous day and silently shifts every
 *     reservation by one.
 *  2. `JDate.toGregorian` returns a Date pinned to *local* midnight. Formatting it
 *     with `toISOString()` therefore yields the previous day east of UTC. Always go
 *     back through the local getters (`toIsoDate` below) instead.
 */

import JDate from 'jalali-date'

/** IANA zone every timestamp is rendered in. Kept in sync with backend TIME_ZONE. */
export const APP_TIME_ZONE = 'Asia/Tehran'

export const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

/** Weekday names indexed the way `Date#getDay()` does — Sunday first. */
export const PERSIAN_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

/**
 * Iran observes Saturday as the first day of the week, so `Date#getDay()` (Sunday
 * first) needs shifting by one to line up with the calendar grid.
 */
const saturdayFirst = (getDay) => (getDay + 1) % 7

/** Column headers for {@link jalaliMonthGrid}: Saturday through Friday. */
export const JALALI_WEEKDAY_HEADERS = PERSIAN_WEEKDAYS.slice(6).concat(PERSIAN_WEEKDAYS.slice(0, 6))

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

const pad2 = (n) => String(n).padStart(2, '0')

/** Render ASCII digits as Persian ones. */
export function toPersianDigits(input) {
  return String(input ?? '').replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)])
}

/** Is this value usable as a date at all? */
export function isValidDate(value) {
  if (!value) return false
  const d = value instanceof Date ? value : parseAnything(value)
  return Boolean(d) && !Number.isNaN(d.getTime?.() ?? d)
}

/**
 * Coerce the shapes the API hands back into a Date.
 *
 * Date-only strings are built from local components on purpose — see rule 1 above.
 * Datetime strings carry an offset, so the browser resolves them correctly as-is.
 */
function parseAnything(value) {
  if (value instanceof Date) return value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return new Date(Number(y), Number(m) - 1, Number(d))
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Break a timestamp into Gregorian fields *as seen in the app's time zone*.
 *
 * `Date` getters would answer in the viewer's zone, which may be Tehran, Berlin or
 * a CI runner in UTC. Anchoring to APP_TIME_ZONE keeps what users read consistent
 * with what the backend means by "today".
 */
export function zonedParts(value) {
  const date = parseAnything(value)
  if (!date || Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date)

  const get = (type) => Number(parts.find((p) => p.type === type)?.value)
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    // Intl renders midnight as hour 24 in some engines.
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second')
  }
}

/** `{jy, jm, jd}` for any date-ish value, evaluated in APP_TIME_ZONE. */
export function toJalaliParts(value) {
  const parts = zonedParts(value)
  if (!parts) return null

  // Anchor at local noon so a +/-12h difference in how JDate interprets the
  // intermediate Date can never roll the calendar day over.
  const anchor = new Date(parts.year, parts.month - 1, parts.day, 12)
  const [jy, jm, jd] = JDate.toJalali(anchor)
  return { jy, jm, jd }
}

/**
 * Gregorian `Date` pinned to local midnight for a given Jalali day.
 * Reads back safely with `toIsoDate`; never `.toISOString()` it.
 */
export function toGregorianDate(jy, jm, jd) {
  return JDate.toGregorian(jy, jm, jd)
}

/** `"YYYY-MM-DD"` Gregorian — the exact shape the API expects. */
export function toIsoDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim()
  }
  const d = typeof value === 'object' && value && typeof value.toIsoDate === 'function'
    ? value
    : parseAnything(value)
  if (!d || Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Inverse of {@link toIsoDate}: a Jalali (1-based) triple to ISO Gregorian. */
export function isoFromJalali(jy, jm, jd) {
  if (!jy || !jm || !jd) return ''
  const d = toGregorianDate(jy, jm, jd)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/**
 * Jalali rendering for tables, lists and detail panes.
 *
 * @param {string|Date} value   ISO date, ISO datetime, or Date
 * @param {{persianDigits?: boolean}} [opts]
 * @returns {string} e.g. `1404/12/23`, or `''` when the input is unusable
 */
export function formatJalaliDate(value, opts = {}) {
  const parts = toJalaliParts(value)
  if (!parts) return ''
  const out = `${parts.jy}/${pad2(parts.jm)}/${pad2(parts.jd)}`
  return opts.persianDigits ? toPersianDigits(out) : out
}

/** Jalali date plus Tehran wall-clock time: `1404/12/23 14:05`. */
export function formatJalaliDateTime(value, opts = {}) {
  const parts = zonedParts(value)
  if (!parts) return ''
  const out = `${formatJalaliDate(value, opts)} ${pad2(parts.hour)}:${pad2(parts.minute)}`
  return opts.persianDigits ? toPersianDigits(out) : out
}

/** `1404/12/23 08:00 – 09:00` from a pair of ISO datetimes. */
export function formatJalaliRange(from, to, opts = {}) {
  const start = formatJalaliDateTime(from, opts)
  const end = formatJalaliDateTime(to, opts)
  if (start && end) return `${start} – ${end}`
  return start || end || ''
}

/**
 * Clock-only fields, which are already wall-clock on the server.
 * Trims the seconds a backend `TimeField` always carries.
 */
export function formatTime(value) {
  if (!value) return ''
  const str = String(value)
  const match = /^(\d{1,2}):(\d{2})/.exec(str)
  return match ? `${pad2(match[1])}:${match[2]}` : str
}

/** Two times for a slot, e.g. `08:00 – 09:00`, or `—` when either is missing. */
export function formatTimeRange(from, to, placeholder = '—') {
  const start = formatTime(from)
  const end = formatTime(to)
  if (!start && !end) return placeholder
  return `${start || placeholder} – ${end || placeholder}`
}

/** Today in APP_TIME_ZONE, as a Jalali triple. */
export function jalaliToday() {
  return toJalaliParts(new Date())
}

/** Length of a 1-based Jalali month. */
export function daysInJalaliMonth(jy, jm) {
  return JDate.daysInMonth(jy, jm - 1)
}

/**
 * The 42 cells of a Jalali month grid, padded with the neighbouring months so
 * the calendar renders as a fixed rectangle. Each cell is `{jy, jm, jd, day,
 * inMonth}`; `key` is stable and unique.
 */
export function jalaliMonthGrid(jy, jm, weeks = 6) {
  const total = weeks * 7
  const first = toGregorianDate(jy, jm, 1)
  const lead = saturdayFirst(first.getDay())

  const cells = []
  for (let i = 0; i < total; i += 1) {
    // Local noon keeps the walk clear of DST edges.
    const day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i - lead, 12)
    const [cy, cm, cd] = JDate.toJalali(day)
    cells.push({
      key: `${cy}-${cm}-${cd}`,
      jy: cy,
      jm: cm,
      jd: cd,
      day: cd,
      inMonth: cy === jy && cm === jm
    })
  }
  return cells
}

/** Whether a Jalali (1-based) triple is a real date on the solar calendar. */
export function isValidJalali(jy, jm, jd) {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false
  if (jy < 1200 || jy > 1700 || jm < 1 || jm > 12 || jd < 1) return false
  return jd <= daysInJalaliMonth(jy, jm)
}

/** Step a Jalali (year, month) pair by `delta` months, carrying the year. */
export function shiftJalaliMonth(jy, jm, delta) {
  const zeroBased = jy * 12 + (jm - 1) + delta
  return { jy: Math.floor(zeroBased / 12), jm: (((zeroBased % 12) + 12) % 12) + 1 }
}

export { JDate }