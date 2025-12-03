import React, { useState } from 'react';
import { FaEdit, FaCamera, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave, FaTimes, FaBell } from 'react-icons/fa';
import './ResidentProfile.css';

const ResidentProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    district: user?.district || '',
    sector: user?.sector || '',
    cell: user?.cell || '',
    village: user?.village || ''
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: user?.notification_preferences?.email_notifications ?? true,
    sms_notifications: user?.notification_preferences?.sms_notifications ?? false,
    claim_updates: user?.notification_preferences?.claim_updates ?? true,
    validation_updates: user?.notification_preferences?.validation_updates ?? true,
    approval_updates: user?.notification_preferences?.approval_updates ?? true,
    community_updates: user?.notification_preferences?.community_updates ?? false
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('personal');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNotificationChange = (field, value) => {
    setNotificationPrefs(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Full name must be at least 3 characters';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!formData.phone || !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      try {
        await onUpdate({ 
          ...formData, 
          notification_preferences: notificationPrefs 
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      district: user?.district || '',
      sector: user?.sector || '',
      cell: user?.cell || '',
      village: user?.village || ''
    });
    setNotificationPrefs({
      email_notifications: user?.notification_preferences?.email_notifications ?? true,
      sms_notifications: user?.notification_preferences?.sms_notifications ?? false,
      claim_updates: user?.notification_preferences?.claim_updates ?? true,
      validation_updates: user?.notification_preferences?.validation_updates ?? true,
      approval_updates: user?.notification_preferences?.approval_updates ?? true,
      community_updates: user?.notification_preferences?.community_updates ?? false
    });
    setErrors({});
    setIsEditing(false);
  };

  const renderPersonalInfo = () => (
    <div className="profile-section">
      <div className="form-grid">
        <div className="form-group">
          <label>
            <FaUser className="field-icon" />
            Full Name
          </label>
          {isEditing ? (
            <>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="error-text">{errors.full_name}</span>}
            </>
          ) : (
            <p className="field-value">{formData.full_name || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>
            <FaEnvelope className="field-icon" />
            Email Address
          </label>
          {isEditing ? (
            <>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </>
          ) : (
            <p className="field-value">{formData.email || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>
            <FaPhone className="field-icon" />
            Phone Number
          </label>
          {isEditing ? (
            <>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </>
          ) : (
            <p className="field-value">{formData.phone || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group full-width">
          <label>
            <FaMapMarkerAlt className="field-icon" />
            Address
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          ) : (
            <p className="field-value">{formData.address || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>District</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
            />
          ) : (
            <p className="field-value">{formData.district || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Sector</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
            />
          ) : (
            <p className="field-value">{formData.sector || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Cell</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.cell}
              onChange={(e) => handleInputChange('cell', e.target.value)}
            />
          ) : (
            <p className="field-value">{formData.cell || 'Not provided'}</p>
          )}
        </div>

        <div className="form-group">
          <label>Village</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.village}
              onChange={(e) => handleInputChange('village', e.target.value)}
            />
          ) : (
            <p className="field-value">{formData.village || 'Not provided'}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationPrefs = () => (
    <div className="profile-section">
      <div className="notification-settings">
        <h4>Notification Channels</h4>
        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.email_notifications}
              onChange={(e) => handleNotificationChange('email_notifications', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>Email Notifications</strong>
              <small>Receive updates via email</small>
            </span>
          </label>
        </div>

        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.sms_notifications}
              onChange={(e) => handleNotificationChange('sms_notifications', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>SMS Notifications</strong>
              <small>Receive updates via SMS (charges may apply)</small>
            </span>
          </label>
        </div>

        <h4>Notification Types</h4>
        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.claim_updates}
              onChange={(e) => handleNotificationChange('claim_updates', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>Claim Status Updates</strong>
              <small>Get notified when your claim status changes</small>
            </span>
          </label>
        </div>

        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.validation_updates}
              onChange={(e) => handleNotificationChange('validation_updates', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>Validation Updates</strong>
              <small>Get notified about community validations</small>
            </span>
          </label>
        </div>

        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.approval_updates}
              onChange={(e) => handleNotificationChange('approval_updates', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>Approval Decisions</strong>
              <small>Get notified about approval decisions</small>
            </span>
          </label>
        </div>

        <div className="pref-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={notificationPrefs.community_updates}
              onChange={(e) => handleNotificationChange('community_updates', e.target.checked)}
              disabled={!isEditing}
            />
            <span className="toggle-text">
              <strong>Community Updates</strong>
              <small>Get notified about community posts and discussions</small>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="resident-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <FaUser className="avatar-icon" />
          {isEditing && (
            <button className="change-avatar-btn" title="Change photo">
              <FaCamera />
            </button>
          )}
        </div>
        
        <div className="profile-title">
          <h2>{user?.full_name || 'Your Profile'}</h2>
          <p className="profile-role">Resident</p>
        </div>

        {!isEditing ? (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <FaEdit /> Edit Profile
          </button>
        ) : (
          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>
              <FaSave /> Save
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <FaUser /> Personal Info
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FaBell /> Notifications
        </button>
      </div>

      <div className="profile-body">
        {activeTab === 'personal' && renderPersonalInfo()}
        {activeTab === 'notifications' && renderNotificationPrefs()}
      </div>
    </div>
  );
};

export default ResidentProfile;
