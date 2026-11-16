import client from './client'

export const getSettings = (lang) =>
  client
    .get('/settings/', { params: lang ? { lang } : undefined })
    .then((r) => r.data)
export const saveSettings = (values) => client.put('/settings/', { values }).then((r) => r.data)
export const testOdoo = () => client.post('/settings/test-odoo/').then((r) => r.data)
