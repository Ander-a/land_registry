import React, { useState, useEffect } from 'react';
import { 
  transactionService, 
  valuationService, 
  taxService, 
  permitService,
  propertyUtils 
} from '../services/propertyService';
import TransactionHistory from '../components/TransactionHistory';
import './PropertyManagement.css';

const PropertyManagement = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [stats, setStats] = useState({
    transactions: null,
    valuations: null,
    taxes: null,
    permits: null
  });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const isLeader = user.role === 'local_leader';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (isAdmin || isLeader) {
        const [transactionStats, valuationStats, taxStats, permitStats] = await Promise.all([
          transactionService.getTransactionStats(),
          valuationService.getValuationStats(),
          taxService.getTaxStats(),
          permitService.getPermitStats()
        ]);

        setStats({
          transactions: transactionStats,
          valuations: valuationStats,
          taxes: taxStats,
          permits: permitStats
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-section">
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">🔄</div>
            <h3>Transactions</h3>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats.transactions?.total_transactions || 0}</div>
            <div className="stat-breakdown">
              <div className="breakdown-item">
                <span className="label">Pending:</span>
                <span className="value">{stats.transactions?.pending_transactions || 0}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Completed:</span>
                <span className="value">{stats.transactions?.completed_transactions || 0}</span>
              </div>
            </div>
            {stats.transactions?.total_value > 0 && (
              <div className="stat-footer">
                Total Value: {propertyUtils.formatCurrency(stats.transactions.total_value)}
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">📊</div>
            <h3>Valuations</h3>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats.valuations?.total_valuations || 0}</div>
            {stats.valuations?.average_land_value > 0 && (
              <div className="stat-breakdown">
                <div className="breakdown-item">
                  <span className="label">Avg Value:</span>
                  <span className="value">
                    {propertyUtils.formatCurrency(stats.valuations.average_land_value)}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Avg/m²:</span>
                  <span className="value">
                    {propertyUtils.formatCurrency(stats.valuations.average_price_per_sqm)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <h3>Tax Collection</h3>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats.taxes?.total_assessments || 0}</div>
            <div className="stat-breakdown">
              <div className="breakdown-item">
                <span className="label">Collected:</span>
                <span className="value text-success">
                  {propertyUtils.formatCurrency(stats.taxes?.total_collected || 0)}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="label">Outstanding:</span>
                <span className="value text-danger">
                  {propertyUtils.formatCurrency(stats.taxes?.total_outstanding || 0)}
                </span>
              </div>
            </div>
            {stats.taxes?.collection_rate >= 0 && (
              <div className="stat-footer">
                Collection Rate: {stats.taxes.collection_rate.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">📋</div>
            <h3>Permits</h3>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats.permits?.total_permits || 0}</div>
            <div className="stat-breakdown">
              <div className="breakdown-item">
                <span className="label">Pending:</span>
                <span className="value">{stats.permits?.pending_permits || 0}</span>
              </div>
              <div className="breakdown-item">
                <span className="label">Approved:</span>
                <span className="value">{stats.permits?.approved_permits || 0}</span>
              </div>
            </div>
            {stats.permits?.total_fees_collected > 0 && (
              <div className="stat-footer">
                Fees Collected: {propertyUtils.formatCurrency(stats.permits.total_fees_collected)}
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.transactions?.transactions_by_type && (
        <div className="chart-section">
          <h3>Transactions by Type</h3>
          <div className="chart-bars">
            {Object.entries(stats.transactions.transactions_by_type).map(([type, count]) => (
              <div key={type} className="chart-bar">
                <div className="bar-label">{propertyUtils.formatTransactionType(type)}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${(count / stats.transactions.total_transactions) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="bar-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.permits?.permits_by_type && (
        <div className="chart-section">
          <h3>Permits by Type</h3>
          <div className="chart-bars">
            {Object.entries(stats.permits.permits_by_type).map(([type, count]) => (
              <div key={type} className="chart-bar">
                <div className="bar-label">{propertyUtils.formatPermitType(type)}</div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ 
                      width: `${(count / stats.permits.total_permits) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="bar-value">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="transactions-section">
      <div className="section-header">
        <h2>All Transactions</h2>
      </div>
      <TransactionHistory showFilters={true} />
    </div>
  );

  const renderTaxOverview = () => (
    <div className="tax-overview-section">
      <div className="section-header">
        <h2>Tax Overview</h2>
      </div>
      <TaxOverview />
    </div>
  );

  const renderPermits = () => (
    <div className="permits-section">
      <div className="section-header">
        <h2>Permit Management</h2>
      </div>
      <PermitManagement />
    </div>
  );

  return (
    <div className="property-management">
      <div className="page-header">
        <h1>Property Management</h1>
        <p>Manage transactions, valuations, tax assessments, and permits</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={`tab ${activeTab === 'tax' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax')}
        >
          Tax Overview
        </button>
        <button
          className={`tab ${activeTab === 'permits' ? 'active' : ''}`}
          onClick={() => setActiveTab('permits')}
        >
          Permits
        </button>
      </div>

      <div className="tab-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'tax' && renderTaxOverview()}
            {activeTab === 'permits' && renderPermits()}
          </>
        )}
      </div>
    </div>
  );
};

// Tax Overview Component
const TaxOverview = () => {
  const [taxAssessments, setTaxAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTaxAssessments();
  }, [filter]);

  const loadTaxAssessments = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const data = await taxService.getTaxAssessments(filters);
      setTaxAssessments(data);
    } catch (error) {
      console.error('Error loading tax assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tax-overview">
      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Assessments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="partially_paid">Partially Paid</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading tax assessments...</div>
      ) : taxAssessments.length === 0 ? (
        <div className="empty-state">No tax assessments found</div>
      ) : (
        <div className="tax-list">
          {taxAssessments.map((tax) => (
            <div key={tax.id} className="tax-item">
              <div className="tax-info">
                <h4>{tax.owner_name}</h4>
                <p>Tax Year: {tax.tax_year} | Parcel: {tax.parcel_number}</p>
              </div>
              <div className="tax-amounts">
                <div className="amount-item">
                  <span className="amount-label">Total Due:</span>
                  <span className="amount-value">{propertyUtils.formatCurrency(tax.total_due)}</span>
                </div>
                <div className="amount-item">
                  <span className="amount-label">Balance:</span>
                  <span className={`amount-value ${tax.balance_due > 0 ? 'text-danger' : 'text-success'}`}>
                    {propertyUtils.formatCurrency(tax.balance_due)}
                  </span>
                </div>
              </div>
              <div className="tax-status">
                <span className={`status-badge status-${propertyUtils.getStatusColor(tax.status)}`}>
                  {tax.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Permit Management Component
const PermitManagement = () => {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPermits();
  }, [filter]);

  const loadPermits = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const data = await permitService.getPermits(filters);
      setPermits(data);
    } catch (error) {
      console.error('Error loading permits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="permit-management">
      <div className="filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Permits</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading permits...</div>
      ) : permits.length === 0 ? (
        <div className="empty-state">No permits found</div>
      ) : (
        <div className="permits-grid">
          {permits.map((permit) => (
            <div key={permit.id} className="permit-card">
              <div className="permit-header">
                <h4>{propertyUtils.formatPermitType(permit.permit_type)}</h4>
                <span className={`status-badge status-${propertyUtils.getStatusColor(permit.status)}`}>
                  {permit.status}
                </span>
              </div>
              <div className="permit-body">
                <p><strong>Owner:</strong> {permit.owner_name}</p>
                <p><strong>Parcel:</strong> {permit.parcel_number}</p>
                {permit.permit_number && (
                  <p><strong>Permit #:</strong> {permit.permit_number}</p>
                )}
                <p><strong>Applied:</strong> {propertyUtils.formatDate(permit.application_date)}</p>
                {permit.expiry_date && (
                  <p className="expiry">
                    <strong>Expires:</strong> {propertyUtils.formatDate(permit.expiry_date)}
                    <span className="time-badge">
                      {propertyUtils.getTimeRemaining(permit.expiry_date)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;
