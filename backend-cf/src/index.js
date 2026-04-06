/**
 * FlowGuard AI — Backend API (Cloudflare Workers Edition)
 * Agentic Smart Payment + Fraud Guardian Platform
 * 
 * Ported from FastAPI to Hono for Cloudflare Workers deployment.
 * This is a complete, self-contained backend that runs on Cloudflare's edge network.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { Ledger } from './services/ledger.js';
import { FraudDetector } from './models/fraud_model.js';
import { RoutingEngine } from './services/routing.js';
import { PaymentEngine } from './services/payment_engine.js';
import { AIAgent } from './services/ai_agent.js';

const app = new Hono();

// CORS - allow all origins for the hackathon demo
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://matrix-gules-nine.vercel.app',
    'https://flowguard-ai.vercel.app',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Initialize services (per-request singletons via context) ─────────────
// Note: Workers are stateless, so we re-init per isolate lifecycle.
// This is fine because our data is synthetic/demo anyway.

let ledger, fraudDetector, routingEngine, paymentEngine, aiAgent;

function initServices(env) {
  if (!ledger) {
    ledger = new Ledger();
    fraudDetector = new FraudDetector();
    routingEngine = new RoutingEngine();
    aiAgent = new AIAgent(env.OPENROUTER_API_KEY || '');
    paymentEngine = new PaymentEngine(ledger, fraudDetector, routingEngine, aiAgent);
  }
  // Update API key if it changed
  aiAgent.apiKey = env.OPENROUTER_API_KEY || '';
}

// Middleware: init services
app.use('*', async (c, next) => {
  initServices(c.env);
  await next();
});


// ─── Health & Info ─────────────────────────────────────────────────────
app.get('/', (c) => {
  return c.json({
    name: 'FlowGuard AI',
    version: '1.0.0',
    status: 'operational',
    runtime: 'Cloudflare Workers',
    tagline: 'Agentic Smart Payment + Fraud Guardian',
    timestamp: new Date().toISOString(),
    features: [
      'Real-time Fraud Detection (ML-powered)',
      'Intelligent Payment Routing',
      'AI-Powered Financial Insights',
      'UPI + Stablecoin Support',
      'Developer CLI',
    ],
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    fraud_model: fraudDetector.isTrained ? 'loaded' : 'not loaded',
    ai_agent: aiAgent.apiKey ? 'connected' : 'fallback mode',
    timestamp: new Date().toISOString(),
  });
});


// ─── Dashboard Data ─────────────────────────────────────────────────────
app.get('/api/dashboard', (c) => {
  const summary = ledger.getFinancialSummary();
  const transactions = ledger.getTransactions(20);
  const agentLogs = ledger.getAgentLogs(10);
  const heatmap = ledger.getRiskHeatmapData();

  return c.json({
    summary,
    recent_transactions: transactions,
    agent_logs: agentLogs,
    risk_heatmap: heatmap,
    user: ledger.getUser(),
  });
});

app.get('/api/transactions', (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  return c.json({
    transactions: ledger.getTransactions(limit, offset),
    total: ledger.transactions.length,
  });
});

app.get('/api/transactions/:txId', (c) => {
  const txId = c.req.param('txId');
  const tx = ledger.getTransaction(txId);
  if (!tx) return c.json({ error: `Transaction ${txId} not found` }, 404);
  return c.json(tx);
});

app.get('/api/balance', (c) => {
  return c.json(ledger.getBalance());
});

app.get('/api/agent-logs', (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  return c.json({ logs: ledger.getAgentLogs(limit) });
});

app.get('/api/risk-heatmap', (c) => {
  return c.json({ heatmap: ledger.getRiskHeatmapData() });
});


// ─── Payment Processing ─────────────────────────────────────────────────
app.post('/api/send', async (c) => {
  const body = await c.req.json();
  const result = await paymentEngine.processPayment(body);
  return c.json(result);
});

app.post('/api/analyze', async (c) => {
  const body = await c.req.json();
  const result = await paymentEngine.analyzeExistingTransaction(body.transaction_id);
  if (result.error) return c.json(result, 404);
  return c.json(result);
});


// ─── Route Optimization ─────────────────────────────────────────────────
app.post('/api/optimize', async (c) => {
  const body = await c.req.json();
  const result = paymentEngine.optimizeRouteForAmount(
    body.amount,
    body.currency || 'INR',
    body.destination || 'domestic',
    body.priority || 'balanced',
  );

  try {
    const explanation = await aiAgent.explainRoutingDecision(result, body.amount, body.currency || 'INR');
    result.ai_explanation = explanation;
  } catch {
    result.ai_explanation = result.explanation || '';
  }

  return c.json(result);
});


// ─── AI Agent ─────────────────────────────────────────────────────────
app.post('/api/ai/chat', async (c) => {
  const body = await c.req.json();
  const response = await aiAgent.callOpenRouter(body.message, body.context || '');
  return c.json({
    response,
    timestamp: new Date().toISOString(),
    model: 'FlowGuard AI Agent',
  });
});

app.get('/api/ai/insight', async (c) => {
  const summary = ledger.getFinancialSummary();
  const insight = await aiAgent.getFinancialInsight(summary);
  return c.json({
    insight,
    timestamp: new Date().toISOString(),
  });
});


// ─── Fraud Detection ─────────────────────────────────────────────────
app.post('/api/fraud/score', async (c) => {
  const body = await c.req.json();
  const result = fraudDetector.scoreTransaction(body);
  return c.json(result);
});


// ─── Conversion Rates ─────────────────────────────────────────────────
app.get('/api/rates', (c) => {
  return c.json({
    rates: ledger.conversionRates,
    base: 'INR',
    timestamp: new Date().toISOString(),
  });
});

export default app;
