/**
 * FlowGuard AI — In-Memory Ledger Service (JS Port)
 */

// ─── Seed Data ────────────────────────────────────────────────────────
const UPI_IDS = [
  'rahul@okaxis', 'priya@ybl', 'amit@paytm', 'sneha@ibl',
  'vikram@kotak', 'deepa@sbi', 'arjun@hdfc', 'kavita@icici',
  'merchant.coffee@okaxis', 'merchant.grocery@ybl',
  'merchant.fuel@paytm', 'merchant.amazon@apl',
  'scammer_suspicious@fake', 'unknown_offshore@intl',
];

const LOCATIONS = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Dubai', 'Singapore',
  'London', 'New York', 'Lagos', 'Unknown',
];

const DEVICE_TYPES = ['mobile_android', 'mobile_ios', 'web_desktop', 'web_mobile', 'api'];

function uuid() {
  return 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)).toUpperCase();
}

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSeedTransactions(count = 50) {
  const rand = seededRandom(42);
  const txs = [];
  const now = Date.now();
  const thirtyDays = 30 * 24 * 3600 * 1000;

  for (let i = 0; i < count; i++) {
    const isSuspicious = rand() < 0.15;
    const isCrossBorder = rand() < 0.2;

    let amount, hour, recipient, velocity, location;

    if (isSuspicious) {
      const pick = rand();
      amount = pick < 0.5 ? rand() * 450000 + 50000 : pick < 0.8 ? rand() * 600 + 9900 : rand() * 10 + 1;
      hour = [1, 2, 3, 4, 23, 0][Math.floor(rand() * 6)];
      recipient = rand() < 0.6 ? 'scammer_suspicious@fake' : 'unknown_offshore@intl';
      velocity = Math.floor(rand() * 15) + 5;
      location = ['Unknown', 'Lagos', 'Dubai'][Math.floor(rand() * 3)];
    } else {
      amount = rand() * 24900 + 100;
      hour = Math.floor(rand() * 14) + 8;
      recipient = UPI_IDS[Math.floor(rand() * 12)];
      velocity = Math.floor(rand() * 3);
      location = LOCATIONS[Math.floor(rand() * 8)];
    }

    const txTime = new Date(now - thirtyDays + rand() * thirtyDays);
    txTime.setHours(hour, Math.floor(rand() * 60));
    const currency = !isCrossBorder ? 'INR' : ['USD', 'USDC', 'AED', 'SGD'][Math.floor(rand() * 4)];
    const paymentMethod = !isCrossBorder ? 'upi' : ['stablecoin', 'swift', 'wire'][Math.floor(rand() * 3)];

    txs.push({
      id: `TXN-${uuid()}`,
      amount: Math.round(amount * 100) / 100,
      currency,
      sender: 'user@flowguard',
      recipient,
      payment_method: paymentMethod,
      timestamp: txTime.toISOString(),
      hour,
      location,
      device: DEVICE_TYPES[Math.floor(rand() * DEVICE_TYPES.length)],
      velocity,
      is_cross_border: isCrossBorder,
      is_new_recipient: isSuspicious && rand() > 0.2,
      recipient_freq: isSuspicious ? Math.floor(rand() * 2) : Math.floor(rand() * 8) + 2,
      status: 'completed',
      risk_score: 0,
      risk_level: 'LOW',
      agent_decision: '',
      fee_percentage: Math.round((isCrossBorder ? rand() * 2.9 + 0.1 : rand() * 0.5) * 100) / 100,
    });
  }

  return txs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}


