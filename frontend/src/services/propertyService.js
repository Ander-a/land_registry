import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Configure axios with auth token
const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============= TRANSACTION SERVICES =============

export const transactionService = {
  // Create new transaction
  async createTransaction(transactionData) {
    const response = await apiClient.post('/transactions/', transactionData);
    return response.data;
  },

  // Get transactions with filters
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.claim_id) params.append('claim_id', filters.claim_id);
    if (filters.parcel_number) params.append('parcel_number', filters.parcel_number);
    if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await apiClient.get(`/transactions/?${params.toString()}`);
    return response.data;
  },

  // Get specific transaction
  async getTransaction(transactionId) {
    const response = await apiClient.get(`/transactions/${transactionId}`);
    return response.data;
  },

  // Update transaction (admin/leader only)
  async updateTransaction(transactionId, updateData) {
    const response = await apiClient.put(`/transactions/${transactionId}`, updateData);
    return response.data;
  },

  // Get transaction statistics
  async getTransactionStats() {
    const response = await apiClient.get('/transactions/stats/summary');
    return response.data;
  },

  // Approve transaction
  async approveTransaction(transactionId) {
    return this.updateTransaction(transactionId, { status: 'approved' });
  },

  // Reject transaction
  async rejectTransaction(transactionId, rejectionReason) {
    return this.updateTransaction(transactionId, { 
      status: 'rejected',
      rejection_reason: rejectionReason 
    });
  }
};

// ============= VALUATION SERVICES =============

export const valuationService = {
  // Create property valuation
  async createValuation(valuationData) {
    const response = await apiClient.post('/property/valuations', valuationData);
    return response.data;
  },

  // Get valuations with filters
  async getValuations(filters = {}) {
    const params = new URLSearchParams();
    if (filters.claim_id) params.append('claim_id', filters.claim_id);
    if (filters.parcel_number) params.append('parcel_number', filters.parcel_number);
    if (filters.purpose) params.append('purpose', filters.purpose);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await apiClient.get(`/property/valuations?${params.toString()}`);
    return response.data;
  },

  // Get valuation statistics
  async getValuationStats() {
    const response = await apiClient.get('/property/valuations/stats');
    return response.data;
  }
};

// ============= TAX ASSESSMENT SERVICES =============

export const taxService = {
  // Create tax assessment
  async createTaxAssessment(taxData) {
    const response = await apiClient.post('/property/tax-assessments', taxData);
    return response.data;
  },

  // Get tax assessments with filters
  async getTaxAssessments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.owner_id) params.append('owner_id', filters.owner_id);
    if (filters.tax_year) params.append('tax_year', filters.tax_year);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await apiClient.get(`/property/tax-assessments?${params.toString()}`);
    return response.data;
  },

  // Record tax payment
  async recordPayment(assessmentId, paymentData) {
    const response = await apiClient.post(
      `/property/tax-assessments/${assessmentId}/payment`,
      paymentData
    );
    return response.data;
  },

  // Get tax statistics
  async getTaxStats() {
    const response = await apiClient.get('/property/tax-assessments/stats');
    return response.data;
  }
};

// ============= PERMIT SERVICES =============

export const permitService = {
  // Create permit application
  async createPermit(permitData) {
    const response = await apiClient.post('/property/permits', permitData);
    return response.data;
  },

  // Get permits with filters
  async getPermits(filters = {}) {
    const params = new URLSearchParams();
    if (filters.owner_id) params.append('owner_id', filters.owner_id);
    if (filters.permit_type) params.append('permit_type', filters.permit_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.skip) params.append('skip', filters.skip);

    const response = await apiClient.get(`/property/permits?${params.toString()}`);
    return response.data;
  },

  // Review permit (admin/leader only)
  async reviewPermit(permitId, reviewData) {
    const response = await apiClient.put(`/property/permits/${permitId}/review`, reviewData);
    return response.data;
  },

  // Get permit statistics
  async getPermitStats() {
    const response = await apiClient.get('/property/permits/stats');
    return response.data;
  },

  // Approve permit
  async approvePermit(permitId, approvalData) {
    return this.reviewPermit(permitId, {
      status: 'approved',
      ...approvalData
    });
  },

  // Reject permit
  async rejectPermit(permitId, rejectionReason) {
    return this.reviewPermit(permitId, {
      status: 'rejected',
      rejection_reason: rejectionReason
    });
  }
};

// ============= UTILITY FUNCTIONS =============

export const propertyUtils = {
  // Format currency (RWF)
  formatCurrency(amount) {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  },

  // Format date
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Format transaction type
  formatTransactionType(type) {
    const typeMap = {
      sale: 'Sale',
      transfer: 'Transfer',
      inheritance: 'Inheritance',
      gift: 'Gift',
      lease: 'Lease',
      mortgage: 'Mortgage'
    };
    return typeMap[type] || type;
  },

  // Get status badge color
  getStatusColor(status) {
    const colorMap = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      completed: 'success',
      cancelled: 'secondary',
      paid: 'success',
      overdue: 'danger',
      partially_paid: 'warning',
      waived: 'info',
      disputed: 'warning',
      draft: 'secondary',
      submitted: 'info',
      under_review: 'warning',
      expired: 'secondary',
      revoked: 'danger',
      renewed: 'success'
    };
    return colorMap[status] || 'secondary';
  },

  // Get priority color
  getPriorityColor(priority) {
    const colorMap = {
      urgent: 'danger',
      high: 'warning',
      medium: 'info',
      low: 'secondary'
    };
    return colorMap[priority] || 'secondary';
  },

  // Format valuation method
  formatValuationMethod(method) {
    const methodMap = {
      market_comparison: 'Market Comparison',
      cost_approach: 'Cost Approach',
      income_approach: 'Income Approach',
      automated_valuation: 'Automated Valuation',
      professional_appraisal: 'Professional Appraisal'
    };
    return methodMap[method] || method;
  },

  // Format permit type
  formatPermitType(type) {
    const typeMap = {
      construction: 'Construction',
      subdivision: 'Subdivision',
      zoning_change: 'Zoning Change',
      environmental: 'Environmental',
      agricultural: 'Agricultural',
      commercial: 'Commercial',
      residential: 'Residential',
      mining: 'Mining',
      forestry: 'Forestry'
    };
    return typeMap[type] || type;
  },

  // Calculate time remaining
  getTimeRemaining(expiryDate) {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays < 30) return `Expires in ${diffDays} days`;
    if (diffDays < 365) return `Expires in ${Math.floor(diffDays / 30)} months`;
    return `Expires in ${Math.floor(diffDays / 365)} years`;
  }
};

export default {
  transactionService,
  valuationService,
  taxService,
  permitService,
  propertyUtils
};
