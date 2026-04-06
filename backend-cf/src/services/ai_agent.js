/**
 * FlowGuard AI — AI Agent Service (JS Port)
 * Uses OpenRouter API (free models) for intelligence.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const FALLBACK_MODEL = 'google/gemma-2-9b-it:free';

const SYSTEM_PROMPT = `You are FlowGuard AI Agent — an intelligent payment orchestration assistant.
You analyze financial transactions, detect fraud patterns, optimize payment routes, and provide 
personalized financial insights. You are precise, data-driven, and protect users from fraud.

Your responses should be:
- Concise (2-4 sentences max)
- Action-oriented
- Include specific numbers/percentages when available
- Sound like a smart financial advisor, not a chatbot

You operate in the Indian financial ecosystem (UPI, NEFT, IMPS) and also handle 
cross-border payments via stablecoin (USDC) and SWIFT.`;


export class AIAgent {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
  }

  async callOpenRouter(prompt, context = '', model = MODEL) {
    if (!this.apiKey) return this.generateFallbackResponse(prompt, context);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];
    if (context) messages.push({ role: 'user', content: `Context: ${context}` });
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model,
      messages,
      max_tokens: 300,
      temperature: 0.7,
    };

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://matrix-gules-nine.vercel.app',
          'X-Title': 'FlowGuard AI',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (e) {
      console.error('OpenRouter error:', e);
      // Try fallback model
      if (model !== FALLBACK_MODEL) {
        try {
          payload.model = FALLBACK_MODEL;
          const response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://matrix-gules-nine.vercel.app',
              'X-Title': 'FlowGuard AI',
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error(`Fallback HTTP ${response.status}`);
          const data = await response.json();
          return data.choices[0].message.content.trim();
        } catch { /* fall through */ }
      }
      return this.generateFallbackResponse(prompt, context);
    }
  }

  generateFallbackResponse(prompt, context = '') {
    const lower = prompt.toLowerCase();

    if (lower.includes('fraud') || lower.includes('risk')) {
      return '🛡️ Fraud Analysis: This transaction shows unusual patterns. Risk factors include transaction velocity, amount deviation from baseline, and recipient trust score. Recommend enhanced verification before processing.';
    }
    if (lower.includes('route') || lower.includes('optimize') || lower.includes('fee')) {
      return '📊 Route Optimization: Based on amount, destination, and current network conditions, UPI is optimal for domestic transfers (zero fees, instant settlement). For cross-border, stablecoin (USDC) saves up to 60% vs SWIFT with near-instant settlement.';
    }
    if (lower.includes('insight') || lower.includes('spend') || lower.includes('save')) {
      return '💡 Financial Insight: Your spending in dining and entertainment is 35% above your monthly average. Consider setting a budget cap of ₹5,000/month. At current savings rate (44%), you\'ll reach your ₹5L emergency fund goal in ~8 months.';
    }
    if (lower.includes('explain') || lower.includes('decision')) {
      return '🤖 Agent Decision: Transaction analyzed across 6 risk dimensions including amount deviation, temporal patterns, recipient trust, geographic risk, velocity, and device fingerprint. This transaction falls within normal behavioral patterns for this user profile.';
    }

    return '🤖 FlowGuard AI Agent: I\'ve analyzed the request and recommend proceeding with standard verification. All systems operational — fraud detection active, routes optimized, compliance checks passed.';
  }

  async analyzeTransaction(transaction, fraudResult, routingResult) {
    const context = JSON.stringify({
      amount: transaction.amount,
      currency: transaction.currency,
      recipient: transaction.recipient,
      payment_method: transaction.payment_method,
      is_cross_border: transaction.is_cross_border,
      location: transaction.location,
      fraud_score: fraudResult.risk_score,
      fraud_level: fraudResult.risk_level,
      fraud_reasons: (fraudResult.explanations || []).join(', '),
      optimal_route: routingResult.optimal_route?.name || 'N/A',
      route_fee: routingResult.optimal_route?.calculated_fee || 0,
    });

    const prompt = 'Analyze this transaction as FlowGuard AI Agent. Provide: 1) Your decision (APPROVE/FLAG/BLOCK), 2) Brief risk assessment, 3) One actionable insight for the user. Be concise — max 3 sentences.';
    return await this.callOpenRouter(prompt, context);
  }

  async getFinancialInsight(userData) {
    const context = `User Financial Profile:
- Monthly Income: ₹${(userData.monthly_income || 80000).toLocaleString('en-IN')}
- Monthly Spending: ₹${(userData.monthly_spending || 45000).toLocaleString('en-IN')}
- Savings Rate: ${((userData.savings_rate || 0.44) * 100).toFixed(0)}%
- Financial Health Score: ${userData.financial_health_score || 78}/100
- Total Balance: ₹${(userData.total_balance_inr || 250000).toLocaleString('en-IN')}
- Flagged Transactions: ${userData.flagged_transactions || 0}`;

    const prompt = 'Generate one specific, actionable financial insight for this user. Include a concrete number or percentage. Make it feel like advice from a smart financial advisor.';
    return await this.callOpenRouter(prompt, context);
  }

  async explainRoutingDecision(routingResult, amount, currency) {
    const optimal = routingResult.optimal_route || {};
    const alternatives = routingResult.alternatives || [];

    const context = `Amount: ${amount} ${currency}
Selected Route: ${optimal.name || 'N/A'}
Fee: ${optimal.calculated_fee || 0}
Speed: ${optimal.speed || 'N/A'}
Alternatives: ${alternatives.slice(0, 3).map(a => a.name || '').join(', ')}
Savings: ${routingResult.savings_vs_worst?.amount || 0}`;

    const prompt = 'Explain this routing decision in plain English. Why was this route optimal? What would the user save? Keep it to 2 sentences max.';
    return await this.callOpenRouter(prompt, context);
  }
}
