import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaChartLine, FaMap, FaDatabase, FaCertificate, FaUsers, FaCog, FaSignOutAlt, FaBars, FaTimes, FaHome } from 'react-icons/fa';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { path: '/admin/overview', icon: <FaChartLine />, label: 'Overview' },
    { path: '/admin/gis-map', icon: <FaMap />, label: 'Master GIS Map' },
    { path: '/admin/registry', icon: <FaDatabase />, label: 'Registry Database' },
    { path: '/admin/certificates', icon: <FaCertificate />, label: 'Certificate Minting' },
    { path: '/admin/users', icon: <FaUsers />, label: 'User Roles' },
    { path: '/dashboard', icon: <FaHome />, label: 'Main Dashboard' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand">
            <FaMap className="brand-icon" />
            {sidebarOpen && <span className="brand-text">Land Registry</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <span className="nav-icon"><FaSignOutAlt /></span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="admin-header">
          <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className="header-right">
            <div className="user-info">
              <span className="user-role">Admin Portal</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
