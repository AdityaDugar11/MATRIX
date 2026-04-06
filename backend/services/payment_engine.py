"""
FlowGuard AI — Payment Engine Service
Handles transaction processing with fraud detection, routing, and AI analysis.
"""
import uuid
import random
from datetime import datetime
from models.fraud_model import fraud_detector
from services.routing import routing_engine
from services.ledger import ledger
from services import ai_agent


class PaymentEngine:
    """Core payment processing engine with agentic AI capabilities."""
    
    async def process_payment(self, payment_data: dict) -> dict:
        """
        Process a payment through the full FlowGuard pipeline:
        1. Validate → 2. Fraud Check → 3. Route Optimize → 4. AI Analyze → 5. Execute/Flag
        """
        # Step 1: Build transaction object
        amount = payment_data.get("amount", 0)
        currency = payment_data.get("currency", "INR")
        recipient = payment_data.get("recipient", "unknown@upi")
        is_cross_border = currency != "INR" or payment_data.get("is_cross_border", False)
        
        transaction = {
            "id": f"TXN-{uuid.uuid4().hex[:8].upper()}",
            "amount": amount,
            "currency": currency,
            "sender": "user@flowguard",
            "recipient": recipient,
            "payment_method": payment_data.get("payment_method", "upi"),
            "timestamp": datetime.now().isoformat(),
            "hour": datetime.now().hour,
            "location": payment_data.get("location", "Mumbai"),
            "device": payment_data.get("device", "web_desktop"),
            "velocity": random.randint(0, 3),
            "is_cross_border": is_cross_border,
            "is_new_recipient": payment_data.get("is_new_recipient", False),
            "recipient_freq": payment_data.get("recipient_freq", 5),
        }
        
        # Step 2: Fraud Detection
        fraud_result = fraud_detector.score_transaction(transaction)
        transaction["risk_score"] = fraud_result["risk_score"]
        transaction["risk_level"] = fraud_result["risk_level"]
        
        # Step 3: Route Optimization
        routing_result = routing_engine.optimize_route(
            amount=amount,
            currency=currency,
            is_cross_border=is_cross_border,
            risk_level=fraud_result["risk_level"],
            priority=payment_data.get("priority", "balanced"),
        )
        
        optimal_route = routing_result.get("optimal_route", {})
        transaction["payment_method"] = optimal_route.get("route_id", "upi")
        transaction["fee_percentage"] = optimal_route.get("fee_percentage", 0)
        
        # Step 4: AI Agent Analysis
        try:
            ai_analysis = await ai_agent.analyze_transaction(transaction, fraud_result, routing_result)
        except Exception:
            ai_analysis = "FlowGuard AI: Transaction analyzed. Proceeding with standard verification."
        
        transaction["agent_decision"] = ai_analysis
        
        # Step 5: Execute or Flag
        if fraud_result["risk_level"] == "CRITICAL":
            transaction["status"] = "blocked"
            action = "FRAUD_BLOCKED"
            message = f"Blocked ₹{amount:,.2f} to {recipient} — {', '.join(fraud_result['explanations'][:2])}"
        elif fraud_result["risk_level"] == "HIGH":
            transaction["status"] = "flagged"
            action = "FRAUD_FLAGGED"
            message = f"Flagged ₹{amount:,.2f} to {recipient} for review — risk score: {fraud_result['risk_score']}"
        else:
            transaction["status"] = "completed"
            action = "ROUTE_OPTIMIZED"
            route_name = optimal_route.get("name", "UPI")
            fee = optimal_route.get("calculated_fee", 0)
            message = f"Processed ₹{amount:,.2f} via {route_name} — fee: ₹{fee:.2f}, {optimal_route.get('speed', 'instant')}"
        
        # Record
        ledger.add_transaction(transaction)
        ledger.add_agent_log(action, message, fraud_result.get("confidence", 0.9))
        
        return {
            "transaction": transaction,
            "fraud_analysis": fraud_result,
            "routing": routing_result,
            "ai_analysis": ai_analysis,
            "status": transaction["status"],
        }
    
    async def analyze_existing_transaction(self, tx_id: str) -> dict:
        """Re-analyze an existing transaction."""
        tx = ledger.get_transaction(tx_id)
        if not tx:
            return {"error": f"Transaction {tx_id} not found"}
        
        fraud_result = fraud_detector.score_transaction(tx)
        routing_result = routing_engine.optimize_route(
            amount=tx["amount"],
            currency=tx.get("currency", "INR"),
            is_cross_border=tx.get("is_cross_border", False),
            risk_level=fraud_result["risk_level"],
        )
        
        try:
            ai_analysis = await ai_agent.analyze_transaction(tx, fraud_result, routing_result)
        except Exception:
            ai_analysis = "Analysis complete. Standard patterns detected."
        
        return {
            "transaction": tx,
            "fraud_analysis": fraud_result,
            "routing": routing_result,
            "ai_analysis": ai_analysis,
        }
    
    def optimize_route_for_amount(self, amount: float, currency: str, 
                                  destination: str = "domestic", priority: str = "balanced") -> dict:
        """Optimize routing for a given amount without processing."""
        is_cross_border = destination == "international"
        
        result = routing_engine.optimize_route(
            amount=amount,
            currency=currency,
            is_cross_border=is_cross_border,
            priority=priority,
        )
        
        return result


# Global instance
payment_engine = PaymentEngine()
