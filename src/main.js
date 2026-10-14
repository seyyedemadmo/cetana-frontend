import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'
import { pinia } from './store'
import en from './locales/en'
import fa from './locales/fa'
import * as jalali from './utils/jalali'
import './theme/base.css'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('cetana.locale') || 'en',
  fallbackLocale: 'en',
  messages: { en, fa }
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(i18n)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Every date the API returns is Gregorian; expose the Jalali helpers globally so
// any view can render `{{ $jDate(row.created_at) }}` without an import. Columns
// that still bind a raw prop should switch to a template using these.
app.config.globalProperties.$jDate = jalali.formatJalaliDate
app.config.globalProperties.$jDateTime = jalali.formatJalaliDateTime
app.config.globalProperties.$jTime = jalali.formatTime
app.config.globalProperties.$jTimeRange = jalali.formatTimeRange
app.config.globalProperties.$jRange = jalali.formatJalaliRange

app.mount('#app')
