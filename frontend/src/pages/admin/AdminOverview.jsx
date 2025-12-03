import React, { useState, useEffect } from 'react';
import { FaBuilding, FaClipboardCheck, FaCertificate, FaUsers, FaDownload } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import StatCard from '../../components/StatCard';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import { analyticsService, analyticsUtils } from '../../services/analyticsService';
import './AdminOverview.css';

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState(null);
  const [registrationTrends, setRegistrationTrends] = useState([]);
  const [departmentActivity, setDepartmentActivity] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [overview, trends, departments, activities] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRegistrationTrends(6),
        analyticsService.getDepartmentActivity(),
        analyticsService.getActivityLog(20)
      ]);

      setOverviewStats(overview);
      setRegistrationTrends(trends.trends);
      setDepartmentActivity(departments);
      setActivityLog(activities.activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportType) => {
    try {
      await analyticsService.generateReport({
        reportType,
        format: 'csv'
      });
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  // Prepare department data for bar chart
  const departmentChartData = departmentActivity ? [
    { name: 'Surveying', value: departmentActivity.surveying },
    { name: 'Legal', value: departmentActivity.legal },
    { name: 'Issuance', value: departmentActivity.issuance },
    { name: 'Records', value: departmentActivity.records }
  ] : [];

  return (
    <AdminLayout>
      <div className="admin-overview">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">System Overview & Analytics</p>
          </div>
          <button 
            className="generate-report-btn"
            onClick={() => setShowReportModal(true)}
          >
            <FaDownload /> Generate Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Properties"
            value={overviewStats?.total_properties || 0}
            trend={overviewStats?.properties_growth}
            icon={<FaBuilding />}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Pending Approvals"
            value={overviewStats?.pending_approvals || 0}
            trend={overviewStats?.approvals_growth}
            icon={<FaClipboardCheck />}
            color="yellow"
            loading={loading}
          />
          <StatCard
            title="Certificates Issued"
            value={overviewStats?.total_certificates || 0}
            trend={overviewStats?.certificates_growth}
            icon={<FaCertificate />}
            color="green"
            loading={loading}
          />
          <StatCard
            title="Active Users"
            value={overviewStats?.active_users || 0}
            trend={overviewStats?.users_growth}
            icon={<FaUsers />}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card full-width">
            <LineChart
              title="Land Registrations Over Time (6 Months)"
              data={registrationTrends}
              dataKeys={[
                { key: 'registrations', name: 'Registrations' },
                { key: 'approvals', name: 'Approvals' },
                { key: 'certificates', name: 'Certificates' }
              ]}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              height={320}
            />
          </div>

          <div className="chart-card">
            <BarChart
              title="Department Activity (Last 30 Days)"
              data={departmentChartData}
              dataKeys={[
                { key: 'value', name: 'Activities' }
              ]}
              colors={['#6366f1']}
              height={320}
            />
          </div>
        </div>

        {/* Activity Log */}
        <div className="activity-log-section">
          <div className="section-header">
            <h2 className="section-title">Recent Activity</h2>
            <button className="view-all-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>

          <div className="activity-log-table">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <span className="activity-icon">
                        {analyticsUtils.getActivityIcon(activity.type)}
                      </span>
                    </td>
                    <td>
                      <span className="activity-action">{activity.action}</span>
                    </td>
                    <td>{activity.user}</td>
                    <td className="activity-details">{activity.details}</td>
                    <td>
                      <span className={`status-badge ${analyticsUtils.getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="activity-time">
                      {analyticsUtils.timeAgo(activity.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Generation Modal */}
        {showReportModal && (
          <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Generate Report</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowReportModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>Select the type of report to generate:</p>
                <div className="report-options">
                  <button 
                    className="report-option-btn"
                    onClick={() => handleGenerateReport('properties')}
                  >
                    <FaBuilding />
                    <span>Properties Report</span>
                  </button>
                  <button 
                    className="report-option-btn"
                    onClick={() => handleGenerateReport('transactions')}
                  >
                    <FaClipboardCheck />
                    <span>Transactions Report</span>
                  </button>
                  <button 
                    className="report-option-btn"
                    onClick={() => handleGenerateReport('certificates')}
                  >
                    <FaCertificate />
                    <span>Certificates Report</span>
                  </button>
                  <button 
                    className="report-option-btn"
                    onClick={() => handleGenerateReport('taxes')}
                  >
                    <FaUsers />
                    <span>Tax Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
