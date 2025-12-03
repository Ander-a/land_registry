import React, { useState, useEffect } from 'react';
import { FaSearch, FaSave, FaUserShield, FaUser } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import './UserRoleManagement.css';

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState({});
  const [roleChanges, setRoleChanges] = useState({});

  const roleOptions = [
    { value: 'resident', label: 'Resident', color: 'blue' },
    { value: 'community_member', label: 'Community Validator', color: 'green' },
    { value: 'local_leader', label: 'Local Leader', color: 'purple' },
    { value: 'admin', label: 'System Admin', color: 'red' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (searchQuery) {
      const filtered = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.national_id?.includes(searchQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleSaveRole = async (userId) => {
    try {
      setSaving(prev => ({ ...prev, [userId]: true }));
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: roleChanges[userId]
        })
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user =>
          user._id === userId ? { ...user, role: roleChanges[userId] } : user
        ));
        
        // Clear the pending change
        setRoleChanges(prev => {
          const newChanges = { ...prev };
          delete newChanges[userId];
          return newChanges;
        });
        
        alert('Role updated successfully!');
      } else {
        throw new Error('Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleColor = (role) => {
    const roleOption = roleOptions.find(opt => opt.value === role);
    return roleOption?.color || 'gray';
  };

  const getRoleLabel = (role) => {
    const roleOption = roleOptions.find(opt => opt.value === role);
    return roleOption?.label || role;
  };

  const hasChanges = (userId) => {
    return roleChanges[userId] !== undefined;
  };

  const getCurrentRole = (userId) => {
    if (roleChanges[userId]) {
      return roleChanges[userId];
    }
    const user = users.find(u => u._id === userId);
    return user?.role || 'resident';
  };

  return (
    <AdminLayout>
      <div className="user-role-management">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">User Role Management</h1>
            <p className="page-subtitle">Manage user roles and permissions</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="users-count">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Role Legend */}
        <div className="role-legend">
          <span className="legend-title">Roles:</span>
          {roleOptions.map(role => (
            <div key={role.value} className="legend-item">
              <span className={`role-badge role-${role.color}`}>
                {role.label}
              </span>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>National ID</th>
                <th>Current Role</th>
                <th>Change Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="loading-cell">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-cell">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className={hasChanges(user._id) ? 'has-changes' : ''}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          <FaUser />
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.full_name}</div>
                          <div className="user-meta">
                            {user.province && `${user.province}, ${user.district}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td className="national-id-cell">{user.national_id || 'N/A'}</td>
                    <td>
                      <span className={`role-badge role-${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <select
                        value={getCurrentRole(user._id)}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="role-select"
                      >
                        {roleOptions.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="save-btn"
                        onClick={() => handleSaveRole(user._id)}
                        disabled={!hasChanges(user._id) || saving[user._id]}
                      >
                        {saving[user._id] ? (
                          <span>Saving...</span>
                        ) : (
                          <>
                            <FaSave /> Save
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statistics */}
        <div className="role-statistics">
          <h3>Role Distribution</h3>
          <div className="stats-grid">
            {roleOptions.map(role => {
              const count = users.filter(u => u.role === role.value).length;
              const percentage = users.length > 0 ? ((count / users.length) * 100).toFixed(1) : 0;
              
              return (
                <div key={role.value} className="stat-card">
                  <div className="stat-header">
                    <span className={`stat-icon role-${role.color}`}>
                      <FaUserShield />
                    </span>
                    <span className="stat-percentage">{percentage}%</span>
                  </div>
                  <div className="stat-body">
                    <div className="stat-value">{count}</div>
                    <div className="stat-label">{role.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserRoleManagement;
