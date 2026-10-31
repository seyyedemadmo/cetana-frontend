/**
 * Jalali (Shamsi) date helpers for UI display.
 *
 * The API stays on ISO-8601 Gregorian. Conversion happens only where a human
 * reads a date (tables, detail panes, date pickers).
 *
 * Keep APP_TIME_ZONE aligned with Django TIME_ZONE (see backend .env.example).
 */
import moment from 'moment-jalaali'

export const APP_TIME_ZONE = 'Asia/Tehran'

try {
  moment.loadPersian({ usePersianDigits: false, dialect: 'persian-modern' })
} catch {
  // Older moment-jalaali builds may not expose loadPersian.
}

function parseInput(value) {
  if (value == null || value === '') return null
  if (moment.isMoment(value)) return value.clone()
  if (value instanceof Date) {
    const m = moment(value)
    return m.isValid() ? m : null
  }
  if (typeof value === 'number') {
    const m = moment(value)
    return m.isValid() ? m : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null

    // Bare Gregorian date YYYY-MM-DD — calendar date, no TZ shift.
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const m = moment(trimmed, 'YYYY-MM-DD')
      return m.isValid() ? m : null
    }

    // Jalali display form YYYY/MM/DD[ HH:mm]
    if (/^\d{4}\/\d{2}\/\d{2}/.test(trimmed) && !trimmed.includes('T') && !trimmed.includes('-')) {
      const withTime = moment(trimmed, 'jYYYY/jMM/jDD HH:mm')
      if (withTime.isValid()) return withTime
      const dateOnly = moment(trimmed.slice(0, 10), 'jYYYY/jMM/jDD')
      return dateOnly.isValid() ? dateOnly : null
    }

    // ISO / RFC timestamps
    const iso = moment(trimmed)
    return iso.isValid() ? iso : null
  }
  const m = moment(value)
  return m.isValid() ? m : null
}

function localParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === '24' ? '00' : get('hour'),
    minute: get('minute'),
  }
}

/** Render date as ``YYYY/MM/DD`` (Jalali). */
export function formatJalaliDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const m = moment(value.trim(), 'YYYY-MM-DD')
    return m.isValid() ? m.format('jYYYY/jMM/jDD') : '—'
  }
  // Aware ISO → convert via project TZ calendar day first.
  if (typeof value === 'string' && (value.includes('T') || value.endsWith('Z'))) {
    try {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        const p = localParts(d)
        return moment(`${p.year}-${p.month}-${p.day}`, 'YYYY-MM-DD').format('jYYYY/jMM/jDD')
      }
    } catch {
      // fall through
    }
  }
  const m = parseInput(value)
  if (!m) return '—'
  return m.format('jYYYY/jMM/jDD')
}

/** Render datetime as ``YYYY/MM/DD HH:mm`` (Jalali, Asia/Tehran wall clock). */
export function formatJalaliDateTime(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return formatJalaliDate(value)
  }
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (!Number.isNaN(d.getTime()) && (typeof value !== 'string' || value.includes('T') || value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value))) {
      const p = localParts(d)
      return moment(`${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`, 'YYYY-MM-DD HH:mm').format('jYYYY/jMM/jDD HH:mm')
    }
  } catch {
    // fall through
  }
  const m = parseInput(value)
  if (!m) return '—'
  return m.format('jYYYY/jMM/jDD HH:mm')
}

/** Render time as ``HH:MM`` (API times are local wall-clock). */
export function formatJalaliTime(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') {
    const parts = value.trim().split(':')
    if (parts.length >= 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
    }
  }
  const m = parseInput(value)
  if (!m) return '—'
  return m.format('HH:mm')
}

/** Convert any displayable value to Gregorian ``YYYY-MM-DD`` for API payloads. */
export function toGregorianDate(value) {
  const m = parseInput(value)
  if (!m) return ''
  return m.format('YYYY-MM-DD')
}

export { moment as jalaliMoment }
