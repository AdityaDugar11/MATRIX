"""
Seed data for FlowGuard AI - Synthetic transaction data for demo purposes.
"""
import random
import time
import uuid
from datetime import datetime, timedelta

# UPI IDs for demo
UPI_IDS = [
    "rahul@okaxis", "priya@ybl", "amit@paytm", "sneha@ibl",
    "vikram@kotak", "deepa@sbi", "arjun@hdfc", "kavita@icici",
    "merchant.coffee@okaxis", "merchant.grocery@ybl",
    "merchant.fuel@paytm", "merchant.amazon@apl",
    "scammer_suspicious@fake", "unknown_offshore@intl"
]

WALLET_ADDRESSES = [
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
]

LOCATIONS = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata",
    "Hyderabad", "Pune", "Ahmedabad", "Dubai", "Singapore",
    "London", "New York", "Lagos", "Unknown"
]

DEVICE_TYPES = ["mobile_android", "mobile_ios", "web_desktop", "web_mobile", "api"]

def generate_transaction_id():
    return f"TXN-{uuid.uuid4().hex[:8].upper()}"

def generate_seed_transactions(count=50):
    """Generate synthetic transaction data for demo."""
    transactions = []
    base_time = datetime.now() - timedelta(days=30)
    
    for i in range(count):
        is_suspicious = random.random() < 0.15  # 15% suspicious
        is_cross_border = random.random() < 0.2  # 20% cross-border
        
        if is_suspicious:
            amount = random.choice([
                random.uniform(50000, 500000),  # Very high amount
                random.uniform(9900, 10100),     # Just below reporting threshold
                random.uniform(1, 10),            # Micro-transactions (testing)
            ])
            hour = random.choice([1, 2, 3, 4, 23, 0])  # Odd hours
            recipient = random.choice(["scammer_suspicious@fake", "unknown_offshore@intl", random.choice(UPI_IDS)])
            velocity = random.randint(5, 20)  # High velocity
            location = random.choice(["Unknown", "Lagos", "Dubai"])
        else:
            amount = random.uniform(100, 25000)
            hour = random.randint(8, 22)
            recipient = random.choice(UPI_IDS[:12])
            velocity = random.randint(0, 3)
            location = random.choice(LOCATIONS[:8])
        
        tx_time = base_time + timedelta(
            days=random.randint(0, 30),
            hours=hour,
            minutes=random.randint(0, 59)
        )
        
        currency = "INR" if not is_cross_border else random.choice(["USD", "USDC", "AED", "SGD"])
        payment_method = "upi" if not is_cross_border else random.choice(["stablecoin", "swift", "wire"])
        
        tx = {
            "id": generate_transaction_id(),
            "amount": round(amount, 2),
            "currency": currency,
            "sender": "user@flowguard",
            "recipient": recipient,
            "payment_method": payment_method,
            "timestamp": tx_time.isoformat(),
            "hour": hour,
            "location": location,
            "device": random.choice(DEVICE_TYPES),
            "velocity": velocity,
            "is_cross_border": is_cross_border,
            "status": "completed",
            "risk_score": 0,  # Will be filled by fraud model
            "risk_level": "LOW",
            "agent_decision": "",
            "fee_percentage": round(random.uniform(0.1, 3.0) if is_cross_border else random.uniform(0, 0.5), 2),
        }
        transactions.append(tx)
    
    return sorted(transactions, key=lambda x: x["timestamp"], reverse=True)


# User profile for demo
DEMO_USER = {
    "name": "Aditya Dugar",
    "email": "aditya@flowguard.ai",
    "balance": {
        "INR": 250000.00,
        "USDC": 1200.00,
        "USD": 500.00,
    },
    "upi_id": "aditya@flowguard",
    "wallet_address": "0xFlowGuard...Demo",
    "risk_profile": "moderate",
    "total_transactions": 156,
    "flagged_transactions": 3,
    "financial_health_score": 78,
    "monthly_spending": 45000,
    "monthly_income": 80000,
    "savings_rate": 0.44,
}

# Agent activity log entries for demo
DEMO_AGENT_LOGS = [
    {
        "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat(),
        "action": "ROUTE_OPTIMIZED",
        "message": "Routed ₹15,000 via UPI instead of NEFT — saved ₹12 in fees, 23 min faster",
        "confidence": 0.95,
    },
    {
        "timestamp": (datetime.now() - timedelta(minutes=12)).isoformat(),
        "action": "FRAUD_BLOCKED",
        "message": "Blocked suspicious ₹4,99,000 to unknown_offshore@intl — unusual amount + location mismatch",
        "confidence": 0.92,
    },
    {
        "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
        "action": "INSIGHT_GENERATED",
        "message": "Your dining expenses are 40% above your monthly average. Consider setting a budget alert.",
        "confidence": 0.88,
    },
    {
        "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
        "action": "COMPLIANCE_CHECK",
        "message": "Transaction to merchant.amazon@apl passed AML/KYC verification — processing normally",
        "confidence": 0.99,
    },
    {
        "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
        "action": "STABLECOIN_SWAP",
        "message": "Converted ₹8,500 → 101.2 USDC for cross-border payment — 60% lower fees than SWIFT",
        "confidence": 0.94,
    },
]
