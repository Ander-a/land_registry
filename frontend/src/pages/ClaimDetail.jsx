import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import claimsService from '../services/claims'
import validationService from '../services/validation'

export default function ClaimDetail() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [validations, setValidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchClaimDetails()
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      const claimResponse = await claimsService.getClaim(id)
      setClaim(claimResponse.data)

      const validationResponse = await validationService.getClaimValidations(id)
      setValidations(validationResponse.data)

      setError(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = () => {
    alert('Certificate download feature coming soon!')
  }

  const handleReportIssue = () => {
    alert('Report issue feature coming soon!')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading claim details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link to="/my-claims" className="mt-4 inline-block text-blue-600 hover:underline">← Back to Claims</Link>
        </div>
      </div>
    )
  }

  if (!claim) return null

  const getStatusBadge = () => {
    const status = claim.validation_status || claim.status
    const badges = {
      pending: { color: 'yellow', icon: 'pending', text: 'Pending' },
      partially_validated: { color: 'orange', icon: 'schedule', text: 'Partially Validated' },
      fully_validated: { color: 'green', icon: 'verified', text: 'Verified' },
      approved: { color: 'green', icon: 'check_circle', text: 'Approved' },
      rejected: { color: 'red', icon: 'cancel', text: 'Rejected' }
    }
    return badges[status] || badges.pending
  }

  const badge = getStatusBadge()

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-gray-100">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex-1 px-4 py-8 md:px-8 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2">
              <Link to="/dashboard" className="text-sm font-medium leading-normal text-gray-500 hover:text-blue-600">Dashboard</Link>
              <span className="text-sm font-medium leading-normal text-gray-500">/</span>
              <Link to="/my-claims" className="text-sm font-medium leading-normal text-gray-500 hover:text-blue-600">Claims</Link>
              <span className="text-sm font-medium leading-normal text-gray-500">/</span>
              <span className="text-sm font-medium leading-normal text-gray-900">Claim #{claim.id?.substring(0, 8)}</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col flex-wrap items-start justify-between gap-4 md:flex-row md:items-center">
              <p className="text-3xl font-black leading-tight tracking-tight text-gray-900 md:text-4xl">
                Claim Details: #{claim.id?.substring(0, 8)}
              </p>
              <div className={`flex items-center gap-x-2 rounded-full ${badge.color === 'green' ? 'bg-green-100' : badge.color === 'orange' ? 'bg-orange-100' : badge.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'} px-4 py-1.5`}>
                <svg className={`h-5 w-5 ${badge.color === 'green' ? 'text-green-600' : badge.color === 'orange' ? 'text-orange-600' : badge.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                  {badge.color === 'green' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  )}
                </svg>
                <p className={`text-sm font-medium leading-normal ${badge.color === 'green' ? 'text-green-700' : badge.color === 'orange' ? 'text-orange-700' : badge.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>
                  {badge.text}
                </p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column (Visuals) */}
              <div className="flex flex-col gap-6 lg:col-span-2">
                {/* Original Uploaded Image Card */}
                <div className="flex flex-col rounded-xl bg-white shadow-sm">
                  <div className="p-6">
                    <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Original Uploaded Image</p>
                    <p className="mt-1 text-base font-normal leading-normal text-gray-500">A photo of the land plot with identifiable landmarks.</p>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
                      <img
                        src={`http://localhost:8000/${claim.photo_url}`}
                        alt="Land plot"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Map Card */}
                <div className="flex flex-col rounded-xl bg-white shadow-sm">
                  <div className="p-6">
                    <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Boundary Polygon</p>
                    <p className="mt-1 text-base font-normal leading-normal text-gray-500">Validated boundary overlayed on satellite imagery.</p>
                  </div>
                  <div className="px-6 pb-6">
                    <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
                      {/* Placeholder for map - you can integrate Leaflet here */}
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-green-100">
                        <div className="text-center">
                          <svg className="mx-auto h-16 w-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">Map view with boundary</p>
                          <p className="text-xs text-gray-500">{claim.boundary?.coordinates[0]?.length || 0} boundary points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Details & Actions) */}
              <div className="flex flex-col gap-6 lg:col-span-1">
                {/* Claim Information Card */}
                <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Claim Information</p>
                  <div className="mt-6 flex flex-col gap-5">
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">Claimant ID</label>
                      <p className="mt-1 text-base font-medium text-gray-900">{claim.owner_id?.substring(0, 16)}...</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">Date Submitted</label>
                      <p className="mt-1 text-base font-medium text-gray-900">{new Date(claim.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">GPS Coordinates</label>
                      <p className="mt-1 text-base font-medium text-gray-900">
                        {claim.geolocation?.latitude?.toFixed(6)}, {claim.geolocation?.longitude?.toFixed(6)}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">Boundary Points</label>
                      <p className="mt-1 text-base font-medium text-gray-900">{claim.boundary?.coordinates[0]?.length || 0} points</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">Witness Count</label>
                      <p className="mt-1 text-base font-medium text-gray-900">{claim.witness_count || 0} witnesses</p>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-normal text-gray-500">Leader Endorsed</label>
                      <p className="mt-1 text-base font-medium text-gray-900">
                        {claim.endorsed_by_leader ? (
                          <span className="text-green-600">✓ Yes</span>
                        ) : (
                          <span className="text-orange-600">✗ Not yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
                  <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Actions</p>
                  <button 
                    onClick={handleDownloadCertificate}
                    className="flex h-11 w-full items-center justify-center gap-x-2 rounded-lg bg-blue-600 px-4 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Certificate</span>
                  </button>
                  <button 
                    onClick={handleReportIssue}
                    className="flex h-11 w-full items-center justify-center gap-x-2 rounded-lg border border-gray-300 bg-white px-4 text-base font-bold text-gray-900 shadow-sm transition-all hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <span>Report Issue</span>
                  </button>
                </div>

                {/* Validation Timeline */}
                {validations.length > 0 && (
                  <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Validation Timeline</p>
                    <div className="flex flex-col gap-3">
                      {validations.map((validation, idx) => (
                        <div key={validation.id || idx} className={`rounded-lg border-l-4 ${validation.validator_role === 'leader' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'} p-3`}>
                          <div className="flex items-start gap-2">
                            <svg className={`mt-0.5 h-5 w-5 ${validation.validator_role === 'leader' ? 'text-blue-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 capitalize">{validation.validator_role}</p>
                              <p className="text-xs text-gray-600">{validation.comment || 'No comment'}</p>
                              <p className="mt-1 text-xs text-gray-500">{new Date(validation.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
