import client from './client'

export const listReservations = (params = {}) => client.get('/reservations/', { params }).then((r) => r.data)
export const listSlots = () => client.get('/reservations/slots/').then((r) => r.data)
export const listFacilities = () => client.get('/reservations/facilities/').then((r) => r.data)
export const listSchedules = (params = {}) => client.get('/reservations/schedules/', { params }).then((r) => r.data)
export const createSchedule = (payload) => client.post('/reservations/schedules/', payload).then((r) => r.data)
export const deleteSchedule = (id) => client.delete(`/reservations/schedules/${id}/`).then((r) => r.data)
export const generateSlots = (facility, date) => client.post('/reservations/slots/generate/', { facility, date }).then((r) => r.data)
export const createReservation = (payload) => client.post('/reservations/', payload).then((r) => r.data)
export const cancelReservation = (id) => client.post(`/reservations/${id}/cancel/`).then((r) => r.data)
export const approveReservation = (id) => client.post(`/reservations/${id}/approve/`).then((r) => r.data)
export const rejectReservation = (id) => client.post(`/reservations/${id}/reject/`).then((r) => r.data)
