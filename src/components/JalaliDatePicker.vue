<template>
  <date-picker
    v-model="inner"
    :format="format"
    :display-format="displayFormat"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :simple="simple"
    :auto-submit="autoSubmit"
    :editable="editable"
    :min="min"
    :max="max"
    :type="type"
    :input-class="inputClass"
    class="jalali-date-picker"
    @change="onChange"
  />
</template>

<script setup>
import { computed } from 'vue'
import DatePicker from 'vue3-persian-datetime-picker'

const props = defineProps({
  modelValue: { type: [String, Date, null], default: '' },
  /** API / storage format (Gregorian). */
  format: { type: String, default: 'YYYY-MM-DD' },
  /** What the user sees (Jalali). */
  displayFormat: { type: String, default: 'jYYYY/jMM/jDD' },
  placeholder: { type: String, default: 'انتخاب تاریخ' },
  disabled: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  simple: { type: Boolean, default: false },
  autoSubmit: { type: Boolean, default: true },
  editable: { type: Boolean, default: false },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  type: { type: String, default: 'date' },
  inputClass: { type: String, default: 'jalali-date-input' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const inner = computed({
  get: () => props.modelValue || '',
  set: (v) => {
    emit('update:modelValue', v || '')
  },
})

function onChange(v) {
  emit('change', v || '')
}
</script>

<style>
.jalali-date-picker {
  width: 100%;
  display: block;
}
.jalali-date-input {
  width: 100%;
  height: 32px;
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 32px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}
.jalali-date-input:hover {
  border-color: var(--el-border-color-hover);
}
.jalali-date-input:focus {
  border-color: var(--el-color-primary);
}
.vpd-main {
  z-index: 4000 !important;
}
</style>
