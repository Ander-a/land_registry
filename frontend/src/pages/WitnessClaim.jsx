import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import validationService from '../services/validation'

export default function WitnessClaim() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(null)
  const [comments, setComments] = useState({})
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { authState } = useAuth()

  useEffect(() => {
    fetchPendingClaims()
  }, [])

  const fetchPendingClaims = async () => {
    try {
      setLoading(true)
      const response = await validationService.getPendingClaims()
      setClaims(response.data)
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load pending claims')
    } finally {
      setLoading(false)
    }
  }

  const handleWitness = async (claimId) => {
    setSubmitting(claimId)
    setError(null)
    setSuccess(null)

    try {
      const comment = comments[claimId] || ''
      if (!comment.trim()) {
        setError('Please add a comment before approving')
        setSubmitting(null)
        return
      }
      
      const response = await validationService.witnessClaim(claimId, comment)
      setSuccess(`Claim ${claimId.substring(0, 8)} witnessed successfully!`)
      
      // Remove claim from list
      setClaims(claims.filter(c => c.id !== claimId))
      
      // Clear comment
      setComments({ ...comments, [claimId]: '' })
      
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to witness claim')
    } finally {
      setSubmitting(null)
    }
  }

  const handleReject = (claimId) => {
    const comment = comments[claimId] || ''
    if (!comment.trim()) {
      setError('Please add a comment explaining the reason for rejection')
      return
    }
    alert('Reject functionality coming soon!')
  }

  const handleCommentChange = (claimId, value) => {
    setComments({ ...comments, [claimId]: value })
    if (error) setError(null)
  }

  const filteredClaims = claims.filter(claim => 
    claim.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.owner_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading pending claims...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gray-100">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-10">
          <div className="flex items-center gap-4 text-gray-900">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="text-lg font-bold leading-tight tracking-tight">Land Registry System</h2>
          </div>
          <Link to="/dashboard" className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-900">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="layout-content-container flex w-full max-w-4xl flex-1 flex-col">
            {/* Page Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-72 flex-col gap-2">
                <p className="text-3xl font-black leading-tight tracking-tight text-gray-900 sm:text-4xl">Pending Claim Validation</p>
                <p className="text-base font-normal leading-normal text-gray-500">Please review the following land claims submitted by community members.</p>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500 bg-green-50 p-4 text-green-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-4 text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Filters and Search */}
            <div className="mb-6 flex flex-wrap gap-3">
              <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white pl-3 pr-2 text-gray-700 hover:bg-gray-100">
                <p className="text-sm font-medium leading-normal">Filter by Date</p>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white pl-3 pr-2 text-gray-700 hover:bg-gray-100">
                <p className="text-sm font-medium leading-normal">Filter by Status</p>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="relative ml-auto max-w-xs flex-grow">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Search by claim ID..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Claims List */}
            <div className="flex flex-col gap-6">
              {filteredClaims.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-10 w-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">All Claims Reviewed</h3>
                  <p className="mt-2 text-sm text-gray-500">There are no more pending claims for you to validate. Great work!</p>
                </div>
              ) : (
                filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex flex-col items-stretch justify-start rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="p-4">
                      <div className="flex flex-col items-stretch justify-start gap-4 lg:flex-row lg:items-start">
                        {/* Image */}
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200 lg:w-1/3">
                          <img
                            src={`http://localhost:8000/${claim.photo_url}`}
                            alt="Land plot"
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Claim Info */}
                        <div className="flex min-w-72 grow flex-col items-stretch justify-center gap-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-normal leading-normal text-gray-500">Claim ID: {claim.id?.substring(0, 12)}</p>
                              <p className="text-xl font-bold leading-tight tracking-tight text-gray-900">Owner: {claim.owner_id?.substring(0, 16)}...</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-600">
                              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                              Pending Review
                            </div>
                          </div>
                          <p className="text-base font-normal leading-normal text-gray-600">
                            Submitted: {new Date(claim.created_at).toLocaleDateString()} | Witnesses: {claim.witness_count || 0}
                          </p>
                          <Link
                            to={`/claim/${claim.id}`}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View Documents &amp; Photos
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="rounded-b-xl border-t border-gray-200 bg-gray-50 p-4">
                      <label className="flex min-w-40 flex-1 flex-col">
                        <p className="pb-2 text-sm font-medium leading-normal text-gray-900">Add a comment (required)</p>
                        <textarea
                          className="form-input min-h-24 flex w-full min-w-0 flex-1 resize-y overflow-hidden rounded-lg border border-gray-300 bg-white p-3 text-base font-normal leading-normal text-gray-800 placeholder:text-gray-400 focus:border-blue-600 focus:outline-0 focus:ring-2 focus:ring-blue-600/50"
                          placeholder="Enter your observation or reason here..."
                          value={comments[claim.id] || ''}
                          onChange={(e) => handleCommentChange(claim.id, e.target.value)}
                        ></textarea>
                      </label>
                      <div className="mt-4 flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleReject(claim.id)}
                          className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-200 px-4 text-sm font-medium leading-normal text-gray-800 hover:bg-gray-300"
                        >
                          <span className="truncate">Reject</span>
                        </button>
                        <button
                          onClick={() => handleWitness(claim.id)}
                          disabled={submitting === claim.id}
                          className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-green-600 px-4 text-sm font-medium leading-normal text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
                        >
                          <span className="truncate">{submitting === claim.id ? 'Submitting...' : 'Approve'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
