import client from './client'

export const listReportDefinitions = () => client.get('/reports/definitions/').then((r) => r.data)
export const listFinalReports = (params = {}) => client.get('/reports/', { params }).then((r) => r.data)
export const generateReport = (orderId) => client.post('/reports/generate/', { order: orderId }).then((r) => r.data)
export const downloadReportPdf = (id) => client.get(`/reports/${id}/pdf/`, { responseType: 'blob' }).then((r) => r.data)
