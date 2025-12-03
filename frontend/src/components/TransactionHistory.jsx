import React, { useState, useEffect } from 'react';
import { transactionService, propertyUtils } from '../services/propertyService';
import './TransactionHistory.css';

const TransactionHistory = ({ claimId, userId, showFilters = true }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    transaction_type: '',
    status: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [claimId, userId, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const queryFilters = {};
      if (claimId) queryFilters.claim_id = claimId;
      if (filters.transaction_type) queryFilters.transaction_type = filters.transaction_type;
      if (filters.status) queryFilters.status = filters.status;

      const data = await transactionService.getTransactions(queryFilters);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const groupTransactionsByDate = () => {
    const grouped = {
      today: [],
      thisWeek: [],
      thisMonth: [],
      earlier: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    transactions.forEach(transaction => {
      const txDate = new Date(transaction.transaction_date);
      
      if (txDate >= today) {
        grouped.today.push(transaction);
      } else if (txDate >= weekAgo) {
        grouped.thisWeek.push(transaction);
      } else if (txDate >= monthAgo) {
        grouped.thisMonth.push(transaction);
      } else {
        grouped.earlier.push(transaction);
      }
    });

    return grouped;
  };

  const renderTransactionIcon = (type) => {
    const icons = {
      sale: '💵',
      transfer: '🔄',
      inheritance: '👨‍👩‍👧',
      gift: '🎁',
      lease: '📝',
      mortgage: '🏦'
    };
    return icons[type] || '📄';
  };

  const renderTimelineItem = (transaction) => (
    <div 
      key={transaction.id} 
      className="timeline-item"
      onClick={() => handleTransactionClick(transaction)}
    >
      <div className="timeline-marker">
        <div className="timeline-icon">
          {renderTransactionIcon(transaction.transaction_type)}
        </div>
      </div>
      
      <div className="timeline-content">
        <div className="timeline-header">
          <div className="timeline-title">
            <span className="transaction-type">
              {propertyUtils.formatTransactionType(transaction.transaction_type)}
            </span>
            <span className={`status-badge status-${propertyUtils.getStatusColor(transaction.status)}`}>
              {transaction.status}
            </span>
          </div>
          <div className="transaction-date">
            {propertyUtils.formatDate(transaction.transaction_date)}
          </div>
        </div>

        <div className="timeline-body">
          <div className="transaction-parties">
            <div className="party">
              <span className="party-label">From:</span>
              <span className="party-name">{transaction.seller_name}</span>
            </div>
            <div className="arrow">→</div>
            <div className="party">
              <span className="party-label">To:</span>
              <span className="party-name">{transaction.buyer_name}</span>
            </div>
          </div>

          {transaction.transaction_amount && (
            <div className="transaction-amount">
              {propertyUtils.formatCurrency(transaction.transaction_amount)}
            </div>
          )}

          {transaction.parcel_number && (
            <div className="parcel-info">
              Parcel: {transaction.parcel_number}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Transactions Found</h3>
          <p>There are no transactions matching your criteria.</p>
        </div>
      );
    }

    const grouped = groupTransactionsByDate();

    return (
      <div className="timeline">
        {grouped.today.length > 0 && (
          <div className="timeline-section">
            <h3 className="section-title">Today</h3>
            {grouped.today.map(renderTimelineItem)}
          </div>
        )}

        {grouped.thisWeek.length > 0 && (
          <div className="timeline-section">
            <h3 className="section-title">This Week</h3>
            {grouped.thisWeek.map(renderTimelineItem)}
          </div>
        )}

        {grouped.thisMonth.length > 0 && (
          <div className="timeline-section">
            <h3 className="section-title">This Month</h3>
            {grouped.thisMonth.map(renderTimelineItem)}
          </div>
        )}

        {grouped.earlier.length > 0 && (
          <div className="timeline-section">
            <h3 className="section-title">Earlier</h3>
            {grouped.earlier.map(renderTimelineItem)}
          </div>
        )}
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal || !selectedTransaction) return null;

    return (
      <div className="transaction-modal">
        <div className="modal-overlay" onClick={() => setShowModal(false)}></div>
        <div className="modal-content">
          <div className="modal-header">
            <h2>Transaction Details</h2>
            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
          </div>

          <div className="modal-body">
            <div className="detail-section">
              <h3>General Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">
                    {propertyUtils.formatTransactionType(selectedTransaction.transaction_type)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge status-${propertyUtils.getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {propertyUtils.formatDate(selectedTransaction.transaction_date)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Parcel Number:</span>
                  <span className="detail-value">{selectedTransaction.parcel_number}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Parties</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Seller:</span>
                  <span className="detail-value">{selectedTransaction.seller_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Buyer:</span>
                  <span className="detail-value">{selectedTransaction.buyer_name}</span>
                </div>
              </div>
            </div>

            {selectedTransaction.transaction_amount && (
              <div className="detail-section">
                <h3>Financial Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">
                      {propertyUtils.formatCurrency(selectedTransaction.transaction_amount)}
                    </span>
                  </div>
                  {selectedTransaction.tax_paid > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Tax Paid:</span>
                      <span className="detail-value">
                        {propertyUtils.formatCurrency(selectedTransaction.tax_paid)}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.registration_fee > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Registration Fee:</span>
                      <span className="detail-value">
                        {propertyUtils.formatCurrency(selectedTransaction.registration_fee)}
                      </span>
                    </div>
                  )}
                  {selectedTransaction.price_per_sqm && (
                    <div className="detail-item">
                      <span className="detail-label">Price per m²:</span>
                      <span className="detail-value">
                        {propertyUtils.formatCurrency(selectedTransaction.price_per_sqm)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(selectedTransaction.deed_number || selectedTransaction.contract_reference || selectedTransaction.notary_name) && (
              <div className="detail-section">
                <h3>Legal Information</h3>
                <div className="detail-grid">
                  {selectedTransaction.deed_number && (
                    <div className="detail-item">
                      <span className="detail-label">Deed Number:</span>
                      <span className="detail-value">{selectedTransaction.deed_number}</span>
                    </div>
                  )}
                  {selectedTransaction.contract_reference && (
                    <div className="detail-item">
                      <span className="detail-label">Contract Reference:</span>
                      <span className="detail-value">{selectedTransaction.contract_reference}</span>
                    </div>
                  )}
                  {selectedTransaction.notary_name && (
                    <div className="detail-item">
                      <span className="detail-label">Notary:</span>
                      <span className="detail-value">{selectedTransaction.notary_name}</span>
                    </div>
                  )}
                  {selectedTransaction.witness_names && selectedTransaction.witness_names.length > 0 && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Witnesses:</span>
                      <span className="detail-value">{selectedTransaction.witness_names.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTransaction.approved_by && (
              <div className="detail-section">
                <h3>Approval Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Approved By:</span>
                    <span className="detail-value">{selectedTransaction.approved_by}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Approved Date:</span>
                    <span className="detail-value">
                      {propertyUtils.formatDate(selectedTransaction.approved_date)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedTransaction.rejection_reason && (
              <div className="detail-section">
                <h3>Rejection Reason</h3>
                <div className="rejection-box">
                  {selectedTransaction.rejection_reason}
                </div>
              </div>
            )}

            {selectedTransaction.notes && (
              <div className="detail-section">
                <h3>Notes</h3>
                <div className="notes-box">
                  {selectedTransaction.notes}
                </div>
              </div>
            )}

            {selectedTransaction.conditions && selectedTransaction.conditions.length > 0 && (
              <div className="detail-section">
                <h3>Conditions</h3>
                <ul className="conditions-list">
                  {selectedTransaction.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="transaction-history">
      {showFilters && (
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filters.transaction_type}
              onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="sale">Sale</option>
              <option value="transfer">Transfer</option>
              <option value="inheritance">Inheritance</option>
              <option value="gift">Gift</option>
              <option value="lease">Lease</option>
              <option value="mortgage">Mortgage</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="transaction-count">
            {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>
      )}

      {renderTimeline()}
      {renderModal()}
    </div>
  );
};

export default TransactionHistory;
