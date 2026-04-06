"""
FlowGuard AI — Backend API
Agentic Smart Payment + Fraud Guardian Platform

FastAPI backend serving the FlowGuard AI dashboard with:
- Real-time fraud detection (ML-powered)
- Intelligent payment routing
- AI-powered financial insights (via OpenRouter)
- In-memory ledger for demo transactions
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

# Import services
from models.fraud_model import fraud_detector
from services.ledger import ledger
from services.routing import routing_engine
from services.payment_engine import payment_engine
from services import ai_agent

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FlowGuard AI API",
    description="Agentic AI-Powered Payment Orchestration Platform",
    version="1.0.0",
    docs_url="/docs",
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://flowguard-ai.vercel.app",
        "https://matrix-flowguard.vercel.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ──────────────────────────────────────────────────
class PaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="INR", description="Currency code")
    recipient: str = Field(..., description="Recipient UPI ID or wallet")
    payment_method: str = Field(default="auto", description="Payment method")
    is_cross_border: bool = Field(default=False)
    location: str = Field(default="Mumbai")
    priority: str = Field(default="balanced", description="speed|cost|security|balanced")
    is_new_recipient: bool = Field(default=False)

class OptimizeRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = Field(default="INR")
    destination: str = Field(default="domestic", description="domestic|international")
    priority: str = Field(default="balanced")

class AnalyzeRequest(BaseModel):
    transaction_id: str

class AIChatRequest(BaseModel):
    message: str
    context: str = ""


# ─── Health & Info ────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": "FlowGuard AI",
        "version": "1.0.0",
        "status": "operational",
        "tagline": "Agentic Smart Payment + Fraud Guardian",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "Real-time Fraud Detection (ML-powered)",
            "Intelligent Payment Routing",
            "AI-Powered Financial Insights",
            "UPI + Stablecoin Support",
            "Developer CLI",
        ],
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "fraud_model": "loaded" if fraud_detector.is_trained else "not loaded",
        "ai_agent": "connected" if os.getenv("OPENROUTER_API_KEY") else "fallback mode",
        "timestamp": datetime.now().isoformat(),
    }


# ─── Dashboard Data ──────────────────────────────────────────────────────────
@app.get("/api/dashboard")
async def get_dashboard():
    """Get all dashboard data in a single call."""
    summary = ledger.get_financial_summary()
    transactions = ledger.get_transactions(limit=20)
    agent_logs = ledger.get_agent_logs(limit=10)
    heatmap = ledger.get_risk_heatmap_data()
    
    return {
        "summary": summary,
        "recent_transactions": transactions,
        "agent_logs": agent_logs,
        "risk_heatmap": heatmap,
        "user": ledger.get_user(),
    }

@app.get("/api/transactions")
async def get_transactions(limit: int = 50, offset: int = 0):
    """Get transaction history."""
    return {
        "transactions": ledger.get_transactions(limit=limit, offset=offset),
        "total": len(ledger.transactions),
    }

@app.get("/api/transactions/{tx_id}")
async def get_transaction(tx_id: str):
    """Get a specific transaction."""
    tx = ledger.get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {tx_id} not found")
    return tx

@app.get("/api/balance")
async def get_balance():
    """Get user balance."""
    return ledger.get_balance()

@app.get("/api/agent-logs")
async def get_agent_logs(limit: int = 20):
    """Get AI agent activity logs."""
    return {"logs": ledger.get_agent_logs(limit=limit)}

@app.get("/api/risk-heatmap")
async def get_risk_heatmap():
    """Get risk heatmap data."""
    return {"heatmap": ledger.get_risk_heatmap_data()}


# ─── Payment Processing ──────────────────────────────────────────────────────
@app.post("/api/send")
async def send_payment(request: PaymentRequest):
    """Process a payment through the FlowGuard pipeline."""
    result = await payment_engine.process_payment(request.model_dump())
    return result

@app.post("/api/analyze")
async def analyze_transaction(request: AnalyzeRequest):
    """Re-analyze an existing transaction."""
    result = await payment_engine.analyze_existing_transaction(request.transaction_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ─── Route Optimization ──────────────────────────────────────────────────────
@app.post("/api/optimize")
async def optimize_route(request: OptimizeRequest):
    """Get optimal routing for a payment amount."""
    result = payment_engine.optimize_route_for_amount(
        amount=request.amount,
        currency=request.currency,
        destination=request.destination,
        priority=request.priority,
    )
    
    # Add AI explanation
    try:
        explanation = await ai_agent.explain_routing_decision(result, request.amount, request.currency)
        result["ai_explanation"] = explanation
    except Exception:
        result["ai_explanation"] = result.get("explanation", "")
    
    return result


# ─── AI Agent ─────────────────────────────────────────────────────────────────
@app.post("/api/ai/chat")
async def ai_chat(request: AIChatRequest):
    """Chat with the FlowGuard AI agent."""
    response = await ai_agent.call_openrouter(request.message, request.context)
    return {
        "response": response,
        "timestamp": datetime.now().isoformat(),
        "model": "FlowGuard AI Agent",
    }

@app.get("/api/ai/insight")
async def get_ai_insight():
    """Get a personalized financial insight."""
    summary = ledger.get_financial_summary()
    insight = await ai_agent.get_financial_insight(summary)
    return {
        "insight": insight,
        "timestamp": datetime.now().isoformat(),
    }


# ─── Fraud Detection ─────────────────────────────────────────────────────────
@app.post("/api/fraud/score")
async def score_fraud(transaction: dict):
    """Score a transaction for fraud risk."""
    result = fraud_detector.score_transaction(transaction)
    return result


# ─── Conversion Rates ─────────────────────────────────────────────────────────
@app.get("/api/rates")
async def get_rates():
    """Get currency conversion rates."""
    return {
        "rates": ledger.conversion_rates,
        "base": "INR",
        "timestamp": datetime.now().isoformat(),
    }


# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
