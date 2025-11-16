import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// attach token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default {
  register: (payload) => API.post('/auth/register', payload),
  login: (payload) => API.post('/auth/login', payload),
  getMe: () => API.get('/auth/me')
}
