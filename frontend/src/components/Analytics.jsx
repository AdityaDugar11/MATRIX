import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import './Analytics.css';

export default function Analytics({ data }) {
  const summary = data?.summary || {};
  const transactions = data?.recent_transactions || [];
  const heatmap = data?.risk_heatmap || [];

  // Calculate analytics
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const avgAmount = transactions.length ? totalVolume / transactions.length : 0;
  const fraudRate = transactions.length ? 
    (transactions.filter(tx => ['HIGH', 'CRITICAL'].includes(tx.risk_level)).length / transactions.length * 100) : 0;
  
  const methodCounts = transactions.reduce((acc, tx) => {
    acc[tx.payment_method] = (acc[tx.payment_method] || 0) + 1;
    return acc;
  }, {});
  
  const currencyCounts = transactions.reduce((acc, tx) => {
    acc[tx.currency] = (acc[tx.currency] || 0) + 1;
    return acc;
  }, {});

  const riskDistribution = transactions.reduce((acc, tx) => {
    acc[tx.risk_level] = (acc[tx.risk_level] || 0) + 1;
    return acc;
  }, {});

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const HOURS = Array.from({length: 24}, (_, i) => i);

  return (
    <div className="analytics-page">
      <div className="analytics-header animate-fade-in">
        <h1>🔍 <span className="gradient-text">Analytics</span></h1>
        <p>Real-time risk intelligence and transaction insights</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card glass-card animate-slide-up stagger-1">
          <div className="metric-icon">📈</div>
          <div className="metric-value">{formatCurrency(totalVolume)}</div>
          <div className="metric-label">Total Volume (30d)</div>
        </div>
        <div className="metric-card glass-card animate-slide-up stagger-2">
          <div className="metric-icon">📊</div>
          <div className="metric-value">{formatCurrency(avgAmount)}</div>
          <div className="metric-label">Avg Transaction</div>
        </div>
        <div className="metric-card glass-card animate-slide-up stagger-3">
          <div className="metric-icon">🛡️</div>
          <div className="metric-value" style={{ color: fraudRate > 10 ? 'var(--danger)' : 'var(--success)' }}>
            {fraudRate.toFixed(1)}%
          </div>
          <div className="metric-label">Fraud Detection Rate</div>
        </div>
        <div className="metric-card glass-card animate-slide-up stagger-4">
          <div className="metric-icon">⚡</div>
          <div className="metric-value">~2.5ms</div>
          <div className="metric-label">Avg Detection Time</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Risk Heatmap */}
        <div className="glass-card animate-fade-in stagger-3" id="risk-heatmap">
          <div className="section-header">
            <h3>🗺️ Risk Heatmap (Hour × Day)</h3>
          </div>
          <div className="heatmap-container">
            <div className="heatmap-y-labels">
              {DAYS.map(day => <span key={day} className="heatmap-label">{day}</span>)}
            </div>
            <div className="heatmap-grid">
              {DAYS.map((_, dayIdx) => (
                <div key={dayIdx} className="heatmap-row">
                  {HOURS.map(hour => {
                    const cell = heatmap.find(h => h.hour === hour && h.day === dayIdx);
                    const intensity = cell ? Math.min(cell.avg_risk * 3, 1) : 0;
                    const count = cell?.count || 0;
                    return (
                      <div
                        key={hour}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: intensity > 0.6 
                            ? `rgba(239, 68, 68, ${intensity})` 
                            : intensity > 0.3 
                            ? `rgba(245, 158, 11, ${intensity * 1.5})` 
                            : `rgba(16, 185, 129, ${Math.max(intensity * 2, 0.1)})`,
                        }}
                        title={`${DAYS[dayIdx]} ${hour}:00 — ${count} tx, risk: ${(intensity / 3).toFixed(2)}`}
                      />
                    );
                  })}
                </div>
              ))}
              <div className="heatmap-x-labels">
                {[0, 4, 8, 12, 16, 20, 23].map(h => (
                  <span key={h} className="heatmap-label">{h}:00</span>
                ))}
              </div>
            </div>
          </div>
          <div className="heatmap-legend">
            <span>Low Risk</span>
            <div className="legend-gradient" />
            <span>High Risk</span>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="glass-card animate-fade-in stagger-4">
          <div className="section-header">
            <h3>📊 Risk Distribution</h3>
          </div>
          <div className="risk-bars">
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => {
              const count = riskDistribution[level] || 0;
              const pct = transactions.length ? (count / transactions.length * 100) : 0;
              const colors = {
                LOW: 'var(--success)',
                MEDIUM: 'var(--warning)',
                HIGH: 'var(--danger)',
                CRITICAL: '#ff4444',
              };
              return (
                <div key={level} className="risk-bar-item">
                  <div className="risk-bar-header">
                    <span className="risk-bar-label">{level}</span>
                    <span className="risk-bar-count">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="risk-bar-track">
                    <div 
                      className="risk-bar-fill" 
                      style={{ width: `${pct}%`, backgroundColor: colors[level] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
            <h3>🔀 Payment Methods</h3>
          </div>
          <div className="method-chips">
            {Object.entries(methodCounts).map(([method, count]) => (
              <div key={method} className="method-chip">
                <span className="method-name">{method?.toUpperCase()}</span>
                <span className="method-count">{count}</span>
              </div>
            ))}
          </div>

          <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
            <h3>💱 Currency Mix</h3>
          </div>
          <div className="method-chips">
            {Object.entries(currencyCounts).map(([cur, count]) => (
              <div key={cur} className="method-chip currency-chip">
                <span className="method-name">{cur}</span>
                <span className="method-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
