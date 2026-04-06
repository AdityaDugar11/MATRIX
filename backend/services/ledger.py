"""
FlowGuard AI — In-Memory Ledger Service
Manages user balances, transaction history, and financial state.
"""
import uuid
from datetime import datetime
from typing import Optional
from data.seed_data import generate_seed_transactions, DEMO_USER, DEMO_AGENT_LOGS


class Ledger:
    """In-memory ledger for payment tracking."""
    
    def __init__(self):
        self.users = {"user@flowguard": {**DEMO_USER}}
        self.transactions = generate_seed_transactions(50)
        self.agent_logs = list(DEMO_AGENT_LOGS)
        self.conversion_rates = {
            "INR_USD": 0.012,
            "USD_INR": 84.15,
            "INR_USDC": 0.012,
            "USDC_INR": 84.10,
            "INR_AED": 0.044,
            "AED_INR": 22.90,
            "INR_SGD": 0.016,
            "SGD_INR": 62.50,
            "USD_USDC": 1.0,
            "USDC_USD": 1.0,
        }
    
    def get_user(self, user_id: str = "user@flowguard") -> dict:
        return self.users.get(user_id, DEMO_USER)
    
    def get_balance(self, user_id: str = "user@flowguard") -> dict:
        user = self.get_user(user_id)
        return user.get("balance", {})
    
    def get_transactions(self, limit: int = 50, offset: int = 0) -> list:
        return self.transactions[offset:offset + limit]
    
    def get_transaction(self, tx_id: str) -> Optional[dict]:
        for tx in self.transactions:
            if tx["id"] == tx_id:
                return tx
        return None
    
    def add_transaction(self, transaction: dict) -> dict:
        """Add a new transaction to the ledger."""
        if "id" not in transaction:
            transaction["id"] = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        if "timestamp" not in transaction:
            transaction["timestamp"] = datetime.now().isoformat()
        
        self.transactions.insert(0, transaction)
        
        # Update balance
        user = self.get_user()
        currency = transaction.get("currency", "INR")
        amount = transaction.get("amount", 0)
        
        if currency in user["balance"]:
            user["balance"][currency] -= amount
        
        user["total_transactions"] += 1
        
        return transaction
    
    def add_agent_log(self, action: str, message: str, confidence: float = 0.9):
        """Add an agent activity log entry."""
        log = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "message": message,
            "confidence": confidence,
        }
        self.agent_logs.insert(0, log)
        return log
    
    def get_agent_logs(self, limit: int = 20) -> list:
        return self.agent_logs[:limit]
    
    def get_conversion_rate(self, from_currency: str, to_currency: str) -> float:
        key = f"{from_currency}_{to_currency}"
        return self.conversion_rates.get(key, 1.0)
    
    def get_financial_summary(self) -> dict:
        user = self.get_user()
        total_inr = (
            user["balance"]["INR"] + 
            user["balance"].get("USDC", 0) * self.conversion_rates["USDC_INR"] +
            user["balance"].get("USD", 0) * self.conversion_rates["USD_INR"]
        )
        
        flagged = sum(1 for tx in self.transactions if tx.get("risk_level") in ["HIGH", "CRITICAL"])
        total_spent_30d = sum(tx["amount"] for tx in self.transactions if tx.get("currency") == "INR")
        
        return {
            "total_balance_inr": round(total_inr, 2),
            "balances": user["balance"],
            "financial_health_score": user["financial_health_score"],
            "total_transactions": len(self.transactions),
            "flagged_transactions": flagged,
            "total_spent_30d": round(total_spent_30d, 2),
            "savings_rate": user["savings_rate"],
            "risk_profile": user["risk_profile"],
        }
    
    def get_risk_heatmap_data(self) -> list:
        """Generate risk heatmap data (hour vs day_of_week vs risk)."""
        from collections import defaultdict
        heatmap = defaultdict(lambda: {"count": 0, "total_risk": 0, "total_amount": 0})
        
        for tx in self.transactions:
            try:
                dt = datetime.fromisoformat(tx["timestamp"])
                key = (dt.hour, dt.weekday())
                heatmap[key]["count"] += 1
                heatmap[key]["total_risk"] += tx.get("risk_score", 0)
                heatmap[key]["total_amount"] += tx.get("amount", 0)
            except Exception:
                continue
        
        result = []
        for (hour, day), data in heatmap.items():
            avg_risk = data["total_risk"] / data["count"] if data["count"] > 0 else 0
            result.append({
                "hour": hour,
                "day": day,
                "count": data["count"],
                "avg_risk": round(avg_risk, 3),
                "total_amount": round(data["total_amount"], 2),
            })
        
        return result


# Global instance
ledger = Ledger()
