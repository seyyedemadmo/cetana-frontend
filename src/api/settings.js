import client from './client'

export const getSettings = () => client.get('/settings/').then((r) => r.data)
export const saveSettings = (values) => client.put('/settings/', { values }).then((r) => r.data)
export const testOdoo = () => client.post('/settings/test-odoo/').then((r) => r.data)
