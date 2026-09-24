<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="brand">
        <span class="brand-dot"></span>
        <span v-show="!collapsed" class="brand-name">{{ t('app.name') }}</span>
      </div>
      <el-menu
        :collapse="collapsed"
        :default-active="$route.path"
        router
        class="menu"
        :collapse-transition="false"
      >
        <el-menu-item v-for="item in visibleItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ t(item.label) }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button text @click="collapsed = !collapsed">
            <el-icon size="18"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
          </el-button>
        </div>
        <div class="header-right">
          <el-button text @click="theme.toggleTheme()" :title="t('settings.theme')">
            <el-icon size="18"><Moon v-if="theme.theme === 'light'" /><Sunny v-else /></el-icon>
          </el-button>
          <el-button text @click="theme.toggleDir()" :title="'RTL/LTR'">
            <el-icon size="18"><Sort /></el-icon>
          </el-button>
          <el-dropdown @command="onLocale">
            <el-button text>
              <el-icon size="18"><Connection /></el-icon>
              <span style="margin-left:4px">{{ localeLabel }}</span>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="en">English</el-dropdown-item>
                <el-dropdown-item command="fa">فارسی</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown @command="onUserCommand">
            <span class="user-chip">
              <el-avatar :size="28">{{ initials }}</el-avatar>
              <span class="user-name">{{ auth.user?.username || '—' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">My profile</el-dropdown-item>
                <el-dropdown-item command="logout">{{ t('common.logout') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../store/auth'
import { useThemeStore } from '../store/theme'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()
const collapsed = ref(false)

const items = [
  { path: '/dashboard', icon: 'Odometer', label: 'nav.dashboard' },
  { path: '/reservations', icon: 'Calendar', label: 'nav.reservations' },
  { path: '/orders', icon: 'Tickets', label: 'nav.orders' },
  { path: '/processing', icon: 'Cpu', label: 'nav.processing' },
  { path: '/workflows', icon: 'Share', label: 'nav.workflows', permissions: ['workflow.view'] },
  { path: '/users', icon: 'User', label: 'nav.users', permissions: ['user.view'] },
  { path: '/roles', icon: 'Avatar', label: 'nav.roles', permissions: ['role.view'] },
  { path: '/reports', icon: 'DataAnalysis', label: 'nav.reports' },
  { path: '/payments', icon: 'Wallet', label: 'nav.payments' },
  { path: '/invoices', icon: 'Document', label: 'nav.invoices' },
  { path: '/monitoring', icon: 'VideoCamera', label: 'nav.monitoring' },
  { path: '/settings', icon: 'Setting', label: 'nav.settings', permissions: ['settings.manage'] }
]

const visibleItems = computed(() =>
  items.filter(
    (i) =>
      (!i.roles || i.roles.some((r) => auth.hasRole(r))) &&
      (!i.permissions || i.permissions.some((p) => auth.hasPerm(p)))
  )
)

const initials = computed(() => (auth.user?.username || '?').slice(0, 2).toUpperCase())
const localeLabel = computed(() => (locale.value === 'fa' ? 'فارسی' : 'EN'))

function onLocale(cmd) {
  locale.value = cmd
  localStorage.setItem('cetana.locale', cmd)
}

function onUserCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
  } else if (cmd === 'profile') {
    router.push('/profile')
  }
}

onMounted(() => {
  theme.init()
  if (!auth.user) auth.loadMe()
})
</script>

<style scoped>
.layout { height: 100vh; }
.aside {
  background: var(--cetana-surface);
  border-inline-end: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}
.brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  font-weight: 800;
  font-size: 1.1rem;
}
.brand-dot {
  width: 18px; height: 18px; border-radius: 6px;
  background: linear-gradient(135deg, var(--el-color-primary), var(--cetana-accent));
  flex: none;
}
.menu { border-inline-end: none; flex: 1; }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--cetana-surface);
  border-bottom: 1px solid var(--el-border-color-light);
}
.header-right { display: flex; align-items: center; gap: 6px; }
.user-chip { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 8px; }
.user-chip:hover { background: var(--el-fill-color-light); }
.user-name { font-weight: 600; }
.main { background: var(--cetana-bg); }
</style>
