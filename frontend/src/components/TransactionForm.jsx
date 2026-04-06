import { useState, useEffect } from 'react';
import { formatCurrency, getRiskBadgeClass, getStatusBadgeClass } from '../utils/format';
import './TransactionForm.css';

export default function TransactionForm({ onSend }) {
  const [form, setForm] = useState({
    amount: '',
    currency: 'INR',
    recipient: '',
    priority: 'balanced',
    is_cross_border: false,
    is_new_recipient: false,
    location: 'Mumbai',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0); // 0=form, 1=processing, 2=result

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.recipient) return;

    setSending(true);
    setStep(1);
    setResult(null);

    // Simulate processing stages
    await new Promise(r => setTimeout(r, 800));

    try {
      const data = {
        ...form,
        amount: parseFloat(form.amount),
      };
      const res = await onSend(data);
      setResult(res);
      setStep(2);
    } catch (err) {
      setResult({ error: err.message });
      setStep(2);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setResult(null);
    setForm({ amount: '', currency: 'INR', recipient: '', priority: 'balanced', is_cross_border: false, is_new_recipient: false, location: 'Mumbai' });
  };

  const RECIPIENTS = [
    { value: 'rahul@okaxis', label: '🏦 Rahul — @okaxis' },
    { value: 'priya@ybl', label: '🏦 Priya — @ybl' },
    { value: 'merchant.coffee@okaxis', label: '☕ Coffee Shop — @okaxis' },
    { value: 'merchant.amazon@apl', label: '📦 Amazon — @apl' },
    { value: 'scammer_suspicious@fake', label: '⚠️ Suspicious Account — @fake' },
    { value: 'unknown_offshore@intl', label: '🌍 Offshore Unknown — @intl' },
  ];

  return (
    <div className="send-money-page">
      <div className="send-header animate-fade-in">
        <h1>💸 <span className="gradient-text">Send Money</span></h1>
        <p>AI-powered payment processing with real-time fraud detection</p>
      </div>

      <div className="send-layout">
        {/* Form */}
        <div className="send-form-card glass-card animate-slide-up stagger-1" id="send-form">
          {step === 0 && (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group">
                  <label htmlFor="amount">Amount</label>
                  <div className="amount-input-wrapper">
                    <span className="currency-symbol">{form.currency === 'INR' ? '₹' : '$'}</span>
                    <input
                      type="number"
                      id="amount"
                      className="input amount-input"
                      placeholder="Enter amount"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="currency">Currency</label>
                  <select 
                    id="currency" 
                    className="input" 
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value, is_cross_border: e.target.value !== 'INR' })}
                  >
                    <option value="INR">🇮🇳 INR — Indian Rupee</option>
                    <option value="USD">🇺🇸 USD — US Dollar</option>
                    <option value="USDC">🪙 USDC — Stablecoin</option>
                    <option value="AED">🇦🇪 AED — Dirham</option>
                    <option value="SGD">🇸🇬 SGD — Singapore Dollar</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label htmlFor="recipient">Recipient</label>
                  <select 
                    id="recipient" 
                    className="input"
                    value={form.recipient}
                    onChange={e => setForm({ ...form, recipient: e.target.value })}
                    required
                  >
                    <option value="">Select recipient...</option>
                    {RECIPIENTS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="priority">Priority</label>
                  <select 
                    id="priority" 
                    className="input"
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="balanced">⚖️ Balanced</option>
                    <option value="speed">⚡ Speed</option>
                    <option value="cost">💰 Lowest Cost</option>
                    <option value="security">🛡️ Maximum Security</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="location">Location</label>
                  <select 
                    id="location" 
                    className="input"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                  >
                    <option value="Mumbai">📍 Mumbai</option>
                    <option value="Delhi">📍 Delhi</option>
                    <option value="Bangalore">📍 Bangalore</option>
                    <option value="Unknown">📍 Unknown</option>
                    <option value="Dubai">📍 Dubai</option>
                    <option value="Lagos">📍 Lagos</option>
                  </select>
                </div>
              </div>

              <div className="form-toggles">
                <label className="toggle-label">
                  <input 
                    type="checkbox" 
                    checked={form.is_new_recipient}
                    onChange={e => setForm({ ...form, is_new_recipient: e.target.checked })}
                  />
                  <span>New recipient (first-time transfer)</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-lg send-btn" id="send-payment-btn" disabled={!form.amount || !form.recipient}>
                🚀 Send Payment via FlowGuard AI
              </button>
            </form>
          )}

          {/* Processing Animation */}
          {step === 1 && (
            <div className="processing-view">
              <div className="processing-animation">
                <div className="process-ring">
                  <div className="process-ring-inner" />
                </div>
              </div>
              <div className="processing-stages">
                <ProcessStage icon="🔍" label="Analyzing transaction..." delay={0} />
                <ProcessStage icon="🛡️" label="Running fraud detection (ML)..." delay={400} />
                <ProcessStage icon="🔀" label="Optimizing payment route..." delay={900} />
                <ProcessStage icon="🤖" label="AI Agent making decision..." delay={1400} />
              </div>
            </div>
          )}

          {/* Result */}
          {step === 2 && result && (
            <div className="result-view animate-scale-in">
              {result.error ? (
                <div className="result-error">
                  <div className="result-icon">❌</div>
                  <h3>Transaction Failed</h3>
                  <p>{result.error}</p>
                </div>
              ) : (
                <>
                  <div className={`result-status result-${result.status}`}>
                    <div className="result-icon">
                      {result.status === 'completed' ? '✅' : result.status === 'blocked' ? '🛑' : '⚠️'}
                    </div>
                    <h3>
                      {result.status === 'completed' ? 'Payment Successful' : 
                       result.status === 'blocked' ? 'Payment Blocked' : 'Payment Flagged'}
                    </h3>
                    <span className={`badge ${getStatusBadgeClass(result.status)}`}>
                      {result.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="result-details">
                    <div className="result-row">
                      <span>Transaction ID</span>
                      <span className="mono">{result.transaction?.id}</span>
                    </div>
                    <div className="result-row">
                      <span>Amount</span>
                      <span>{formatCurrency(result.transaction?.amount, result.transaction?.currency)}</span>
                    </div>
                    <div className="result-row">
                      <span>Risk Score</span>
                      <span className={`badge ${getRiskBadgeClass(result.fraud_analysis?.risk_level)}`}>
                        {result.fraud_analysis?.risk_score?.toFixed(3)} ({result.fraud_analysis?.risk_level})
                      </span>
                    </div>
                    <div className="result-row">
                      <span>Route</span>
                      <span>{result.routing?.optimal_route?.name}</span>
                    </div>
                    <div className="result-row">
                      <span>Fee</span>
                      <span>{result.routing?.optimal_route?.fee_display || '₹0.00'}</span>
                    </div>
                    <div className="result-row">
                      <span>Speed</span>
                      <span>{result.routing?.optimal_route?.speed}</span>
                    </div>
                    <div className="result-row">
                      <span>Processing Time</span>
                      <span>{result.fraud_analysis?.processing_time_ms}ms</span>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="ai-analysis-box">
                    <div className="ai-analysis-header">
                      <span>🤖</span>
                      <span>FlowGuard AI Agent Analysis</span>
                    </div>
                    <p>{result.ai_analysis}</p>
                  </div>

                  {/* Fraud Explanation */}
                  {result.fraud_analysis?.explanations?.length > 0 && (
                    <div className="fraud-explanations">
                      <h4>🔍 Fraud Detection Details</h4>
                      <ul>
                        {result.fraud_analysis.explanations.map((exp, i) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <button className="btn btn-secondary" onClick={resetForm} id="new-transaction-btn">
                ← New Transaction
              </button>
            </div>
          )}
        </div>

        {/* Side Info */}
        <div className="send-info animate-slide-up stagger-2">
          <div className="glass-card info-card">
            <h4>🔒 FlowGuard Protection</h4>
            <ul className="info-list">
              <li>Real-time ML fraud scoring</li>
              <li>Behavioral pattern analysis</li>
              <li>Intelligent route optimization</li>
              <li>Autonomous AI agent decisions</li>
              <li>AML/KYC compliance check</li>
            </ul>
          </div>

          <div className="glass-card info-card">
            <h4>💡 Try These Scenarios</h4>
            <ul className="info-list scenario-list">
              <li onClick={() => setForm({ ...form, amount: '500', recipient: 'rahul@okaxis', currency: 'INR', location: 'Mumbai' })}>
                ✅ Normal: ₹500 to Rahul (Low Risk)
              </li>
              <li onClick={() => setForm({ ...form, amount: '499000', recipient: 'scammer_suspicious@fake', currency: 'INR', location: 'Unknown', is_new_recipient: true })}>
                🛑 Fraud: ₹4,99,000 to Suspicious (Critical)
              </li>
              <li onClick={() => setForm({ ...form, amount: '10000', recipient: 'unknown_offshore@intl', currency: 'USD', location: 'Dubai', is_cross_border: true })}>
                ⚠️ Cross-border: $10,000 to Offshore
              </li>
              <li onClick={() => setForm({ ...form, amount: '150', recipient: 'merchant.coffee@okaxis', currency: 'INR', location: 'Bangalore' })}>
                ☕ Merchant: ₹150 Coffee (Normal)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessStage({ icon, label, delay }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`process-stage ${visible ? 'visible' : ''}`}>
      <span className="process-icon">{icon}</span>
      <span>{label}</span>
      {visible && <span className="process-check">✓</span>}
    </div>
  );
}
