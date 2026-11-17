<template>
  <div v-if="total > 0" class="list-pagination">
    <el-pagination
      background
      layout="total, sizes, prev, pager, next"
      :total="total"
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      @current-change="$emit('update:page', $event); $emit('page-change', $event)"
      @size-change="$emit('update:pageSize', $event); $emit('size-change', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
})

defineEmits(['update:page', 'update:pageSize', 'page-change', 'size-change'])
</script>

<style scoped>
.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
