/**
 * FlowGuard AI — API Client
 * Handles all backend communication
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`FlowGuard API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getDashboard: () => request('/api/dashboard'),
  
  // Transactions
  getTransactions: (limit = 50, offset = 0) => 
    request(`/api/transactions?limit=${limit}&offset=${offset}`),
  getTransaction: (id) => request(`/api/transactions/${id}`),
  
  // Payment
  sendPayment: (data) => request('/api/send', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Analysis
  analyzeTransaction: (txId) => request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ transaction_id: txId }),
  }),
  
  // Route Optimization
  optimizeRoute: (data) => request('/api/optimize', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // AI Agent
  aiChat: (message, context = '') => request('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  }),
  getInsight: () => request('/api/ai/insight'),
  
  // Fraud
  scoreFraud: (transaction) => request('/api/fraud/score', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  
  // Other
  getBalance: () => request('/api/balance'),
  getAgentLogs: (limit = 20) => request(`/api/agent-logs?limit=${limit}`),
  getRiskHeatmap: () => request('/api/risk-heatmap'),
  getRates: () => request('/api/rates'),
  getHealth: () => request('/health'),
};

export default api;
