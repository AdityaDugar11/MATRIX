import { useState, useEffect } from 'react';
import { formatCurrency, formatTime, formatDateTime, getRiskBadgeClass, getStatusBadgeClass } from '../utils/format';
import './TransactionHistory.css';

export default function TransactionHistory({ transactions = [], onAnalyze }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const filtered = transactions.filter(tx => {
    if (filter === 'flagged') return ['flagged', 'blocked'].includes(tx.status);
    if (filter === 'completed') return tx.status === 'completed';
    if (filter === 'cross-border') return tx.is_cross_border;
    return true;
  }).filter(tx => {
    if (!search) return true;
    return tx.recipient?.toLowerCase().includes(search.toLowerCase()) ||
           tx.id?.toLowerCase().includes(search.toLowerCase());
  });

  const handleAnalyze = async (txId) => {
    setAnalyzing(true);
    try {
      const result = await onAnalyze(txId);
      setAnalysis(result);
    } catch (err) {
      setAnalysis({ error: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="tx-history-page">
      <div className="tx-header animate-fade-in">
        <h1>📋 <span className="gradient-text">Transactions</span></h1>
        <p>Complete transaction history with fraud analysis</p>
      </div>

      {/* Filters */}
      <div className="tx-filters glass-card animate-slide-up stagger-1">
        <div className="filter-tabs">
          {['all', 'completed', 'flagged', 'cross-border'].map(f => (
            <button 
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '📊 All' : f === 'completed' ? '✅ Completed' : f === 'flagged' ? '🚨 Flagged' : '🌍 Cross-Border'}
            </button>
          ))}
        </div>
        <input 
          type="text" 
          className="input search-input" 
          placeholder="🔍 Search by recipient or TX ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Transaction Table */}
      <div className="tx-table-card glass-card animate-slide-up stagger-2" id="tx-table">
        <div className="tx-table-header">
          <span>Transaction</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Risk</span>
          <span>Status</span>
          <span>Time</span>
          <span>Action</span>
        </div>
        <div className="tx-table-body">
          {filtered.map((tx, i) => (
            <div 
              key={tx.id} 
              className={`tx-table-row ${selectedTx === tx.id ? 'selected' : ''}`}
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => setSelectedTx(selectedTx === tx.id ? null : tx.id)}
            >
              <span className="tx-table-id">
                <div className={`tx-status-dot ${tx.status}`} />
                <div>
                  <div className="tx-id-text">{tx.id}</div>
                  <div className="tx-recipient-text">{tx.recipient}</div>
                </div>
              </span>
              <span className="tx-table-amount mono">
                {formatCurrency(tx.amount, tx.currency)}
              </span>
              <span className="tx-table-method">
                {tx.payment_method?.toUpperCase()}
              </span>
              <span>
                <span className={`badge ${getRiskBadgeClass(tx.risk_level)}`}>
                  {tx.risk_level}
                </span>
              </span>
              <span>
                <span className={`badge ${getStatusBadgeClass(tx.status)}`}>
                  {tx.status}
                </span>
              </span>
              <span className="tx-table-time">{formatTime(tx.timestamp)}</span>
              <span>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleAnalyze(tx.id); }}
                >
                  🔍
                </button>
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="tx-table-empty">No transactions found</div>
          )}
        </div>
      </div>

      {/* Analysis Panel */}
      {analysis && !analysis.error && (
        <div className="analysis-panel glass-card animate-scale-in" id="analysis-panel">
          <div className="section-header">
            <h3>🔍 Transaction Analysis — {analysis.transaction?.id}</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setAnalysis(null)}>✕</button>
          </div>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="analysis-label">Risk Score</span>
              <span className="analysis-value" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {analysis.fraud_analysis?.risk_score?.toFixed(3)}
              </span>
              <span className={`badge ${getRiskBadgeClass(analysis.fraud_analysis?.risk_level)}`}>
                {analysis.fraud_analysis?.risk_level}
              </span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">ML Anomaly Score</span>
              <span className="analysis-value mono">{analysis.fraud_analysis?.ml_anomaly_score}</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Confidence</span>
              <span className="analysis-value">{(analysis.fraud_analysis?.confidence * 100)?.toFixed(0)}%</span>
            </div>
            <div className="analysis-item">
              <span className="analysis-label">Processing</span>
              <span className="analysis-value">{analysis.fraud_analysis?.processing_time_ms}ms</span>
            </div>
          </div>
          <div className="ai-analysis-box" style={{ marginTop: 'var(--space-4)' }}>
            <div className="ai-analysis-header">
              <span>🤖</span><span>AI Agent Analysis</span>
            </div>
            <p>{analysis.ai_analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
