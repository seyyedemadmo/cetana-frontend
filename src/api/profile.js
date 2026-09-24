import client from './client'

export const updateProfile = (payload) => client.patch('/auth/me/', payload).then((r) => r.data)
export const changePassword = (oldPassword, newPassword) =>
  client
    .post('/auth/me/change-password/', { old_password: oldPassword, new_password: newPassword })
    .then((r) => r.data)
