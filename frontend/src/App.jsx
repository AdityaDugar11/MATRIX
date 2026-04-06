import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Analytics from './components/Analytics';
import CLITerminal from './components/CLITerminal';
import { api } from './utils/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setDashboardData(data);
      setTransactions(data.recent_transactions || []);
      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Unable to connect to FlowGuard backend. Using demo mode.');
      // Use mock data for demo
      setDashboardData(getMockData());
      setTransactions(getMockData().recent_transactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // API handlers
  const handleSend = async (paymentData) => {
    try {
      const result = await api.sendPayment(paymentData);
      // Refresh dashboard after payment
      setTimeout(fetchDashboard, 500);
      return result;
    } catch (err) {
      // Demo fallback
      return generateMockPaymentResult(paymentData);
    }
  };

  const handleAnalyze = async (txId) => {
    try {
      return await api.analyzeTransaction(txId);
    } catch {
      return generateMockAnalysis(txId);
    }
  };

  const handleOptimize = async (data) => {
    try {
      return await api.optimizeRoute(data);
    } catch {
      return generateMockRouteOptimization(data);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard data={dashboardData} loading={loading} onRefresh={fetchDashboard} />;
      case 'send':
        return <TransactionForm onSend={handleSend} />;
      case 'transactions':
        return <TransactionHistory transactions={transactions} onAnalyze={handleAnalyze} />;
      case 'analytics':
        return <Analytics data={dashboardData} />;
      case 'cli':
        return <CLITerminal onSend={handleSend} onAnalyze={handleAnalyze} onOptimize={handleOptimize} data={dashboardData} />;
      default:
        return <Dashboard data={dashboardData} loading={loading} onRefresh={fetchDashboard} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>
        <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1.1rem' }}>FlowGuard AI</span>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav" onClick={e => e.stopPropagation()}>
            {['dashboard', 'send', 'transactions', 'analytics', 'cli'].map(tab => (
              <button
                key={tab}
                className={`mobile-nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
              >
                {tab === 'dashboard' ? '📊' : tab === 'send' ? '💸' : tab === 'transactions' ? '📋' : tab === 'analytics' ? '🔍' : '💻'}
                {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {error && (
          <div className="demo-banner animate-fade-in" id="demo-banner">
            <span>⚡</span>
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

// ─── Mock Data Fallbacks ───────────────────────────────────────────────────
function getMockData() {
  const now = new Date();
  const transactions = [];
  const statuses = ['completed', 'completed', 'completed', 'completed', 'flagged', 'blocked'];
  const methods = ['upi', 'upi', 'imps', 'neft', 'stablecoin', 'swift'];
  const riskLevels = ['LOW', 'LOW', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const recipients = ['rahul@okaxis', 'priya@ybl', 'merchant.coffee@okaxis', 'amit@paytm', 'scammer_suspicious@fake', 'unknown_offshore@intl'];

  for (let i = 0; i < 20; i++) {
    const idx = i % 6;
    transactions.push({
      id: `TXN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      amount: Math.round(Math.random() * 50000 + 100),
      currency: i < 16 ? 'INR' : 'USD',
      recipient: recipients[idx],
      payment_method: methods[idx],
      timestamp: new Date(now - i * 3600000 * Math.random() * 24).toISOString(),
      status: statuses[idx],
      risk_level: riskLevels[idx],
      risk_score: [0.05, 0.08, 0.12, 0.42, 0.72, 0.95][idx],
      is_cross_border: i >= 16,
      location: 'Mumbai',
    });
  }

  return {
    summary: {
      total_balance_inr: 352180.50,
      balances: { INR: 250000, USDC: 1200, USD: 500 },
      financial_health_score: 78,
      total_transactions: 50,
      flagged_transactions: 3,
      total_spent_30d: 145000,
      savings_rate: 0.44,
      risk_profile: 'moderate',
    },
    recent_transactions: transactions,
    agent_logs: [
      { timestamp: new Date(now - 300000).toISOString(), action: 'ROUTE_OPTIMIZED', message: 'Routed ₹15,000 via UPI instead of NEFT — saved ₹12 in fees', confidence: 0.95 },
      { timestamp: new Date(now - 720000).toISOString(), action: 'FRAUD_BLOCKED', message: 'Blocked suspicious ₹4,99,000 to unknown_offshore@intl', confidence: 0.92 },
      { timestamp: new Date(now - 1800000).toISOString(), action: 'INSIGHT_GENERATED', message: 'Dining expenses 40% above monthly average', confidence: 0.88 },
      { timestamp: new Date(now - 3600000).toISOString(), action: 'COMPLIANCE_CHECK', message: 'AML/KYC verification passed for merchant.amazon@apl', confidence: 0.99 },
      { timestamp: new Date(now - 7200000).toISOString(), action: 'STABLECOIN_SWAP', message: 'Converted ₹8,500 → 101.2 USDC for cross-border — 60% lower fees', confidence: 0.94 },
    ],
    risk_heatmap: Array.from({ length: 30 }, (_, i) => ({
      hour: i % 24,
      day: Math.floor(i / 4) % 7,
      count: Math.floor(Math.random() * 5),
      avg_risk: Math.random() * 0.5,
      total_amount: Math.random() * 50000,
    })),
    user: {
      name: 'Aditya Dugar',
      financial_health_score: 78,
      monthly_spending: 45000,
      monthly_income: 80000,
    },
  };
}

function generateMockPaymentResult(data) {
  const isSuspicious = data.recipient?.includes('suspicious') || data.recipient?.includes('offshore');
  const isHighAmount = data.amount > 100000;
  const riskScore = isSuspicious ? 0.92 : isHighAmount ? 0.55 : 0.08;
  const riskLevel = riskScore > 0.8 ? 'CRITICAL' : riskScore > 0.6 ? 'HIGH' : riskScore > 0.35 ? 'MEDIUM' : 'LOW';
  const status = riskLevel === 'CRITICAL' ? 'blocked' : riskLevel === 'HIGH' ? 'flagged' : 'completed';

  return {
    transaction: {
      id: `TXN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      amount: data.amount,
      currency: data.currency,
      recipient: data.recipient,
      status,
    },
    fraud_analysis: {
      risk_score: riskScore,
      risk_level: riskLevel,
      ml_anomaly_score: -0.15,
      confidence: 0.89,
      processing_time_ms: 2.3,
      explanations: isSuspicious 
        ? ['Suspicious recipient flagged', 'Amount exceeds normal patterns', 'First-time transfer to this account']
        : ['Transaction appears normal based on historical patterns'],
    },
    routing: {
      optimal_route: {
        name: data.currency === 'INR' ? 'UPI (Unified Payments Interface)' : 'Stablecoin Transfer (USDC)',
        fee_display: data.currency === 'INR' ? '₹0.00' : `$${(data.amount * 0.001).toFixed(2)}`,
        speed: data.currency === 'INR' ? 'instant' : '30 seconds',
        reliability: 0.99,
      },
      explanation: data.currency === 'INR' 
        ? 'Routing via UPI with zero fees — instant settlement'
        : 'Stablecoin selected for cross-border: 60% lower fees than SWIFT',
    },
    ai_analysis: isSuspicious
      ? '🛑 BLOCKED: This transaction exhibits multiple high-risk indicators including an unverified recipient and unusual amount. Recommend enhanced KYC verification before proceeding.'
      : '✅ APPROVED: Transaction follows normal behavioral patterns. Route optimized for lowest fees with instant settlement via UPI.',
    status,
  };
}

function generateMockAnalysis(txId) {
  return {
    transaction: { id: txId },
    fraud_analysis: {
      risk_score: 0.12,
      risk_level: 'LOW',
      ml_anomaly_score: 0.234,
      confidence: 0.91,
      processing_time_ms: 1.8,
      explanations: ['Transaction appears normal based on historical patterns'],
    },
    ai_analysis: 'This transaction follows established behavioral patterns for this user profile. No anomalies detected across 6 risk dimensions.',
  };
}

function generateMockRouteOptimization(data) {
  const isDomestic = data.destination === 'domestic';
  return {
    optimal_route: {
      name: isDomestic ? 'UPI (Unified Payments Interface)' : 'Stablecoin Transfer (USDC)',
      fee_display: isDomestic ? '₹0.00' : `$${(data.amount * 0.001).toFixed(2)}`,
      speed: isDomestic ? 'instant' : '30 seconds',
      reliability: 0.99,
      calculated_fee: isDomestic ? 0 : data.amount * 0.001,
    },
    alternatives: isDomestic ? [
      { name: 'IMPS', fee_display: '₹5.00', speed: 'instant' },
      { name: 'NEFT', fee_display: '₹2.50', speed: '30 minutes' },
    ] : [
      { name: 'SWIFT International', fee_display: `$${(data.amount * 0.025 + 25).toFixed(2)}`, speed: '1-3 business days' },
      { name: 'Wire Transfer', fee_display: `$${(data.amount * 0.015 + 15).toFixed(2)}`, speed: '1-2 business days' },
    ],
    explanation: isDomestic
      ? 'Routing via UPI with zero fees — instant settlement'
      : `Stablecoin saves $${((data.amount * 0.025 + 25) - data.amount * 0.001).toFixed(2)} vs SWIFT with near-instant settlement`,
    savings_vs_worst: {
      amount: isDomestic ? 5 : data.amount * 0.024 + 24.5,
      percentage: isDomestic ? 100 : 96,
    },
  };
}

export default App;
