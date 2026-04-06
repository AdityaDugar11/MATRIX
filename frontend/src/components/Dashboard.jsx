import { useState, useEffect } from 'react';
import { formatCurrency, formatTime, getRiskBadgeClass, getStatusBadgeClass } from '../utils/format';
import './Dashboard.css';

export default function Dashboard({ data, loading, onRefresh }) {
  const [animatedBalance, setAnimatedBalance] = useState(0);
  
  const summary = data?.summary || {};
  const transactions = data?.recent_transactions || [];
  const agentLogs = data?.agent_logs || [];
  const user = data?.user || {};

  // Animate balance counter
  useEffect(() => {
    if (!summary.total_balance_inr) return;
    const target = summary.total_balance_inr;
    const duration = 1500;
    const start = Date.now();
    const initial = animatedBalance;
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedBalance(initial + (target - initial) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [summary.total_balance_inr]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card glass-card">
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 28 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'ROUTE_OPTIMIZED': return '🔀';
      case 'FRAUD_BLOCKED': return '🛑';
      case 'FRAUD_FLAGGED': return '⚠️';
      case 'INSIGHT_GENERATED': return '💡';
      case 'COMPLIANCE_CHECK': return '✅';
      case 'STABLECOIN_SWAP': return '🔄';
      default: return '🤖';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'FRAUD_BLOCKED': return 'var(--danger)';
      case 'FRAUD_FLAGGED': return 'var(--warning)';
      case 'ROUTE_OPTIMIZED': return 'var(--info)';
      case 'INSIGHT_GENERATED': return 'var(--primary-400)';
      case 'COMPLIANCE_CHECK': return 'var(--success)';
      case 'STABLECOIN_SWAP': return 'var(--accent-400)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1>Welcome back, <span className="gradient-text">{user.name?.split(' ')[0] || 'User'}</span></h1>
          <p>Your payment operations at a glance</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} id="refresh-dashboard">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card animate-slide-up stagger-1" id="stat-balance">
          <div className="stat-header">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Total Balance</span>
          </div>
          <div className="stat-value">{formatCurrency(animatedBalance)}</div>
          <div className="stat-detail">
            {Object.entries(summary.balances || {}).map(([cur, amt]) => (
              <span key={cur} className="balance-chip">{formatCurrency(amt, cur)}</span>
            ))}
          </div>
        </div>

        <div className="stat-card glass-card animate-slide-up stagger-2" id="stat-health">
          <div className="stat-header">
            <span className="stat-icon">❤️</span>
            <span className="stat-label">Financial Health</span>
          </div>
          <div className="stat-value">{summary.financial_health_score || 78}<span className="stat-unit">/100</span></div>
          <div className="health-bar">
            <div 
              className="health-fill" 
              style={{ width: `${summary.financial_health_score || 78}%` }}
            />
          </div>
        </div>

        <div className="stat-card glass-card animate-slide-up stagger-3" id="stat-transactions">
          <div className="stat-header">
            <span className="stat-icon">📊</span>
            <span className="stat-label">Transactions (30d)</span>
          </div>
          <div className="stat-value">{summary.total_transactions || 0}</div>
          <div className="stat-subtitle">
            <span style={{ color: 'var(--danger)' }}>🚨 {summary.flagged_transactions || 0} flagged</span>
          </div>
        </div>

        <div className="stat-card glass-card animate-slide-up stagger-4" id="stat-savings">
          <div className="stat-header">
            <span className="stat-icon">💹</span>
            <span className="stat-label">Savings Rate</span>
          </div>
          <div className="stat-value">{((summary.savings_rate || 0.44) * 100).toFixed(0)}<span className="stat-unit">%</span></div>
          <div className="stat-subtitle" style={{ color: 'var(--success)' }}>
            ↑ Above average for your profile
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Recent Transactions */}
        <div className="glass-card animate-fade-in stagger-3" id="recent-transactions">
          <div className="section-header">
            <h3>Recent Transactions</h3>
            <span className="section-count">{transactions.length}</span>
          </div>
          <div className="transaction-list">
            {transactions.slice(0, 8).map((tx, i) => (
              <div key={tx.id} className="transaction-row" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="tx-left">
                  <div className={`tx-status-dot ${tx.status}`} />
                  <div className="tx-info">
                    <span className="tx-recipient">{tx.recipient}</span>
                    <span className="tx-meta">{tx.payment_method?.toUpperCase()} • {formatTime(tx.timestamp)}</span>
                  </div>
                </div>
                <div className="tx-right">
                  <span className="tx-amount">-{formatCurrency(tx.amount, tx.currency)}</span>
                  <span className={`badge ${getRiskBadgeClass(tx.risk_level)}`}>{tx.risk_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity Log */}
        <div className="glass-card animate-fade-in stagger-4" id="agent-activity">
          <div className="section-header">
            <h3>🤖 Agent Activity</h3>
            <div className="agent-pulse">
              <span className="pulse-dot" />
              <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Live</span>
            </div>
          </div>
          <div className="agent-log-list">
            {agentLogs.slice(0, 6).map((log, i) => (
              <div key={i} className="agent-log-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="log-icon" style={{ color: getActionColor(log.action) }}>
                  {getActionIcon(log.action)}
                </div>
                <div className="log-content">
                  <div className="log-message">{log.message}</div>
                  <div className="log-meta">
                    <span className="log-time">{formatTime(log.timestamp)}</span>
                    <span className="log-confidence">
                      Confidence: {(log.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
