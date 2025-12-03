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
import ClaimValidation from './pages/ClaimValidation'
import ValidatorScore from './pages/ValidatorScore'
import LeaderEndorsement from './pages/LeaderEndorsement'
import LocalLeaderDashboard from './pages/LocalLeaderDashboard'
import ClaimsApprovalQueue from './pages/ClaimsApprovalQueue'
import DisputeList from './pages/DisputeList'
import DisputeDetail from './pages/DisputeDetail'
import DisputeResolution from './components/DisputeResolution'
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
      <Route path="/community/validate/:claimId" element={<ProtectedRoute><ClaimValidation /></ProtectedRoute>} />
      <Route path="/community/score" element={<ProtectedRoute><ValidatorScore /></ProtectedRoute>} />
      <Route path="/leader" element={<ProtectedRoute><LeaderEndorsement /></ProtectedRoute>} />
      
      {/* Leader Portal Routes */}
      <Route 
        path="/leader/dashboard" 
        element={
          <ProtectedRoute requiredRole="local_leader" requireJurisdiction={true}>
            <LocalLeaderDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leader/approvals" 
        element={
          <ProtectedRoute requireApprovalPermission={true} requireJurisdiction={true}>
            <ClaimsApprovalQueue />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leader/disputes" 
        element={
          <ProtectedRoute requiredRole="local_leader" requireJurisdiction={true}>
            <DisputeList />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leader/disputes/:id" 
        element={
          <ProtectedRoute requiredRole="local_leader" requireJurisdiction={true}>
            <DisputeDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leader/disputes/:id/resolve" 
        element={
          <ProtectedRoute requireDisputeResolutionPermission={true} requireJurisdiction={true}>
            <DisputeResolution />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
      <Route path="/claim-details-new" element={<ProtectedRoute><ClaimDetailsNew /></ProtectedRoute>} />
      <Route path="/validate-claim" element={<ProtectedRoute><ValidateClaim /></ProtectedRoute>} />
    </Routes>
  )
}
