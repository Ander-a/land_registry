import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MapBoundaryDrawer from '../components/MapBoundaryDrawer'
import claimsService from '../services/claims'

export default function SubmitClaim() {
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [boundary, setBoundary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showToast, setShowToast] = useState(false)
  
  const { authState } = useAuth()
  const navigate = useNavigate()

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      // Simulate upload progress
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)
    }
  }

  const handleBoundaryChange = (newBoundary) => {
    setBoundary(newBoundary)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!photo) {
      setError('Please upload a photo')
      return
    }

    if (!boundary) {
      setError('Please draw a boundary on the map')
      return
    }

    setLoading(true)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('photo', photo)
      formData.append('boundary', JSON.stringify(boundary))
      if (description) {
        formData.append('description', description)
      }

      // Submit claim
      const response = await claimsService.createClaim(formData)
      
      setSuccess(true)
      setError(null)
      setShowToast(true)
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/my-claims')
      }, 3000)
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit claim. Make sure your photo has GPS data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    alert('Draft saved!')
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-gray-100">
      {/* TopNavBar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6 lg:px-10">
        <div className="flex items-center gap-4 text-gray-900">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Land Registry System</h2>
        </div>
        <div className="flex flex-1 justify-end gap-2 sm:gap-4">
          <button 
            onClick={handleSaveDraft}
            className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 px-4 text-sm font-bold leading-normal tracking-wide text-gray-900 hover:bg-gray-200"
          >
            <span className="truncate">Save Draft</span>
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || !photo || !boundary}
            className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-blue-600 px-4 text-sm font-bold leading-normal tracking-wide text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <span className="truncate">{loading ? 'Submitting...' : 'Submit Claim'}</span>
          </button>
          <Link to="/dashboard" className="flex aspect-square size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* PageHeading */}
        <div className="flex flex-wrap justify-between gap-3 pb-6">
          <div className="flex min-w-72 flex-col gap-2">
            <p className="text-4xl font-black leading-tight tracking-tight text-gray-900">Submit a New Land Claim</p>
            <p className="text-base font-normal leading-normal text-gray-500">Follow the steps below to define your parcel, upload evidence, and submit your claim for review.</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-4 text-red-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Uploads */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm">
              {/* EmptyState / File Upload */}
              <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-gray-300 px-6 py-14">
                <div className="flex max-w-[480px] flex-col items-center gap-2 text-center">
                  <p className="text-lg font-bold leading-tight tracking-tight text-gray-900">Upload Geotagged Evidence</p>
                  <p className="text-sm font-normal leading-normal text-gray-600">Drag &amp; drop images here or click to browse. At least one image is required.</p>
                </div>
                <label htmlFor="photo-upload" className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 px-4 text-sm font-bold leading-normal tracking-wide text-gray-900 hover:bg-gray-200">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="truncate">Upload Files</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Files Section */}
              {photo && (
                <div className="flex flex-col gap-4">
                  <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Uploaded Files</h2>
                  
                  {/* File with Progress */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium leading-normal text-gray-900">{photo.name}</p>
                      {uploadProgress < 100 ? (
                        <p className="text-xs font-normal leading-normal text-gray-500">Uploading...</p>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs font-normal leading-normal">Complete</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-full bg-gray-200">
                      <div 
                        className={`h-1.5 rounded-full ${uploadProgress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Preview */}
                  {photoPreview && (
                    <div className="rounded-lg overflow-hidden">
                      <img src={photoPreview} alt="Preview" className="h-48 w-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Map and Details */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            {/* Map Section */}
            <div className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Define Parcel Boundary</h2>
              <p className="-mt-3 text-sm text-gray-500">Click on the map to draw the boundary of your land parcel, or use the 'Auto-detect' feature.</p>
              <div className="relative overflow-hidden rounded-lg">
                <MapBoundaryDrawer onBoundaryChange={handleBoundaryChange} />
                {photo && (
                  <button 
                    className="absolute right-4 top-4 flex h-10 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-4 text-sm font-bold leading-normal tracking-wide text-white shadow-lg hover:bg-blue-700"
                    onClick={() => alert('AI Boundary detection coming soon!')}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="truncate">Auto-detect Boundary</span>
                  </button>
                )}
              </div>
            </div>

            {/* Claim Information */}
            <div className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900">Claim Information</h2>
              <form className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="parcel-description">
                    Parcel Description
                  </label>
                  <textarea
                    className="w-full rounded-md border-gray-300 bg-white text-gray-900 focus:border-blue-600 focus:ring-blue-600"
                    id="parcel-description"
                    name="parcel-description"
                    placeholder="e.g., Vacant lot behind the community market, used for farming since 2005."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Boundary Coordinates</label>
                  <div className="rounded-md border border-gray-200 bg-gray-100 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-500">
                      {boundary ? JSON.stringify(boundary.coordinates[0], null, 2) : 'Draw boundary on the map to see coordinates...'}
                    </pre>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Coordinates are automatically populated from the map.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && success && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-end px-4 py-6 sm:items-start sm:p-6">
          <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-bold text-gray-900">Claim Submitted Successfully</p>
                    <p className="mt-1 text-sm text-gray-500">Your land claim has been received and is being processed.</p>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      onClick={() => setShowToast(false)}
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      type="button"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
