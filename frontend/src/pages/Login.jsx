import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try{
      const res = await api.login({ email, password })
      const token = res.data.access_token
      const user = res.data.user
      localStorage.setItem('token', token)
      setAuthState({ user, token })
      navigate('/dashboard')
    }catch(err){
      setError(err?.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center rounded-xl bg-white p-8 shadow-lg sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Land Registry Portal</h1>
            <p className="mt-2 text-base text-gray-600">Securely access your land registry data.</p>
          </div>
          <div className="w-full space-y-6">
            {/* Error Message Area */}
            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-3 text-red-600">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <label className="flex flex-col">
                <p className="pb-2 text-sm font-medium text-gray-900">Email Address</p>
                <div className="relative flex w-full items-center">
                  <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input 
                    className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 text-base text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                    placeholder="Enter your email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="flex flex-col">
                <p className="pb-2 text-sm font-medium text-gray-900">Password</p>
                <div className="relative flex w-full items-center">
                  <svg className="pointer-events-none absolute left-4 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input 
                    className="h-12 w-full rounded-lg border border-gray-300 bg-white pl-12 pr-12 text-base text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" 
                    placeholder="Enter your password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 flex h-full w-12 items-center justify-center text-gray-500 hover:text-gray-900"
                    aria-label="Toggle password visibility"
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

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    className="h-4 w-4 rounded border-2 border-gray-300 bg-transparent text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0" 
                    id="remember-me" 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="cursor-pointer text-sm font-medium text-gray-900" htmlFor="remember-me">Remember me</label>
                </div>
                <a className="text-sm font-medium text-blue-600 hover:underline" href="#">Forgot Password?</a>
              </div>

              <button 
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:ring-offset-2"
              >
                Login
              </button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account? <Link to="/register" className="font-medium text-blue-600 hover:underline">Request Access</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
