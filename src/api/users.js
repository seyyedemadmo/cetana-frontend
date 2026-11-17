import client from './client'

export const listUsers = (params = {}) => client.get('/users/', { params }).then((r) => r.data)
export const createUser = (payload) => client.post('/users/', payload).then((r) => r.data)
export const updateUser = (id, payload) => client.patch(`/users/${id}/`, payload).then((r) => r.data)
export const deleteUser = (id) => client.delete(`/users/${id}/`).then((r) => r.data)
export const setUserPassword = (id, newPassword) =>
  client.post(`/users/${id}/set-password/`, { new_password: newPassword }).then((r) => r.data)
export const listRoles = (params = {}) => client.get('/roles/', { params }).then((r) => r.data)
