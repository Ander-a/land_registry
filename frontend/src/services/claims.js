import api from './api'

export default {
  createClaim: async (formData) => {
    return api.post('/claims/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  getClaim: async (id) => {
    return api.get(`/claims/${id}`)
  },

  getUserClaims: async (userId) => {
    return api.get(`/claims/user/${userId}`)
  },

  getAllMyClaims: async () => {
    return api.get('/claims/')
  }
}
