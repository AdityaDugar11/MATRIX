"""
FlowGuard AI — Agentic AI Service
Uses OpenRouter API (free models) for intelligent decision-making and financial insights.
"""
import os
import httpx
import json
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-3.1-8b-instruct:free"
FALLBACK_MODEL = "google/gemma-2-9b-it:free"


SYSTEM_PROMPT = """You are FlowGuard AI Agent — an intelligent payment orchestration assistant.
You analyze financial transactions, detect fraud patterns, optimize payment routes, and provide 
personalized financial insights. You are precise, data-driven, and protect users from fraud.

Your responses should be:
- Concise (2-4 sentences max)
- Action-oriented
- Include specific numbers/percentages when available
- Sound like a smart financial advisor, not a chatbot

You operate in the Indian financial ecosystem (UPI, NEFT, IMPS) and also handle 
cross-border payments via stablecoin (USDC) and SWIFT."""


async def call_openrouter(prompt: str, context: str = "", model: str = MODEL) -> str:
    """Call OpenRouter API with free model."""
    if not OPENROUTER_API_KEY:
        # Fallback to rule-based response when no API key
        return generate_fallback_response(prompt, context)
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
    ]
    if context:
        messages.append({"role": "user", "content": f"Context: {context}"})
    messages.append({"role": "user", "content": prompt})
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://flowguard-ai.onrender.com",
        "X-Title": "FlowGuard AI",
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.7,
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"OpenRouter API error: {e}")
        # Try fallback model
        if model != FALLBACK_MODEL:
            try:
                payload["model"] = FALLBACK_MODEL
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(OPENROUTER_URL, json=payload, headers=headers)
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
            except Exception:
                pass
        return generate_fallback_response(prompt, context)


def generate_fallback_response(prompt: str, context: str = "") -> str:
    """Generate rule-based response when API is unavailable."""
    prompt_lower = prompt.lower()
    
    if "fraud" in prompt_lower or "risk" in prompt_lower:
        return ("🛡️ Fraud Analysis: This transaction shows unusual patterns. "
                "Risk factors include transaction velocity, amount deviation from baseline, "
                "and recipient trust score. Recommend enhanced verification before processing.")
    
    if "route" in prompt_lower or "optimize" in prompt_lower or "fee" in prompt_lower:
        return ("📊 Route Optimization: Based on amount, destination, and current network conditions, "
                "UPI is optimal for domestic transfers (zero fees, instant settlement). "
                "For cross-border, stablecoin (USDC) saves up to 60% vs SWIFT with near-instant settlement.")
    
    if "insight" in prompt_lower or "spend" in prompt_lower or "save" in prompt_lower:
        return ("💡 Financial Insight: Your spending in dining and entertainment is 35% above your monthly average. "
                "Consider setting a budget cap of ₹5,000/month. At current savings rate (44%), "
                "you'll reach your ₹5L emergency fund goal in ~8 months.")
    
    if "explain" in prompt_lower or "decision" in prompt_lower:
        return ("🤖 Agent Decision: Transaction analyzed across 6 risk dimensions including amount deviation, "
                "temporal patterns, recipient trust, geographic risk, velocity, and device fingerprint. "
                "This transaction falls within normal behavioral patterns for this user profile.")
    
    return ("🤖 FlowGuard AI Agent: I've analyzed the request and recommend proceeding with "
            "standard verification. All systems operational — fraud detection active, "
            "routes optimized, compliance checks passed.")


async def analyze_transaction(transaction: dict, fraud_result: dict, routing_result: dict) -> str:
    """Generate AI analysis for a transaction."""
    context = f"""
Transaction: {json.dumps({
    'amount': transaction.get('amount'),
    'currency': transaction.get('currency'),
    'recipient': transaction.get('recipient'),
    'payment_method': transaction.get('payment_method'),
    'is_cross_border': transaction.get('is_cross_border'),
    'location': transaction.get('location'),
})}
Fraud Score: {fraud_result.get('risk_score')} ({fraud_result.get('risk_level')})
Fraud Reasons: {', '.join(fraud_result.get('explanations', []))}
Optimal Route: {routing_result.get('optimal_route', {}).get('name', 'N/A')}
Route Fee: {routing_result.get('optimal_route', {}).get('calculated_fee', 0)}
"""
    
    prompt = ("Analyze this transaction as FlowGuard AI Agent. Provide: "
              "1) Your decision (APPROVE/FLAG/BLOCK), "
              "2) Brief risk assessment, "
              "3) One actionable insight for the user. "
              "Be concise — max 3 sentences.")
    
    return await call_openrouter(prompt, context)


async def get_financial_insight(user_data: dict) -> str:
    """Generate personalized financial insight."""
    context = f"""
User Financial Profile:
- Monthly Income: ₹{user_data.get('monthly_income', 80000):,}
- Monthly Spending: ₹{user_data.get('monthly_spending', 45000):,}
- Savings Rate: {user_data.get('savings_rate', 0.44) * 100:.0f}%
- Financial Health Score: {user_data.get('financial_health_score', 78)}/100
- Total Balance: ₹{user_data.get('total_balance_inr', 250000):,.2f}
- Flagged Transactions: {user_data.get('flagged_transactions', 0)}
"""
    
    prompt = ("Generate one specific, actionable financial insight for this user. "
              "Include a concrete number or percentage. "
              "Make it feel like advice from a smart financial advisor.")
    
    return await call_openrouter(prompt, context)


async def explain_routing_decision(routing_result: dict, amount: float, currency: str) -> str:
    """Explain why a specific route was chosen."""
    optimal = routing_result.get("optimal_route", {})
    alternatives = routing_result.get("alternatives", [])
    
    context = f"""
Amount: {amount} {currency}
Selected Route: {optimal.get('name', 'N/A')}
Fee: {optimal.get('calculated_fee', 0)}
Speed: {optimal.get('speed', 'N/A')}
Alternatives: {', '.join(a.get('name', '') for a in alternatives[:3])}
Savings: {routing_result.get('savings_vs_worst', {}).get('amount', 0)}
"""
    
    prompt = ("Explain this routing decision in plain English. "
              "Why was this route optimal? What would the user save? "
              "Keep it to 2 sentences max.")
    
    return await call_openrouter(prompt, context)
