import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1'
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('cetana.token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cetana.token')
      localStorage.removeItem('cetana.refresh')
    }
    return Promise.reject(error)
  }
)

export default client
