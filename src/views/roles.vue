<template>
  <div class="page">
    <div class="page-header"><h2>{{ t('nav.roles') }}</h2></div>

    <ListToolbar
      v-model:search="search"
      :search-placeholder="t('common.searchPlaceholder')"
      @search="onSearchInput"
    />

    <el-table :data="rows" v-loading="loading" stripe>
      <el-table-column prop="name" :label="t('common.name')" min-width="180" />
      <el-table-column prop="slug" :label="t('common.slug')" width="180" />
      <el-table-column :label="t('roles.permissions')" min-width="120">
        <template #default="{ row }">{{ row.permissions?.length ?? row.permission_count ?? '—' }}</template>
      </el-table-column>
    </el-table>

    <ListPagination
      :total="total"
      :page="page"
      :page-size="pageSize"
      @page-change="onPageChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { listRoles } from '../api/users'
import ListPagination from '../components/ListPagination.vue'
import ListToolbar from '../components/ListToolbar.vue'
import { useServerList } from '../composables/useServerList'

const { t } = useI18n()
const {
  rows, loading, total, page, pageSize, search,
  onSearchInput, onPageChange, onSizeChange,
} = useServerList(listRoles)
</script>
