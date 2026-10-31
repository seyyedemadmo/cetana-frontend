import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createI18n } from 'vue-i18n'
import Vue3PersianDatetimePicker from 'vue3-persian-datetime-picker'

import App from './App.vue'
import router from './router'
import { pinia } from './store'
import en from './locales/en'
import fa from './locales/fa'
import JalaliDatePicker from './components/JalaliDatePicker.vue'
import JalaliText from './components/JalaliText.vue'
import { formatJalaliDate, formatJalaliDateTime, formatJalaliTime } from './utils/jalali'
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
app.use(Vue3PersianDatetimePicker, {
  name: 'DatePicker',
  props: {
    format: 'YYYY-MM-DD',
    displayFormat: 'jYYYY/jMM/jDD',
    editable: false,
    autoSubmit: true,
    clearable: true,
  },
})

app.component('JalaliDatePicker', JalaliDatePicker)
app.component('JalaliText', JalaliText)
app.config.globalProperties.$jalaliDate = formatJalaliDate
app.config.globalProperties.$jalaliDateTime = formatJalaliDateTime
app.config.globalProperties.$jalaliTime = formatJalaliTime

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
