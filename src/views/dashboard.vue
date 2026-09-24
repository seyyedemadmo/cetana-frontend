<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.dashboard') }}</h2>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6" v-for="s in stats" :key="s.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-num">{{ s.value }}</div>
          <div class="stat-lbl">{{ s.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <template #header>Cetana</template>
      <p style="margin: 0; color: var(--el-text-color-secondary)">
        {{ t('app.tagline') }}. This dashboard reflects live API data where endpoints are available.
      </p>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listReservations } from '../api/reservations'

const { t } = useI18n()
const reservationCount = ref('—')

onMounted(async () => {
  try {
    const data = await listReservations({ page_size: 1 })
    reservationCount.value = data.count ?? 0
  } catch (e) {
    reservationCount.value = '—'
  }
})

const stats = computed(() => [
  { label: t('dashboard.activeReservations'), value: reservationCount.value },
  { label: t('dashboard.todaysReservations'), value: '—' },
  { label: t('dashboard.processingOrders'), value: '—' },
  { label: t('dashboard.pendingPayments'), value: '—' }
])
</script>

<style scoped>
.stat-num { font-size: 2rem; font-weight: 800; color: var(--el-color-primary); }
.stat-lbl { color: var(--el-text-color-secondary); margin-top: 4px; }
</style>
