import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard(){
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState({
    totalClaims: 0,
    pendingValidation: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    async function fetchMe(){
      try{
        const res = await api.getMe()
        setMe(res.data)
      }catch(e){
        console.error(e)
      }
    }
    fetchMe()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="flex h-full w-full flex-1">
        {/* SideNavBar */}
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-full flex-col justify-between p-4">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 px-3">
                <div className="size-8 text-blue-600">
                  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900">LandRegistry AI</h1>
              </div>
              <nav className="flex flex-col gap-2">
                <Link to="/dashboard" className="flex items-center gap-3 rounded-lg bg-blue-600/10 px-3 py-2.5">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
                  </svg>
                  <p className="text-sm font-semibold leading-normal text-blue-600">Dashboard</p>
                </Link>
                <Link to="/my-claims" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium leading-normal text-gray-900">My Claims</p>
                </Link>
                <Link to="/submit-claim" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-sm font-medium leading-normal text-gray-900">Submit New Claim</p>
                </Link>
                {authState?.user?.role === 'citizen' && (
                  <Link to="/witness" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm font-medium leading-normal text-gray-900">Witness Claims</p>
                  </Link>
                )}
                {authState?.user?.role === 'leader' && (
                  <Link to="/leader" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-sm font-medium leading-normal text-gray-900">Leader Endorsement</p>
                  </Link>
                )}
                <Link to="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium leading-normal text-gray-900">Settings</p>
                </Link>
              </nav>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-black/5">
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <p className="text-sm font-medium leading-normal text-gray-900">Logout</p>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          {/* TopNavBar */}
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
            <label className="relative flex min-w-40 max-w-96 flex-col">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                className="form-input h-10 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border-none bg-gray-100 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-0 focus:ring-2 focus:ring-blue-600/50" 
                placeholder="Search by Claim ID, Applicant Name..." 
              />
            </label>
            <div className="flex items-center gap-6">
              <button className="relative flex cursor-pointer items-center justify-center rounded-full p-2 text-gray-600 hover:bg-black/5">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute right-1 top-1 flex h-2.5 w-2.5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
              </button>
              <div className="flex items-center gap-3">
                <div className="aspect-square size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                <div className="flex flex-col text-sm">
                  <p className="font-semibold text-gray-900">{authState?.user?.name || 'User'}</p>
                  <p className="text-gray-600">{authState?.user?.role || 'Citizen'}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 bg-gray-100 p-8">
            {/* PageHeading */}
            <div className="mb-8">
              <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Dashboard</p>
              <p className="text-base font-normal leading-normal text-gray-600">Welcome back, {authState?.user?.name || 'User'}! Here's what's happening today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Total Land Claims</p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{stats.totalClaims}</p>
                <p className="text-sm font-medium text-green-600">+5.2% this month</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Pending Validation</p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{stats.pendingValidation}</p>
                <p className="text-sm font-medium text-green-600">+10% this week</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Claims Approved</p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{stats.approved}</p>
                <p className="text-sm font-medium text-green-600">+2.1% this month</p>
              </div>
              <div className="flex flex-col gap-2 rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-600">Claims Rejected</p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{stats.rejected}</p>
                <p className="text-sm font-medium text-red-600">-1.5% this month</p>
              </div>
            </div>

            {/* Section with Action Cards */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Recent Activity Card */}
              <div className="lg:col-span-2">
                <div className="rounded-xl bg-white shadow-sm">
                  <h2 className="border-b border-gray-200 p-6 text-lg font-bold text-gray-900">Recent Activity</h2>
                  <div className="flex flex-col divide-y divide-gray-200">
                    <div className="flex items-center gap-4 p-4 hover:bg-black/5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Claim #12345 has been validated.</p>
                        <p className="text-xs text-gray-600">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 hover:bg-black/5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/10">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New document uploaded for Claim #67890.</p>
                        <p className="text-xs text-gray-600">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 hover:bg-black/5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/10">
                        <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Claim #55432 is pending additional review.</p>
                        <p className="text-xs text-gray-600">3 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 hover:bg-black/5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/10">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Claim #11223 was rejected due to incomplete documentation.</p>
                        <p className="text-xs text-gray-600">Yesterday</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4 text-center">
                    <a className="text-sm font-semibold text-blue-600 hover:underline" href="#">View All Notifications</a>
                  </div>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="lg:col-span-1">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h2>
                  <div className="flex flex-col gap-3">
                    <Link to="/submit-claim" className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Start a New Claim
                    </Link>
                    <Link to="/my-claims" className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-black/5">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      View All Claims
                    </Link>
                    <button className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-black/5">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Access Map
                    </button>
                    <button className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-black/5">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
