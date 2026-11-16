import client from './client'

export const listCameras = () => client.get('/live-monitoring/cameras/').then((r) => r.data)
export const requestStreamAccess = (cameraId) => client.post(`/live-monitoring/cameras/${cameraId}/access/`).then((r) => r.data)
export const verifyStream = (token) => client.get('/live-monitoring/streams/verify/', { params: { token } }).then((r) => r.data)
export const getMonitoringOverview = () => client.get('/live-monitoring/cameras/overview/').then((r) => r.data)
export const syncCameras = () => client.post('/live-monitoring/cameras/sync/').then((r) => r.data)
export const listCamerasForExecution = (params) =>
  client.get('/live-monitoring/cameras/for-execution/', { params }).then((r) => r.data)
export const listStepCameras = (params = {}) =>
  client.get('/live-monitoring/step-cameras/', { params }).then((r) => r.data)
export const replaceStepCameras = (step, cameraIds) =>
  client.post('/live-monitoring/step-cameras/replace/', { step, camera_ids: cameraIds }).then((r) => r.data)
