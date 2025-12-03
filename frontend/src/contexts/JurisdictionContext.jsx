import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const JurisdictionContext = createContext();

export const useJurisdiction = () => {
  const context = useContext(JurisdictionContext);
  if (!context) {
    throw new Error('useJurisdiction must be used within JurisdictionProvider');
  }
  return context;
};

export const JurisdictionProvider = ({ children }) => {
  const [currentJurisdiction, setCurrentJurisdiction] = useState(null);
  const [jurisdictions, setJurisdictions] = useState([]);
  const [userPermissions, setUserPermissions] = useState({
    canApprove: false,
    canResolveDisputes: false,
    isAdmin: false,
    isLocalLeader: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadJurisdictionData();
  }, []);

  const loadJurisdictionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get current user to extract jurisdiction and permissions
      const userResponse = await axios.get('http://localhost:8000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = userResponse.data;

      // Set user permissions
      setUserPermissions({
        canApprove: user.can_approve_claims || false,
        canResolveDisputes: user.can_resolve_disputes || false,
        isAdmin: user.role === 'admin',
        isLocalLeader: user.role === 'local_leader',
        leaderLevel: user.leader_level || null,
      });

      // Load jurisdiction data if user has one
      if (user.jurisdiction_id) {
        const jurisdictionResponse = await axios.get(
          `http://localhost:8000/jurisdiction/${user.jurisdiction_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCurrentJurisdiction(jurisdictionResponse.data);
      }

      // Load all jurisdictions if admin
      if (user.role === 'admin') {
        const jurisdictionsResponse = await axios.get(
          'http://localhost:8000/jurisdiction/',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setJurisdictions(jurisdictionsResponse.data);
      }

    } catch (err) {
      console.error('Error loading jurisdiction data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshJurisdictionStats = async () => {
    if (!currentJurisdiction) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:8000/jurisdiction/${currentJurisdiction.id}/refresh-stats`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update current jurisdiction with new stats
      setCurrentJurisdiction(prev => ({
        ...prev,
        ...response.data
      }));

      return response.data;
    } catch (err) {
      console.error('Error refreshing jurisdiction stats:', err);
      throw err;
    }
  };

  const getJurisdictionStats = async (jurisdictionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/jurisdiction/${jurisdictionId}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err) {
      console.error('Error getting jurisdiction stats:', err);
      throw err;
    }
  };

  const value = {
    currentJurisdiction,
    jurisdictions,
    userPermissions,
    loading,
    error,
    refreshJurisdictionStats,
    getJurisdictionStats,
    reload: loadJurisdictionData,
  };

  return (
    <JurisdictionContext.Provider value={value}>
      {children}
    </JurisdictionContext.Provider>
  );
};
