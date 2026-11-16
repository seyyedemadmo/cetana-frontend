/** Translate API enums / process keys for the active locale. */

export function statusLabel(t, status, group = 'status') {
  if (status == null || status === '') return '—'
  const key = `${group}.${status}`
  const translated = t(key)
  return translated === key ? String(status) : translated
}

export function boolLabel(t, value) {
  if (value === true) return t('common.yes')
  if (value === false) return t('common.no')
  return '—'
}

export function openLabel(t, isOpen) {
  if (isOpen === true) return t('common.open')
  if (isOpen === false) return t('common.closed')
  return '—'
}

export function stepLabel(t, key, fallback = '') {
  if (!key) return fallback || '—'
  const translated = t(`process.steps.${key}`)
  if (translated !== `process.steps.${key}`) return translated
  return fallback || key
}

export function playerLabel(t, player) {
  if (!player) return ''
  const translated = t(`monitoring.players.${player}`)
  return translated === `monitoring.players.${player}` ? player : translated
}
