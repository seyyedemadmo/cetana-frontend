import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '../store'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'reservations', name: 'reservations', component: () => import('../views/Reservations.vue') },
      { path: 'orders', name: 'orders', component: () => import('../views/Orders.vue') },
      { path: 'processing', name: 'processing', component: () => import('../views/Processing.vue') },
      { path: 'workflows', name: 'workflows', component: () => import('../views/Workflows.vue'), meta: { permissions: ['workflow.view'] } },
      { path: 'workflows/:id', name: 'workflow-designer', component: () => import('../views/WorkflowDesigner.vue'), meta: { permissions: ['workflow.create', 'workflow.update'] } },
      { path: 'users', name: 'users', component: () => import('../views/Users.vue'), meta: { permissions: ['user.view'] } },
      { path: 'roles', name: 'roles', component: () => import('../views/Roles.vue'), meta: { permissions: ['role.view'] } },
      { path: 'reports', name: 'reports', component: () => import('../views/Reports.vue') },
      { path: 'payments', name: 'payments', component: () => import('../views/Payments.vue') },
      { path: 'invoices', name: 'invoices', component: () => import('../views/Invoices.vue') },
      { path: 'monitoring', name: 'monitoring', component: () => import('../views/Monitoring.vue') },
      { path: 'settings', name: 'settings', component: () => import('../views/Settings.vue'), meta: { permissions: ['settings.manage'] } },
      { path: 'profile', name: 'profile', component: () => import('../views/Profile.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !to.meta.roles.some((r) => auth.hasRole(r))) {
    return { name: 'dashboard' }
  }
  if (to.meta.permissions && !to.meta.permissions.some((p) => auth.hasPerm(p))) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
