import client from './client'

export const listPricingRules = (params = {}) =>
  client.get('/pricing/rules/', { params }).then((r) => r.data)

export const createPricingRule = (payload) =>
  client.post('/pricing/rules/', payload).then((r) => r.data)

export const updatePricingRule = (id, payload) =>
  client.patch(`/pricing/rules/${id}/`, payload).then((r) => r.data)

export const deletePricingRule = (id) =>
  client.delete(`/pricing/rules/${id}/`).then((r) => r.data)
