import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('cetana.theme') || 'light',
    dir: localStorage.getItem('cetana.dir') || 'ltr'
  }),
  actions: {
    init() {
      this.applyTheme()
      this.applyDir()
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('cetana.theme', this.theme)
      this.applyTheme()
    },
    toggleDir() {
      this.dir = this.dir === 'ltr' ? 'rtl' : 'ltr'
      localStorage.setItem('cetana.dir', this.dir)
      this.applyDir()
    },
    applyTheme() {
      document.documentElement.classList.toggle('dark', this.theme === 'dark')
    },
    applyDir() {
      document.documentElement.setAttribute('dir', this.dir)
    }
  }
})
