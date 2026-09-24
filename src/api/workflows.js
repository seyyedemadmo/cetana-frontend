import client from './client'

export const listWorkflows = () => client.get('/workflows/').then((r) => r.data)
export const getWorkflow = (id) => client.get(`/workflows/${id}/`).then((r) => r.data)
export const publishWorkflow = (id) => client.post(`/workflows/${id}/publish/`).then((r) => r.data)
export const listSteps = (versionId) => client.get('/workflows/steps/', { params: { version: versionId } }).then((r) => r.data)
