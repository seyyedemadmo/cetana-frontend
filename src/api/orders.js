import client from './client'

export const listOrders = (params = {}) => client.get('/orders/', { params }).then((r) => r.data)
export const createOrder = (payload) => client.post('/orders/', payload).then((r) => r.data)
export const weighOrder = (id, gross, tare) => client.post(`/orders/${id}/weigh/`, { gross, tare }).then((r) => r.data)
export const selectSteps = (id, stepKeys) => client.post(`/orders/${id}/select_steps/`, { step_keys: stepKeys }).then((r) => r.data)
export const confirmOrder = (id, termsAccepted = true) => client.post(`/orders/${id}/confirm/`, { terms_accepted: termsAccepted }).then((r) => r.data)
