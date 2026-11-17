<template>
  <div class="list-toolbar">
    <el-input
      v-if="showSearch"
      :model-value="search"
      clearable
      :placeholder="searchPlaceholder || t('common.search')"
      class="list-toolbar__search"
      @update:model-value="$emit('update:search', $event)"
      @input="$emit('search')"
      @clear="$emit('search')"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <div class="list-toolbar__filters">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  showSearch: { type: Boolean, default: true },
})

defineEmits(['update:search', 'search'])

const { t } = useI18n()
</script>

<style scoped>
.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}
.list-toolbar__search {
  width: min(280px, 100%);
}
.list-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  flex: 1;
}
</style>
