<template>
  <div class="page" style="text-align: center; padding-top: 80px">
    <el-empty :description="t('notFound.title')">
      <el-button type="primary" @click="$router.push('/dashboard')">{{ t('notFound.backToDashboard') }}</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
