import { defineStore } from 'pinia'
import { fetchMe, login as apiLogin } from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('cetana.token') || '',
    refresh: localStorage.getItem('cetana.refresh') || '',
    user: null,
    roles: [],
    permissions: []
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    hasRole: (s) => (role) => !!s.user?.is_superuser || s.roles.includes(role),
    hasPerm: (s) => (code) => s.permissions.includes('*') || s.permissions.includes(code)
  },
  actions: {
    async login(username, password) {
      const data = await apiLogin(username, password)
      this.token = data.access
      this.refresh = data.refresh || ''
      localStorage.setItem('cetana.token', data.access)
      if (data.refresh) localStorage.setItem('cetana.refresh', data.refresh)
      await this.loadMe()
    },
    async loadMe() {
      try {
        const me = await fetchMe()
        this.user = me
        this.roles = (me.roles || []).map((r) => r.slug)
        this.permissions = me.permissions || []
      } catch (e) {
        this.user = null
        this.roles = []
        this.permissions = []
      }
    },
    logout() {
      this.token = ''
      this.refresh = ''
      this.user = null
      this.roles = []
      this.permissions = []
      localStorage.removeItem('cetana.token')
      localStorage.removeItem('cetana.refresh')
    }
  }
})
