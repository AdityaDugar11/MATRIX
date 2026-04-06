import { useState } from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'send', icon: '💸', label: 'Send Money' },
  { id: 'transactions', icon: '📋', label: 'Transactions' },
  { id: 'analytics', icon: '🔍', label: 'Analytics' },
  { id: 'cli', icon: '💻', label: 'CLI Terminal' },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar" id="sidebar-nav">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
            <path d="M10 14l3 3 5-6" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-name gradient-text">FlowGuard</span>
          <span className="logo-tag">AI Agent</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activeTab === item.id && <div className="nav-indicator" />}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="sidebar-footer">
        <div className="status-card glass-card" style={{ padding: '12px' }}>
          <div className="status-dot" />
          <div className="status-info">
            <span className="nav-label" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Agent Online</span>
            <span className="nav-label" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ML Model Loaded</span>
          </div>
        </div>
        <div className="user-info">
          <div className="user-avatar">AD</div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Aditya Dugar</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>aditya@flowguard</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
