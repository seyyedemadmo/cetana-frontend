import client from './client'

export const listInvoices = (params = {}) => client.get('/invoices/', { params }).then((r) => r.data)
export const createInvoice = (orderId) => client.post('/invoices/', { order: orderId }).then((r) => r.data)
export const syncInvoice = (id) => client.post(`/invoices/${id}/sync/`).then((r) => r.data)
