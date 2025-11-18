import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'

export default function Register(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('citizen')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      await authAPI.register({ name, email, password, role })
      navigate('/login')
    }catch(err){
      setError(err?.response?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center gap-2">
          <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold text-gray-800">AI Land Registry</p>
        </div>

        {/* Registration Card */}
        <div className="w-full rounded-xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-center">
            <h1 className="text-center text-[32px] font-bold leading-tight tracking-tight text-gray-900">Create Your Account</h1>
            <p className="pt-2 text-center text-base leading-normal text-gray-600">Join the AI-Assisted Land Registry System to get started.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-3 text-red-600">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {/* Full Name */}
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900">Full Name</p>
              <div className="relative flex w-full items-center">
                <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input 
                  className="form-input h-14 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base leading-normal text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                  placeholder="Enter your full name" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </label>

            {/* Email Address */}
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900">Email Address</p>
              <div className="relative flex w-full items-center">
                <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input 
                  className="form-input h-14 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base leading-normal text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                  placeholder="Enter your email address" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            {/* Password */}
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900">Password</p>
              <div className="relative flex w-full items-center">
                <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input 
                  className="form-input h-14 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-12 text-base leading-normal text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                  placeholder="Enter your password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {/* Select Role */}
            <label className="flex flex-col">
              <p className="pb-2 text-base font-medium leading-normal text-gray-900">Select Your Role</p>
              <div className="relative flex w-full items-center">
                <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <select 
                  className="form-select h-14 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-12 pr-10 text-base leading-normal text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                >
                  <option value="citizen">Land Owner (Citizen)</option>
                  <option value="leader">Community Leader</option>
                  <option value="surveyor">Surveyor</option>
                  <option value="official">Government Official</option>
                </select>
              </div>
            </label>

            {/* Submit Button */}
            <button 
              type="submit"
              className="flex h-14 w-full items-center justify-center rounded-lg bg-blue-600 px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:ring-offset-2"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
