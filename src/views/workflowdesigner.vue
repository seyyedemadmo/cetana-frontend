<template>
  <div class="designer">
    <div class="toolbar">
      <el-button @click="$router.push('/workflows')">{{ t('common.back') }}</el-button>
      <el-button v-if="auth.hasPerm('workflow.update')" type="primary" @click="dialog = true">
        <el-icon><Plus /></el-icon>&nbsp;{{ t('workflows.addStep') }}
      </el-button>
      <el-button v-if="auth.hasPerm('workflow.publish')" type="success" @click="publish">{{ t('btn.publish') }}</el-button>
      <span class="hint">{{ t('workflows.designerHint') }}</span>
    </div>

    <el-alert type="info" :closable="false" class="help-banner" show-icon>
      <template #title>
        <span class="help-text">{{ t('help.workflowDesigner') }}</span>
      </template>
    </el-alert>

    <el-alert v-if="viewingActive" type="warning" :closable="true" class="help-banner" show-icon @close="viewingActive = false">
      <template #title>
        <span class="help-text">{{ t('workflows.viewingActive') }}</span>
      </template>
    </el-alert>

    <div class="canvas">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :default-viewport="{ zoom: 1 }"
        fit-view-on-init
        :delete-key-code="['Backspace', 'Delete']"
        :connection-mode="ConnectionMode.Strict"
        @connect="onConnect"
        @node-drag-stop="onNodeDragStop"
        @nodes-delete="onNodesDelete"
      >
        <Background />
        <Controls />
        <template #node-custom="props">
          <div class="wf-node" :class="props.data.kind">
            <div class="wf-node-name">{{ props.data.label }}</div>
            <div class="wf-node-key">{{ props.data.key }}</div>
            <Handle type="target" :position="Position.Top" :id="`${props.id}-target`" :connectable="true" />
            <Handle type="source" :position="Position.Bottom" :id="`${props.id}-source`" :connectable="true" />
          </div>
        </template>
      </VueFlow>
    </div>

    <el-dialog v-model="dialog" :title="t('workflows.addStep')" width="460px">
      <el-form label-position="top">
        <el-form-item label="Key">
          <el-input v-model="form.key" :placeholder="t('workflows.stepKeyPlaceholder')" />
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="form.name" :placeholder="t('workflows.stepNamePlaceholder')" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.required">{{ t('workflows.required') }}</el-checkbox>
          <el-checkbox v-model="form.is_start" style="margin-inline-start: 16px">{{ t('workflows.startStep') }}</el-checkbox>
          <el-checkbox v-model="form.is_terminal" style="margin-inline-start: 16px">{{ t('workflows.terminalStep') }}</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="addStep">{{ t('common.add') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Handle, Position, VueFlow, ConnectionMode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import { getWorkflow, publishWorkflow } from '../api/workflows'
import client from '../api/client'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()

const workflow = ref(null)
const versionId = ref(null)
const viewingActive = ref(false)
const nodes = ref([])
const edges = ref([])
const dialog = ref(false)
const form = reactive({ key: '', name: '', required: false, is_start: false, is_terminal: false })

const errMsg = (e) => e.response?.data?.error?.message || 'Operation failed'

function kindOf(step) {
  if (step.is_start) return 'start'
  if (step.is_terminal) return 'terminal'
  if (step.required) return 'required'
  return 'normal'
}

async function load() {
  try {
    workflow.value = await getWorkflow(route.params.id)
  } catch (e) {
    ElMessage.error('Failed to load workflow: ' + errMsg(e))
    return
  }

  try {
    const { data: versions } = await client.get('/workflows/versions/', {
      params: { workflow: route.params.id, page_size: 100 }
    })

    let draft = (versions.results || []).find((v) => v.status === 'draft')

    if (!draft) {
      const active = (versions.results || []).find((v) => v.status === 'active')
      if (active) {
        const maxVersion = Math.max(0, ...(versions.results || []).map((v) => v.version))
        const { data: created } = await client.post('/workflows/versions/', {
          workflow: route.params.id, version: maxVersion + 1, status: 'draft'
        })
        draft = created
        try {
          await copyVersion(active.id, draft.id)
          viewingActive.value = true
          ElMessage.info('Created a new draft from the active version')
        } catch (copyErr) {
          ElMessage.warning('Created empty draft (copy failed: ' + errMsg(copyErr) + ')')
        }
      } else {
        const maxVersion = Math.max(0, ...(versions.results || []).map((v) => v.version))
        const { data: created } = await client.post('/workflows/versions/', {
          workflow: route.params.id, version: maxVersion + 1, status: 'draft'
        })
        draft = created
        ElMessage.info('Created a new empty draft')
      }
    }

    versionId.value = draft.id
    await loadGraph(draft.id)
  } catch (e) {
    ElMessage.error('Failed to load versions: ' + errMsg(e))
  }
}

async function copyVersion(sourceVid, targetVid) {
  const [{ data: stepsData }, { data: transData }] = await Promise.all([
    client.get('/workflows/steps/', { params: { version: sourceVid, page_size: 500 } }),
    client.get('/workflows/transitions/', { params: { version: sourceVid, page_size: 500 } })
  ])

  const steps = stepsData.results || []
  const oldToNew = {}

  for (const s of steps) {
    const { data: newStep } = await client.post('/workflows/steps/', {
      version: targetVid,
      key: s.key,
      name: s.name,
      description: s.description,
      order: s.order,
      step_type: s.step_type,
      required: s.required,
      enabled: s.enabled,
      estimated_duration_minutes: s.estimated_duration_minutes,
      is_start: s.is_start,
      is_terminal: s.is_terminal,
      requires_customer_confirmation: s.requires_customer_confirmation,
      requires_payment: s.requires_payment,
      triggers_invoice: s.triggers_invoice,
      triggers_odoo_sync: s.triggers_odoo_sync,
      customer_visible: s.customer_visible,
      operator_visible: s.operator_visible,
      live_monitoring_enabled: s.live_monitoring_enabled,
      input_schema: s.input_schema,
      output_schema: s.output_schema,
      availability_condition: s.availability_condition,
      position_x: s.position_x,
      position_y: s.position_y,
    })
    oldToNew[s.id] = newStep.id
  }

  const transitions = transData.results || []
  for (const tr of transitions) {
    const fromId = oldToNew[tr.from_step]
    const toId = oldToNew[tr.to_step]
    if (fromId && toId) {
      await client.post('/workflows/transitions/', {
        version: targetVid,
        from_step: fromId,
        to_step: toId,
        conditions: tr.conditions,
      })
    }
  }
}

async function loadGraph(vid) {
  const [{ data: stepsData }, { data: transData }] = await Promise.all([
    client.get('/workflows/steps/', { params: { version: vid, page_size: 500 } }),
    client.get('/workflows/transitions/', { params: { version: vid, page_size: 500 } })
  ])
  const steps = stepsData.results || []
  nodes.value = steps.map((s, i) => ({
    id: s.id,
    type: 'custom',
    position: { x: s.position_x || 0, y: s.position_y || i * 140 },
    data: { key: s.key, label: s.name, kind: kindOf(s) }
  }))
  edges.value = (transData.results || []).map((t) => ({
    id: t.id,
    source: t.from_step,
    target: t.to_step
  }))
}

async function addStep() {
  try {
    const offset = nodes.value.length
    const { data: step } = await client.post('/workflows/steps/', {
      version: versionId.value,
      key: form.key,
      name: form.name,
      required: form.required,
      is_start: form.is_start,
      is_terminal: form.is_terminal,
      order: offset,
      position_x: 80 + (offset % 5) * 200,
      position_y: 40 + Math.floor(offset / 5) * 200
    })
    nodes.value.push({
      id: step.id,
      type: 'custom',
      position: { x: step.position_x, y: step.position_y },
      data: { key: step.key, label: step.name, kind: kindOf(step) }
    })
    dialog.value = false
    Object.assign(form, { key: '', name: '', required: false, is_start: false, is_terminal: false })
    ElMessage.success(t('workflows.addStep'))
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function onConnect(connection) {
  try {
    const { data: transition } = await client.post('/workflows/transitions/', {
      version: versionId.value,
      from_step: connection.source,
      to_step: connection.target
    })
    edges.value.push({ id: transition.id, source: connection.source, target: connection.target })
    ElMessage.success('Transition added')
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

async function onNodeDragStop({ node }) {
  try {
    await client.patch(`/workflows/steps/${node.id}/`, {
      position_x: node.position.x,
      position_y: node.position.y
    })
  } catch (e) {
    /* position persistence is best-effort */
  }
}

async function onNodesDelete(deleted) {
  for (const d of deleted) {
    try {
      await client.delete(`/workflows/steps/${d.id}/`)
    } catch (e) {
      /* ignore */
    }
  }
}

async function publish() {
  try {
    await publishWorkflow(route.params.id)
    ElMessage.success(t('workflows.publish'))
    load()
  } catch (e) {
    ElMessage.error(errMsg(e))
  }
}

onMounted(load)
</script>

<style scoped>
.designer { display: flex; flex-direction: column; height: calc(100vh - 120px); }
.toolbar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-light); flex-wrap: wrap; }
.hint { color: var(--el-text-color-secondary); font-size: 12.5px; margin-inline-start: auto; }
.canvas { flex: 1; min-height: 480px; }

.help-banner {
  margin: 12px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-info-light-9));
  border: 1px solid var(--el-color-primary-light-7);
  width: calc(100% - 32px);
}
.help-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-color-primary-dark-2);
}

.wf-node {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  min-width: 120px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  font-size: 13px;
}
.wf-node.start { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.wf-node.terminal { border-color: #d9a441; background: #fbf3e3; }
.wf-node.required { border-color: var(--el-color-primary); }
.wf-node-name { font-weight: 700; }
.wf-node-key { font-size: 11px; color: var(--el-text-color-secondary); }
</style>
