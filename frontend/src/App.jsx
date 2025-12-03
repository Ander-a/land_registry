import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import DashboardNew from './pages/DashboardNew'
import ResidentDashboard from './pages/ResidentDashboard'
import SubmitClaimNew from './pages/SubmitClaimNew'
import MyClaims from './pages/MyClaims'
import TitleDeeds from './pages/TitleDeeds'
import Notifications from './pages/Notifications'
import Disputes from './pages/Disputes'
import CommunityFeed from './pages/CommunityFeed'
import ClaimsNearYou from './pages/ClaimsNearYou'
import LeaderEndorsement from './pages/LeaderEndorsement'
import ClaimDetail from './pages/ClaimDetail'
import ClaimDetailsNew from './pages/ClaimDetailsNew'
import ValidateClaim from './pages/ValidateClaim'
import FileUpload from './components/FileUpload'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { isAuthenticated, logout, authState } = useAuth()
  const isLeader = authState?.user?.role === 'leader'

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/file-upload" element={<FileUpload />} />
      <Route path="/dashboard-new" element={<ProtectedRoute><DashboardNew /></ProtectedRoute>} />
      <Route path="/resident/dashboard" element={<ProtectedRoute><ResidentDashboard /></ProtectedRoute>} />
      <Route path="/submit-claim-new" element={<ProtectedRoute><SubmitClaimNew /></ProtectedRoute>} />
      <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
      <Route path="/title-deeds" element={<ProtectedRoute><TitleDeeds /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
      <Route path="/community/feed" element={<ProtectedRoute><CommunityFeed /></ProtectedRoute>} />
      <Route path="/community/claims" element={<ProtectedRoute><ClaimsNearYou /></ProtectedRoute>} />
      <Route path="/leader" element={<ProtectedRoute><LeaderEndorsement /></ProtectedRoute>} />
      <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
      <Route path="/claim-details-new" element={<ProtectedRoute><ClaimDetailsNew /></ProtectedRoute>} />
      <Route path="/validate-claim" element={<ProtectedRoute><ValidateClaim /></ProtectedRoute>} />
    </Routes>
  )
}
