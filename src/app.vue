<template>
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import en from 'element-plus/dist/locale/en.mjs'
import fa from 'element-plus/dist/locale/fa.mjs'

const { locale } = useI18n()
const elementLocale = computed(() => (locale.value === 'fa' ? fa : en))
</script>
