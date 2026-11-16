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
import JalaliDatePicker from './components/JalaliDatePicker.vue'
import JalaliText from './components/JalaliText.vue'
import * as jalali from './utils/jalali'
import './theme/base.css'

// Product default is Persian + RTL. One-time migrate older installs that still
// boot into English from the previous default.
if (localStorage.getItem('cetana.ui.lang.v2') !== '1') {
  localStorage.setItem('cetana.locale', 'fa')
  localStorage.setItem('cetana.dir', 'rtl')
  localStorage.setItem('cetana.ui.lang.v2', '1')
}
const initialLocale = localStorage.getItem('cetana.locale') || 'fa'
document.documentElement.lang = initialLocale === 'fa' ? 'fa' : 'en'
const initialDir =
  localStorage.getItem('cetana.dir') || (initialLocale === 'fa' ? 'rtl' : 'ltr')
localStorage.setItem('cetana.dir', initialDir)
document.documentElement.setAttribute('dir', initialDir)

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'fa',
  messages: { en, fa }
})

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(i18n)

app.component('JalaliDatePicker', JalaliDatePicker)
app.component('JalaliText', JalaliText)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// Every date the API returns is Gregorian; expose the Jalali helpers globally so
// any view can render `{{ $jDate(row.created_at) }}` without an import.
app.config.globalProperties.$jDate = jalali.formatJalaliDate
app.config.globalProperties.$jDateTime = jalali.formatJalaliDateTime
app.config.globalProperties.$jTime = jalali.formatTime
app.config.globalProperties.$jTimeRange = jalali.formatTimeRange
app.config.globalProperties.$jRange = jalali.formatJalaliRange
app.config.globalProperties.$jalaliDate = jalali.formatJalaliDate
app.config.globalProperties.$jalaliDateTime = jalali.formatJalaliDateTime
app.config.globalProperties.$jalaliTime = jalali.formatTime

app.mount('#app')
