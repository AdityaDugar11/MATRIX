import { useState, useRef, useEffect } from 'react';
import './CLITerminal.css';

const HELP_TEXT = `
╔══════════════════════════════════════════════════════╗
║           FlowGuard AI — Command Line Interface      ║
║          Agentic Smart Payment + Fraud Guardian      ║
╚══════════════════════════════════════════════════════╝

Available Commands:
  flowguard send <amount> --to <recipient> [--currency INR]
      Send a payment with AI fraud detection & routing

  flowguard analyze --txid <transaction_id>
      Analyze a transaction for fraud risk

  flowguard optimize --amount <amount> --to <domestic|international>
      Find optimal payment route

  flowguard balance
      Show current balance across currencies

  flowguard status
      Show system & AI agent status

  flowguard insight
      Get personalized financial insight from AI

  help
      Show this help message

  clear
      Clear the terminal

Examples:
  flowguard send 5000 --to upi:rahul@okaxis --currency INR
  flowguard analyze --txid TXN-A1B2C3D4
  flowguard optimize --amount 10000 --to international
`;

export default function CLITerminal({ onSend, onAnalyze, onOptimize, data }) {
  const [history, setHistory] = useState([
    { type: 'system', text: '🤖 FlowGuard AI CLI v1.0.0 — Type "help" for available commands' },
    { type: 'system', text: '   Agent status: ONLINE | ML Model: LOADED | Risk Engine: ACTIVE' },
    { type: 'system', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const termRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [history]);

  const addOutput = (type, text) => {
    setHistory(prev => [...prev, { type, text }]);
  };

  const processCommand = async (cmd) => {
    const trimmed = cmd.trim().toLowerCase();
    const parts = trimmed.split(/\s+/);

    addOutput('input', `$ ${cmd}`);
    setCmdHistory(prev => [cmd, ...prev]);
    setHistoryIdx(-1);

    if (trimmed === 'help') {
      addOutput('help', HELP_TEXT);
      return;
    }

    if (trimmed === 'clear') {
      setHistory([{ type: 'system', text: '🤖 Terminal cleared.' }]);
      return;
    }

    if (parts[0] !== 'flowguard') {
      addOutput('error', `Command not found: ${parts[0]}. Type "help" for available commands.`);
      return;
    }

    const subcommand = parts[1];
    setProcessing(true);

    try {
      switch (subcommand) {
        case 'send': {
          const amount = parseFloat(parts[2]);
          if (!amount) { addOutput('error', 'Usage: flowguard send <amount> --to <recipient>'); break; }
          
          const toIdx = parts.indexOf('--to');
          const recipient = toIdx !== -1 ? parts[toIdx + 1]?.replace('upi:', '') : 'rahul@okaxis';
          const curIdx = parts.indexOf('--currency');
          const currency = curIdx !== -1 ? parts[curIdx + 1]?.toUpperCase() : 'INR';

          addOutput('processing', `\n⏳ Processing payment of ${currency === 'INR' ? '₹' : '$'}${amount} to ${recipient}...`);
          addOutput('processing', '   🔍 Analyzing transaction patterns...');
          addOutput('processing', '   🛡️ Running ML fraud detection...');
          addOutput('processing', '   🔀 Optimizing payment route...');
          addOutput('processing', '   🤖 AI Agent making decision...\n');

          const result = await onSend({ amount, currency, recipient, is_cross_border: currency !== 'INR' });
          
          const statusIcon = result.status === 'completed' ? '✅' : result.status === 'blocked' ? '🛑' : '⚠️';
          addOutput('result', `${statusIcon} Payment ${result.status?.toUpperCase()}`);
          addOutput('result', `   Transaction ID: ${result.transaction?.id}`);
          addOutput('result', `   Amount: ${currency === 'INR' ? '₹' : '$'}${amount}`);
          addOutput('result', `   Route: ${result.routing?.optimal_route?.name || 'N/A'}`);
          addOutput('result', `   Fee: ${result.routing?.optimal_route?.fee_display || '₹0.00'}`);
          addOutput('result', `   Risk Score: ${result.fraud_analysis?.risk_score?.toFixed(3)} (${result.fraud_analysis?.risk_level})`);
          addOutput('result', `   Processing: ${result.fraud_analysis?.processing_time_ms}ms`);
          addOutput('ai', `\n   🤖 AI: ${result.ai_analysis}`);
          break;
        }

        case 'analyze': {
          const txIdIdx = parts.indexOf('--txid');
          const txId = txIdIdx !== -1 ? parts[txIdIdx + 1]?.toUpperCase() : null;
          
          if (!txId) { addOutput('error', 'Usage: flowguard analyze --txid <transaction_id>'); break; }
          
          addOutput('processing', `\n⏳ Analyzing transaction ${txId}...`);
          const result = await onAnalyze(txId);
          
          if (result.error) {
            addOutput('error', `Error: ${result.error}`);
          } else {
            addOutput('result', '\n📊 Fraud Analysis Report');
            addOutput('result', `   Risk Score: ${result.fraud_analysis?.risk_score?.toFixed(3)}`);
            addOutput('result', `   Risk Level: ${result.fraud_analysis?.risk_level}`);
            addOutput('result', `   ML Anomaly: ${result.fraud_analysis?.ml_anomaly_score}`);
            addOutput('result', `   Confidence: ${(result.fraud_analysis?.confidence * 100)?.toFixed(0)}%`);
            addOutput('result', `   Explanations:`);
            result.fraud_analysis?.explanations?.forEach(exp => {
              addOutput('result', `     • ${exp}`);
            });
            addOutput('ai', `\n   🤖 AI: ${result.ai_analysis}`);
          }
          break;
        }

        case 'optimize': {
          const amtIdx = parts.indexOf('--amount');
          const toIdx2 = parts.indexOf('--to');
          const amount = amtIdx !== -1 ? parseFloat(parts[amtIdx + 1]) : 10000;
          const dest = toIdx2 !== -1 ? parts[toIdx2 + 1] : 'domestic';

          addOutput('processing', `\n⏳ Optimizing route for ₹${amount} (${dest})...`);
          const result = await onOptimize({ amount, currency: 'INR', destination: dest });

          addOutput('result', '\n🔀 Route Optimization Result');
          addOutput('result', `   Optimal Route: ${result.optimal_route?.name || 'N/A'}`);
          addOutput('result', `   Fee: ${result.optimal_route?.fee_display || '₹0.00'}`);
          addOutput('result', `   Speed: ${result.optimal_route?.speed || 'N/A'}`);
          addOutput('result', `   Reliability: ${((result.optimal_route?.reliability || 0) * 100).toFixed(1)}%`);
          if (result.alternatives?.length > 0) {
            addOutput('result', `\n   Alternatives:`);
            result.alternatives.forEach(alt => {
              addOutput('result', `     → ${alt.name} (fee: ${alt.fee_display}, speed: ${alt.speed})`);
            });
          }
          addOutput('result', `\n   ${result.explanation || ''}`);
          break;
        }

        case 'balance': {
          const balances = data?.summary?.balances || {};
          addOutput('result', '\n💰 Account Balances');
          Object.entries(balances).forEach(([cur, amt]) => {
            addOutput('result', `   ${cur}: ${cur === 'INR' ? '₹' : '$'}${amt.toLocaleString()}`);
          });
          addOutput('result', `   Financial Health: ${data?.summary?.financial_health_score || 78}/100`);
          break;
        }

        case 'status': {
          addOutput('result', '\n⚡ FlowGuard AI System Status');
          addOutput('result', '   Agent: 🟢 ONLINE');
          addOutput('result', '   ML Model: 🟢 LOADED (Isolation Forest)');
          addOutput('result', '   Risk Engine: 🟢 ACTIVE');
          addOutput('result', '   Route Optimizer: 🟢 RUNNING');
          addOutput('result', '   AI Provider: OpenRouter (LLaMA 3.1 8B)');
          addOutput('result', `   Total Transactions: ${data?.summary?.total_transactions || 0}`);
          addOutput('result', `   Flagged: ${data?.summary?.flagged_transactions || 0}`);
          break;
        }

        case 'insight': {
          addOutput('processing', '\n⏳ Generating financial insight...');
          addOutput('ai', '\n💡 FlowGuard AI Insight:');
          addOutput('ai', '   Your dining expenses are 40% above your monthly average.');
          addOutput('ai', '   At your current savings rate (44%), you\'ll build a ₹5L');
          addOutput('ai', '   emergency fund in approximately 8 months. Consider setting');
          addOutput('ai', '   automated transfers to a dedicated savings account.');
          break;
        }

        default:
          addOutput('error', `Unknown subcommand: ${subcommand}. Type "help" for available commands.`);
      }
    } catch (err) {
      addOutput('error', `Error: ${err.message}`);
    } finally {
      setProcessing(false);
      addOutput('system', '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      processCommand(input);
      setInput('');
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx < cmdHistory.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="cli-page">
      <div className="cli-header animate-fade-in">
        <h1>💻 <span className="gradient-text">CLI Terminal</span></h1>
        <p>FlowGuard Command Line Interface — Simon's Command Line</p>
      </div>

      <div className="terminal-window glass-card animate-slide-up" id="cli-terminal">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <span className="terminal-title">flowguard-cli — ~/flowguard</span>
        </div>
        
        <div className="terminal-body" ref={termRef} onClick={() => inputRef.current?.focus()}>
          {history.map((line, i) => (
            <div key={i} className={`terminal-line ${line.type}`}>
              <pre>{line.text}</pre>
            </div>
          ))}
          
          <div className="terminal-input-line">
            <span className="prompt">
              <span className="prompt-user">flowguard</span>
              <span className="prompt-at">@</span>
              <span className="prompt-host">ai</span>
              <span className="prompt-sep">:</span>
              <span className="prompt-dir">~</span>
              <span className="prompt-dollar">$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={processing ? 'Processing...' : 'Type a command...'}
              disabled={processing}
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="cli-quickcmds animate-slide-up stagger-2">
        <span className="quick-label">Quick Commands:</span>
        {[
          'flowguard send 5000 --to upi:rahul@okaxis',
          'flowguard balance',
          'flowguard status',
          'flowguard optimize --amount 10000 --to international',
          'help',
        ].map(cmd => (
          <button 
            key={cmd}
            className="quick-cmd"
            onClick={() => { setInput(cmd); processCommand(cmd); }}
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
