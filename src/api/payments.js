import client from './client'

export const listPayments = (params = {}) => client.get('/payments/', { params }).then((r) => r.data)
export const createPayment = (payload) => client.post('/payments/', payload).then((r) => r.data)
export const verifyPayment = (id) => client.post(`/payments/${id}/verify/`).then((r) => r.data)
