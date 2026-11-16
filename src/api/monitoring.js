import client from './client'

export const listCameras = () => client.get('/live-monitoring/cameras/').then((r) => r.data)
export const requestStreamAccess = (cameraId) => client.post(`/live-monitoring/cameras/${cameraId}/access/`).then((r) => r.data)
export const verifyStream = (token) => client.get('/live-monitoring/streams/verify/', { params: { token } }).then((r) => r.data)
export const getMonitoringOverview = () => client.get('/live-monitoring/cameras/overview/').then((r) => r.data)
export const syncCameras = () => client.post('/live-monitoring/cameras/sync/').then((r) => r.data)
