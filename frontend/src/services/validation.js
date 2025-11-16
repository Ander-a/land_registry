import api from './api'

export default {
  // Witness a claim (citizen)
  witnessClaim: async (claimId, comment = '') => {
    return api.post('/validation/witness', {
      claim_id: claimId,
      status: 'approved',
      comment: comment
    })
  },

  // Leader endorsement
  leaderEndorseClaim: async (claimId, comment = '') => {
    return api.post('/validation/leader', {
      claim_id: claimId,
      status: 'approved',
      comment: comment
    })
  },

  // Get validation history for a claim
  getClaimValidations: async (claimId) => {
    return api.get(`/validation/claim/${claimId}`)
  },

  // Get pending claims for validation
  getPendingClaims: async () => {
    return api.get('/validation/pending-claims')
  }
}
