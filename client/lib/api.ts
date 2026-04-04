import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gs_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('gs_token')
      localStorage.removeItem('gs_worker')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
