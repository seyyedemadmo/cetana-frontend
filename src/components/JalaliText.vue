<template>
  <span dir="ltr" class="jalali-text">{{ text }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { formatJalaliDate, formatJalaliDateTime, formatTime } from '../utils/jalali'

const props = defineProps({
  value: { type: [String, Date, Number, null], default: null },
  /** date | datetime | time */
  mode: { type: String, default: 'date' },
})

const text = computed(() => {
  let out = ''
  if (props.mode === 'datetime') out = formatJalaliDateTime(props.value)
  else if (props.mode === 'time') out = formatTime(props.value)
  else out = formatJalaliDate(props.value)
  return out || '—'
})
</script>

<style scoped>
.jalali-text {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
