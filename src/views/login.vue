<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="always">
      <div class="login-brand">
        <span class="brand-dot"></span>
        <h1>{{ t('app.name') }}</h1>
        <p>{{ t('app.tagline') }}</p>
      </div>
      <el-form @submit.prevent="onSubmit">
        <el-form-item>
          <el-input v-model="username" :placeholder="t('login.username')" size="large" autocomplete="username" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" :placeholder="t('login.password')" size="large" show-password autocomplete="current-password" />
        </el-form-item>
        <el-button type="primary" size="large" native-type="submit" :loading="loading" style="width: 100%">
          {{ t('login.submit') }}
        </el-button>
        <p class="odoo-hint">{{ t('login.odooHint') }}</p>
        <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon style="margin-top: 14px" />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    const data = e.response?.data
    const detail = data?.detail
    const code = (typeof detail === 'object' && detail?.code) || data?.code
    const message =
      (typeof detail === 'string' && detail) ||
      detail?.detail ||
      (Array.isArray(detail) ? detail[0] : null) ||
      data?.error?.message
    if (code === 'ODOO_UNAVAILABLE' || String(message || '').toLowerCase().includes('odoo')) {
      error.value = message || t('login.odooDown')
    } else {
      error.value = message || t('login.failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cetana-bg);
}
.login-card { width: 400px; max-width: 92vw; }
.login-brand { text-align: center; margin-bottom: 22px; }
.brand-dot {
  width: 42px; height: 42px; border-radius: 12px; display: inline-block;
  background: linear-gradient(135deg, var(--el-color-primary), var(--cetana-accent));
}
.login-brand h1 { margin: 12px 0 2px; font-size: 1.7rem; }
.login-brand p { margin: 0; color: var(--el-text-color-secondary); }
.odoo-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
  line-height: 1.4;
}
</style>
