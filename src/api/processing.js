import client from './client'

export const listExecutions = (params = {}) => client.get('/processing/', { params }).then((r) => r.data)
export const executionAction = (id, action, payload = {}) => client.post(`/processing/${id}/${action}/`, payload).then((r) => r.data)
