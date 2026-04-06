/**
 * FlowGuard AI — Payment Engine Service (JS Port)
 */

function uuid() {
  return 'xxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)).toUpperCase();
}

export class PaymentEngine {
  constructor(ledger, fraudDetector, routingEngine, aiAgent) {
    this.ledger = ledger;
    this.fraudDetector = fraudDetector;
    this.routingEngine = routingEngine;
    this.aiAgent = aiAgent;
  }

  async processPayment(paymentData) {
    const amount = paymentData.amount || 0;
    const currency = paymentData.currency || 'INR';
    const recipient = paymentData.recipient || 'unknown@upi';
    const isCrossBorder = currency !== 'INR' || paymentData.is_cross_border || false;
    const now = new Date();

    const transaction = {
      id: `TXN-${uuid()}`,
      amount,
      currency,
      sender: 'user@flowguard',
      recipient,
      payment_method: paymentData.payment_method || 'upi',
      timestamp: now.toISOString(),
      hour: now.getHours(),
      location: paymentData.location || 'Mumbai',
      device: paymentData.device || 'web_desktop',
      velocity: Math.floor(Math.random() * 3),
      is_cross_border: isCrossBorder,
      is_new_recipient: paymentData.is_new_recipient || false,
      recipient_freq: paymentData.recipient_freq || 5,
    };

    // Step 2: Fraud Detection
    const fraudResult = this.fraudDetector.scoreTransaction(transaction);
    transaction.risk_score = fraudResult.risk_score;
    transaction.risk_level = fraudResult.risk_level;

    // Step 3: Route Optimization
    const routingResult = this.routingEngine.optimizeRoute(
      amount, currency, isCrossBorder,
      fraudResult.risk_level,
      paymentData.priority || 'balanced',
    );

    const optimalRoute = routingResult.optimal_route || {};
    transaction.payment_method = optimalRoute.route_id || 'upi';
    transaction.fee_percentage = optimalRoute.fee_percentage || 0;

    // Step 4: AI Agent Analysis
    let aiAnalysis;
    try {
      aiAnalysis = await this.aiAgent.analyzeTransaction(transaction, fraudResult, routingResult);
    } catch {
      aiAnalysis = 'FlowGuard AI: Transaction analyzed. Proceeding with standard verification.';
    }
    transaction.agent_decision = aiAnalysis;

    // Step 5: Execute or Flag
    let action, message;
    if (fraudResult.risk_level === 'CRITICAL') {
      transaction.status = 'blocked';
      action = 'FRAUD_BLOCKED';
      message = `Blocked ₹${amount.toLocaleString('en-IN')} to ${recipient} — ${(fraudResult.explanations || []).slice(0, 2).join(', ')}`;
    } else if (fraudResult.risk_level === 'HIGH') {
      transaction.status = 'flagged';
      action = 'FRAUD_FLAGGED';
      message = `Flagged ₹${amount.toLocaleString('en-IN')} to ${recipient} for review — risk score: ${fraudResult.risk_score}`;
    } else {
      transaction.status = 'completed';
      action = 'ROUTE_OPTIMIZED';
      const routeName = optimalRoute.name || 'UPI';
      const fee = optimalRoute.calculated_fee || 0;
      message = `Processed ₹${amount.toLocaleString('en-IN')} via ${routeName} — fee: ₹${fee.toFixed(2)}, ${optimalRoute.speed || 'instant'}`;
    }

    // Record
    this.ledger.addTransaction(transaction);
    this.ledger.addAgentLog(action, message, fraudResult.confidence || 0.9);

    return {
      transaction,
      fraud_analysis: fraudResult,
      routing: routingResult,
      ai_analysis: aiAnalysis,
      status: transaction.status,
    };
  }

  async analyzeExistingTransaction(txId) {
    const tx = this.ledger.getTransaction(txId);
    if (!tx) return { error: `Transaction ${txId} not found` };

    const fraudResult = this.fraudDetector.scoreTransaction(tx);
    const routingResult = this.routingEngine.optimizeRoute(
      tx.amount,
      tx.currency || 'INR',
      tx.is_cross_border || false,
      fraudResult.risk_level,
    );

    let aiAnalysis;
    try {
      aiAnalysis = await this.aiAgent.analyzeTransaction(tx, fraudResult, routingResult);
    } catch {
      aiAnalysis = 'Analysis complete. Standard patterns detected.';
    }

    return { transaction: tx, fraud_analysis: fraudResult, routing: routingResult, ai_analysis: aiAnalysis };
  }

  optimizeRouteForAmount(amount, currency, destination = 'domestic', priority = 'balanced') {
    const isCrossBorder = destination === 'international';
    return this.routingEngine.optimizeRoute(amount, currency, isCrossBorder, 'LOW', priority);
  }
}
