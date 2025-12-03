import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useJurisdiction } from '../contexts/JurisdictionContext';

export default function ProtectedRoute({ 
  children, 
  requiredRole = null,
  requireApprovalPermission = false,
  requireDisputePermission = false,
  requireJurisdiction = false,
}) {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { currentJurisdiction, userPermissions, loading } = useJurisdiction();

  // Not authenticated
  if (!isAuthenticated() || !token) {
    return <Navigate to="/login" replace />;
  }

  // Still loading jurisdiction data
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Check if user has required role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check if user has required jurisdiction
  if (requireJurisdiction && !currentJurisdiction && !userPermissions.isAdmin) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2>No Jurisdiction Assigned</h2>
        <p>You need to be assigned to a jurisdiction to access this page.</p>
        <p>Please contact your administrator.</p>
      </div>
    );
  }

  // Check approval permission
  if (requireApprovalPermission && !userPermissions.canApprove && !userPermissions.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check dispute resolution permission
  if (requireDisputePermission && !userPermissions.canResolveDisputes && !userPermissions.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
