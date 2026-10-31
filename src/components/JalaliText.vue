<template>
  <span dir="ltr" class="jalali-text">{{ text }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { formatJalaliDate, formatJalaliDateTime, formatJalaliTime } from '../utils/jalali'

const props = defineProps({
  value: { type: [String, Date, Number, null], default: null },
  /** date | datetime | time */
  mode: { type: String, default: 'date' },
})

const text = computed(() => {
  if (props.mode === 'datetime') return formatJalaliDateTime(props.value)
  if (props.mode === 'time') return formatJalaliTime(props.value)
  return formatJalaliDate(props.value)
})
</script>

<style scoped>
.jalali-text {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
