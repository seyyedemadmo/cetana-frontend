<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ t('nav.pricing') }}</h2>
      <el-button v-if="auth.hasPerm('pricing.manage')" type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('pricing.addRule') }}
      </el-button>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.pricing') }}</span>
      </template>
    </el-alert>

    <ListToolbar
      v-model:search="search"
      :search-placeholder="t('common.searchPlaceholder')"
      @search="onSearchInput"
    >
      <el-select
        v-model="filters.rule_type"
        clearable
        :placeholder="t('pricing.ruleType')"
        style="width: 160px"
        @change="onFilterChange"
      >
        <el-option :label="t('common.all')" value="" />
        <el-option value="per_kg" :label="t('pricing.types.per_kg')" />
        <el-option value="fixed" :label="t('pricing.types.fixed')" />
        <el-option value="discount" :label="t('pricing.types.discount')" />
        <el-option value="tax" :label="t('pricing.types.tax')" />
        <el-option value="fee" :label="t('pricing.types.fee')" />
      </el-select>
      <el-select
        v-model="filters.active"
        clearable
        :placeholder="t('common.status')"
        style="width: 140px"
        @change="onFilterChange"
      >
        <el-option :label="t('common.all')" value="" />
        <el-option :label="t('common.active')" :value="true" />
        <el-option :label="t('common.inactive')" :value="false" />
      </el-select>
    </ListToolbar>

    <el-empty v-if="!loading && !rows.length" :description="t('pricing.empty')" />
    <el-table v-else :data="rows" v-loading="loading" stripe>
      <el-table-column :label="t('pricing.service')" min-width="140">
        <template #default="{ row }">{{ stepLabel(t, row.step_key, row.step_name) }}</template>
      </el-table-column>
      <el-table-column prop="name" :label="t('pricing.ruleName')" min-width="160" />
      <el-table-column :label="t('pricing.ruleType')" width="140">
        <template #default="{ row }">{{ ruleTypeLabel(row.rule_type) }}</template>
      </el-table-column>
      <el-table-column prop="amount" :label="t('pricing.amount')" width="120" />
      <el-table-column :label="t('common.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? t('common.active') : t('common.inactive') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="auth.hasPerm('pricing.manage')" :label="t('common.actions')" width="180" align="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
          <el-button size="small" type="danger" plain @click="remove(row)">{{ t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <ListPagination
      :total="total"
      :page="page"
      :page-size="pageSize"
      @page-change="onPageChange"
      @size-change="onSizeChange"
    />

    <el-dialog v-model="dialog" :title="editing ? t('pricing.editRule') : t('pricing.addRule')" width="480px">
      <el-form label-position="top">
        <el-form-item :label="t('pricing.service')">
          <el-select v-model="form.step" style="width: 100%" filterable>
            <el-option v-for="s in serviceSteps" :key="s.id" :label="stepLabel(t, s.key, s.name)" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('pricing.ruleName')"><el-input v-model="form.name" /></el-form-item>
        <el-form-item :label="t('pricing.ruleType')">
          <el-select v-model="form.rule_type" style="width: 100%">
            <el-option value="per_kg" :label="t('pricing.types.per_kg')" />
            <el-option value="fixed" :label="t('pricing.types.fixed')" />
            <el-option value="discount" :label="t('pricing.types.discount')" />
            <el-option value="tax" :label="t('pricing.types.tax')" />
            <el-option value="fee" :label="t('pricing.types.fee')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('pricing.amount')"><el-input-number v-model="form.amount" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item :label="t('common.active')"><el-switch v-model="form.active" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="save">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { createPricingRule, deletePricingRule, listPricingRules, updatePricingRule } from '../api/pricing'
import { listSteps, listWorkflows } from '../api/workflows'
import ListPagination from '../components/ListPagination.vue'
import ListToolbar from '../components/ListToolbar.vue'
import { useServerList } from '../composables/useServerList'
import { useAuthStore } from '../store/auth'
import { stepLabel } from '../utils/labels'

const { t } = useI18n()
const auth = useAuthStore()

function ruleTypeLabel(type) {
  const key = `pricing.types.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}

const serviceSteps = ref([])
const dialog = ref(false)
const editing = ref(null)
const form = reactive({ step: null, name: '', rule_type: 'per_kg', amount: 0, active: true })

const {
  rows, loading, total, page, pageSize, search, filters,
  load, onSearchInput, onFilterChange, onPageChange, onSizeChange,
} = useServerList(listPricingRules, { immediate: false })
filters.rule_type = ''
filters.active = ''

async function loadSteps() {
  try {
    const workflows = await listWorkflows()
    const active = (workflows.results || workflows || []).find((w) => w.status === 'active' && w.active_version)
    if (!active?.active_version?.id) {
      serviceSteps.value = []
      return
    }
    const data = await listSteps(active.active_version.id)
    serviceSteps.value = (data.results || []).filter((s) => s.kind === 'service' || !s.kind)
  } catch {
    serviceSteps.value = []
  }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { step: null, name: '', rule_type: 'per_kg', amount: 0, active: true })
  dialog.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    step: row.step,
    name: row.name,
    rule_type: row.rule_type,
    amount: Number(row.amount),
    active: row.active
  })
  dialog.value = true
}

async function save() {
  try {
    if (editing.value) await updatePricingRule(editing.value.id, form)
    else await createPricingRule(form)
    ElMessage.success(t('common.saved'))
    dialog.value = false
    load()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || t('common.operationFailed'))
  }
}

async function remove(row) {
  try {
    await ElMessageBox.confirm(t('pricing.deleteConfirm'), { type: 'warning' })
    await deletePricingRule(row.id)
    ElMessage.success(t('common.deleted'))
    load()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.error?.message || t('common.operationFailed'))
  }
}

onMounted(() => {
  load()
  loadSteps()
})
</script>

<style scoped>
.help-banner {
  margin-bottom: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-info-light-9));
  border: 1px solid var(--el-color-primary-light-7);
}
.help-text { font-size: 14px; line-height: 1.6; color: var(--el-color-primary-dark-2); }
</style>