export class Ledger {
  constructor() {
    this.users = {
      'user@flowguard': {
        name: 'Aditya Dugar',
        email: 'aditya@flowguard.ai',
        balance: { INR: 250000.00, USDC: 1200.00, USD: 500.00 },
        upi_id: 'aditya@flowguard',
        wallet_address: '0xFlowGuard...Demo',
        risk_profile: 'moderate',
        total_transactions: 156,
        flagged_transactions: 3,
        financial_health_score: 78,
        monthly_spending: 45000,
        monthly_income: 80000,
        savings_rate: 0.44,
      },
    };

    this.transactions = generateSeedTransactions(50);

    const now = new Date();
    this.agentLogs = [
      { timestamp: new Date(now - 300000).toISOString(), action: 'ROUTE_OPTIMIZED', message: 'Routed ₹15,000 via UPI instead of NEFT — saved ₹12 in fees, 23 min faster', confidence: 0.95 },
      { timestamp: new Date(now - 720000).toISOString(), action: 'FRAUD_BLOCKED', message: 'Blocked suspicious ₹4,99,000 to unknown_offshore@intl — unusual amount + location mismatch', confidence: 0.92 },
      { timestamp: new Date(now - 1800000).toISOString(), action: 'INSIGHT_GENERATED', message: 'Your dining expenses are 40% above your monthly average. Consider setting a budget alert.', confidence: 0.88 },
      { timestamp: new Date(now - 3600000).toISOString(), action: 'COMPLIANCE_CHECK', message: 'Transaction to merchant.amazon@apl passed AML/KYC verification — processing normally', confidence: 0.99 },
      { timestamp: new Date(now - 7200000).toISOString(), action: 'STABLECOIN_SWAP', message: 'Converted ₹8,500 → 101.2 USDC for cross-border payment — 60% lower fees than SWIFT', confidence: 0.94 },
    ];

    this.conversionRates = {
      INR_USD: 0.012, USD_INR: 84.15, INR_USDC: 0.012, USDC_INR: 84.10,
      INR_AED: 0.044, AED_INR: 22.90, INR_SGD: 0.016, SGD_INR: 62.50,
      USD_USDC: 1.0, USDC_USD: 1.0,
    };
  }

  getUser(userId = 'user@flowguard') {
    return this.users[userId] || this.users['user@flowguard'];
  }

  getBalance(userId = 'user@flowguard') {
    return this.getUser(userId).balance || {};
  }

  getTransactions(limit = 50, offset = 0) {
    return this.transactions.slice(offset, offset + limit);
  }

  getTransaction(txId) {
    return this.transactions.find(tx => tx.id === txId) || null;
  }

  addTransaction(transaction) {
    if (!transaction.id) transaction.id = `TXN-${uuid()}`;
    if (!transaction.timestamp) transaction.timestamp = new Date().toISOString();
    this.transactions.unshift(transaction);

    const user = this.getUser();
    const currency = transaction.currency || 'INR';
    const amount = transaction.amount || 0;
    if (user.balance[currency] !== undefined) user.balance[currency] -= amount;
    user.total_transactions += 1;

    return transaction;
  }

  addAgentLog(action, message, confidence = 0.9) {
    const log = { timestamp: new Date().toISOString(), action, message, confidence };
    this.agentLogs.unshift(log);
    return log;
  }

  getAgentLogs(limit = 20) {
    return this.agentLogs.slice(0, limit);
  }

  getConversionRate(from, to) {
    return this.conversionRates[`${from}_${to}`] || 1.0;
  }

  getFinancialSummary() {
    const user = this.getUser();
    const totalInr =
      user.balance.INR +
      (user.balance.USDC || 0) * this.conversionRates.USDC_INR +
      (user.balance.USD || 0) * this.conversionRates.USD_INR;

    const flagged = this.transactions.filter(tx => ['HIGH', 'CRITICAL'].includes(tx.risk_level)).length;
    const totalSpent30d = this.transactions
      .filter(tx => tx.currency === 'INR')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      total_balance_inr: Math.round(totalInr * 100) / 100,
      balances: { ...user.balance },
      financial_health_score: user.financial_health_score,
      total_transactions: this.transactions.length,
      flagged_transactions: flagged,
      total_spent_30d: Math.round(totalSpent30d * 100) / 100,
      savings_rate: user.savings_rate,
      risk_profile: user.risk_profile,
    };
  }

  getRiskHeatmapData() {
    const heatmap = {};
    for (const tx of this.transactions) {
      try {
        const dt = new Date(tx.timestamp);
        const key = `${dt.getHours()}_${dt.getDay()}`;
        if (!heatmap[key]) heatmap[key] = { count: 0, total_risk: 0, total_amount: 0, hour: dt.getHours(), day: dt.getDay() };
        heatmap[key].count++;
        heatmap[key].total_risk += tx.risk_score || 0;
        heatmap[key].total_amount += tx.amount || 0;
      } catch { continue; }
    }

    return Object.values(heatmap).map(d => ({
      hour: d.hour,
      day: d.day,
      count: d.count,
      avg_risk: Math.round((d.total_risk / d.count) * 1000) / 1000,
      total_amount: Math.round(d.total_amount * 100) / 100,
    }));
  }
}
