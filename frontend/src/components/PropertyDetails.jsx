import React, { useState, useEffect } from 'react';
import { 
  transactionService, 
  valuationService, 
  taxService, 
  permitService,
  propertyUtils 
} from '../services/propertyService';
import './PropertyDetails.css';

const PropertyDetails = ({ claimId, parcelNumber, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState({
    transactions: [],
    valuations: [],
    taxAssessments: [],
    permits: []
  });

  useEffect(() => {
    if (claimId) {
      loadPropertyData();
    }
  }, [claimId]);

  const loadPropertyData = async () => {
    setLoading(true);
    try {
      const [transactions, valuations, taxAssessments, permits] = await Promise.all([
        transactionService.getTransactions({ claim_id: claimId }),
        valuationService.getValuations({ claim_id: claimId }),
        taxService.getTaxAssessments({ claim_id: claimId }),
        permitService.getPermits({ claim_id: claimId })
      ]);

      setPropertyData({
        transactions,
        valuations,
        taxAssessments,
        permits
      });
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    const latestValuation = propertyData.valuations[0];
    const pendingTransactions = propertyData.transactions.filter(t => t.status === 'pending');
    const overdueTaxes = propertyData.taxAssessments.filter(t => t.status === 'overdue');
    const activePermits = propertyData.permits.filter(p => p.status === 'approved');

    return (
      <div className="overview-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Latest Valuation</h4>
              <p className="stat-value">
                {latestValuation ? propertyUtils.formatCurrency(latestValuation.total_value) : 'Not valued'}
              </p>
              <p className="stat-date">
                {latestValuation && propertyUtils.formatDate(latestValuation.valuation_date)}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h4>Transactions</h4>
              <p className="stat-value">{propertyData.transactions.length}</p>
              <p className="stat-label">
                {pendingTransactions.length > 0 && `${pendingTransactions.length} pending`}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h4>Tax Status</h4>
              <p className="stat-value">{propertyData.taxAssessments.length} assessments</p>
              <p className={`stat-label ${overdueTaxes.length > 0 ? 'text-danger' : ''}`}>
                {overdueTaxes.length > 0 ? `${overdueTaxes.length} overdue` : 'Up to date'}
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h4>Permits</h4>
              <p className="stat-value">{activePermits.length} active</p>
              <p className="stat-label">{propertyData.permits.length} total</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => (
    <div className="transactions-section">
      {propertyData.transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found for this property</p>
        </div>
      ) : (
        <div className="transactions-list">
          {propertyData.transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-type">
                  <span className="type-badge">
                    {propertyUtils.formatTransactionType(transaction.transaction_type)}
                  </span>
                  <span className={`status-badge status-${propertyUtils.getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="transaction-amount">
                  {propertyUtils.formatCurrency(transaction.transaction_amount)}
                </div>
              </div>
              
              <div className="transaction-body">
                <div className="transaction-row">
                  <span className="label">Date:</span>
                  <span className="value">{propertyUtils.formatDate(transaction.transaction_date)}</span>
                </div>
                <div className="transaction-row">
                  <span className="label">From:</span>
                  <span className="value">{transaction.seller_name}</span>
                </div>
                <div className="transaction-row">
                  <span className="label">To:</span>
                  <span className="value">{transaction.buyer_name}</span>
                </div>
                {transaction.deed_number && (
                  <div className="transaction-row">
                    <span className="label">Deed:</span>
                    <span className="value">{transaction.deed_number}</span>
                  </div>
                )}
                {transaction.approved_by && (
                  <div className="transaction-row">
                    <span className="label">Approved by:</span>
                    <span className="value">{transaction.approved_by} on {propertyUtils.formatDate(transaction.approved_date)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderValuations = () => (
    <div className="valuations-section">
      {propertyData.valuations.length === 0 ? (
        <div className="empty-state">
          <p>No valuations found for this property</p>
        </div>
      ) : (
        <div className="valuations-list">
          {propertyData.valuations.map((valuation) => (
            <div key={valuation.id} className="valuation-card">
              <div className="valuation-header">
                <div className="valuation-title">
                  <h4>{propertyUtils.formatValuationMethod(valuation.valuation_method)}</h4>
                  <span className="valuation-purpose">{valuation.valuation_purpose}</span>
                </div>
                <div className="valuation-amount">
                  {propertyUtils.formatCurrency(valuation.total_value)}
                </div>
              </div>
              
              <div className="valuation-body">
                <div className="valuation-row">
                  <span className="label">Date:</span>
                  <span className="value">{propertyUtils.formatDate(valuation.valuation_date)}</span>
                </div>
                <div className="valuation-row">
                  <span className="label">Land Value:</span>
                  <span className="value">{propertyUtils.formatCurrency(valuation.land_value)}</span>
                </div>
                {valuation.improvement_value > 0 && (
                  <div className="valuation-row">
                    <span className="label">Improvements:</span>
                    <span className="value">{propertyUtils.formatCurrency(valuation.improvement_value)}</span>
                  </div>
                )}
                <div className="valuation-row">
                  <span className="label">Price/m²:</span>
                  <span className="value">{propertyUtils.formatCurrency(valuation.price_per_sqm)}</span>
                </div>
                {valuation.appraiser_name && (
                  <div className="valuation-row">
                    <span className="label">Appraiser:</span>
                    <span className="value">{valuation.appraiser_name}</span>
                  </div>
                )}
                {valuation.is_certified && (
                  <div className="certified-badge">
                    ✓ Certified Valuation
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTaxAssessments = () => (
    <div className="tax-section">
      {propertyData.taxAssessments.length === 0 ? (
        <div className="empty-state">
          <p>No tax assessments found for this property</p>
        </div>
      ) : (
        <div className="tax-list">
          {propertyData.taxAssessments.map((tax) => (
            <div key={tax.id} className="tax-card">
              <div className="tax-header">
                <div className="tax-year">
                  <h4>Tax Year {tax.tax_year}</h4>
                  <span className={`status-badge status-${propertyUtils.getStatusColor(tax.status)}`}>
                    {tax.status}
                  </span>
                </div>
                <div className="tax-amount">
                  <span className="amount-label">Total Due</span>
                  <span className="amount-value">{propertyUtils.formatCurrency(tax.total_due)}</span>
                </div>
              </div>
              
              <div className="tax-body">
                <div className="tax-row">
                  <span className="label">Assessment Date:</span>
                  <span className="value">{propertyUtils.formatDate(tax.assessment_date)}</span>
                </div>
                <div className="tax-row">
                  <span className="label">Due Date:</span>
                  <span className="value">{propertyUtils.formatDate(tax.due_date)}</span>
                </div>
                <div className="tax-row">
                  <span className="label">Base Tax:</span>
                  <span className="value">{propertyUtils.formatCurrency(tax.tax_amount)}</span>
                </div>
                {tax.penalty_amount > 0 && (
                  <div className="tax-row">
                    <span className="label">Penalties:</span>
                    <span className="value text-danger">{propertyUtils.formatCurrency(tax.penalty_amount)}</span>
                  </div>
                )}
                {tax.amount_paid > 0 && (
                  <div className="tax-row">
                    <span className="label">Paid:</span>
                    <span className="value text-success">{propertyUtils.formatCurrency(tax.amount_paid)}</span>
                  </div>
                )}
                <div className="tax-row">
                  <span className="label">Balance:</span>
                  <span className={`value ${tax.balance_due > 0 ? 'text-danger' : 'text-success'}`}>
                    {propertyUtils.formatCurrency(tax.balance_due)}
                  </span>
                </div>
                {tax.payment_reference && (
                  <div className="tax-row">
                    <span className="label">Payment Ref:</span>
                    <span className="value">{tax.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPermits = () => (
    <div className="permits-section">
      {propertyData.permits.length === 0 ? (
        <div className="empty-state">
          <p>No permits found for this property</p>
        </div>
      ) : (
        <div className="permits-list">
          {propertyData.permits.map((permit) => (
            <div key={permit.id} className="permit-card">
              <div className="permit-header">
                <div className="permit-title">
                  <h4>{propertyUtils.formatPermitType(permit.permit_type)}</h4>
                  <span className={`status-badge status-${propertyUtils.getStatusColor(permit.status)}`}>
                    {permit.status}
                  </span>
                </div>
                {permit.permit_number && (
                  <div className="permit-number">{permit.permit_number}</div>
                )}
              </div>
              
              <div className="permit-body">
                <div className="permit-row">
                  <span className="label">Application Date:</span>
                  <span className="value">{propertyUtils.formatDate(permit.application_date)}</span>
                </div>
                {permit.proposed_land_use && (
                  <div className="permit-row">
                    <span className="label">Proposed Use:</span>
                    <span className="value">{permit.proposed_land_use}</span>
                  </div>
                )}
                {permit.project_description && (
                  <div className="permit-description">
                    {permit.project_description}
                  </div>
                )}
                {permit.expiry_date && (
                  <div className="permit-row">
                    <span className="label">Expiry:</span>
                    <span className="value">
                      {propertyUtils.formatDate(permit.expiry_date)}
                      <span className="time-remaining">
                        {propertyUtils.getTimeRemaining(permit.expiry_date)}
                      </span>
                    </span>
                  </div>
                )}
                {permit.approved_by && (
                  <div className="permit-row">
                    <span className="label">Approved by:</span>
                    <span className="value">{permit.approved_by}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="property-details-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Property Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="property-info">
            <div className="info-item">
              <span className="info-label">Parcel Number:</span>
              <span className="info-value">{parcelNumber}</span>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transactions ({propertyData.transactions.length})
            </button>
            <button
              className={`tab ${activeTab === 'valuations' ? 'active' : ''}`}
              onClick={() => setActiveTab('valuations')}
            >
              Valuations ({propertyData.valuations.length})
            </button>
            <button
              className={`tab ${activeTab === 'tax' ? 'active' : ''}`}
              onClick={() => setActiveTab('tax')}
            >
              Tax ({propertyData.taxAssessments.length})
            </button>
            <button
              className={`tab ${activeTab === 'permits' ? 'active' : ''}`}
              onClick={() => setActiveTab('permits')}
            >
              Permits ({propertyData.permits.length})
            </button>
          </div>

          <div className="tab-content">
            {loading ? (
              <div className="loading-state">Loading property data...</div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'transactions' && renderTransactions()}
                {activeTab === 'valuations' && renderValuations()}
                {activeTab === 'tax' && renderTaxAssessments()}
                {activeTab === 'permits' && renderPermits()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
