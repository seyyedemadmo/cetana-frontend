<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.roles') }}</h2></div>

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="name" label="Name" min-width="180" />
      <el-table-column prop="slug" label="Slug" width="180" />
      <el-table-column label="Permissions" min-width="120">
        <template #default="{ row }">{{ row.permissions?.length ?? row.permission_count ?? '—' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import client from '../api/client'

const { t } = useI18n()
const rows = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await client.get('/roles/')
    rows.value = data.results || []
  } catch (e) {
    rows.value = []
  } finally {
    loading.value = false
  }
})
</script>
