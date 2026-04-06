"""
FlowGuard AI — Intelligent Payment Routing Engine
Optimizes payment routes for cost, speed, and security.
"""
from datetime import datetime
import random


class RoutingEngine:
    """Intelligent payment routing optimizer."""
    
    # Route configurations
    ROUTES = {
        "upi": {
            "name": "UPI (Unified Payments Interface)",
            "fee_percentage": 0.0,
            "flat_fee": 0.0,
            "speed": "instant",
            "speed_seconds": 3,
            "supported_currencies": ["INR"],
            "max_amount": 100000,
            "reliability": 0.99,
            "domestic_only": True,
        },
        "imps": {
            "name": "IMPS (Immediate Payment Service)",
            "fee_percentage": 0.0,
            "flat_fee": 5.0,
            "speed": "instant",
            "speed_seconds": 10,
            "supported_currencies": ["INR"],
            "max_amount": 500000,
            "reliability": 0.98,
            "domestic_only": True,
        },
        "neft": {
            "name": "NEFT (National Electronic Funds Transfer)",
            "fee_percentage": 0.0,
            "flat_fee": 2.5,
            "speed": "30 minutes",
            "speed_seconds": 1800,
            "supported_currencies": ["INR"],
            "max_amount": 10000000,
            "reliability": 0.999,
            "domestic_only": True,
        },
        "stablecoin": {
            "name": "Stablecoin Transfer (USDC)",
            "fee_percentage": 0.1,
            "flat_fee": 0.5,
            "speed": "30 seconds",
            "speed_seconds": 30,
            "supported_currencies": ["USDC", "USD", "INR"],
            "max_amount": float("inf"),
            "reliability": 0.97,
            "domestic_only": False,
        },
        "swift": {
            "name": "SWIFT International Transfer",
            "fee_percentage": 2.5,
            "flat_fee": 25.0,
            "speed": "1-3 business days",
            "speed_seconds": 259200,
            "supported_currencies": ["USD", "AED", "SGD", "GBP", "EUR"],
            "max_amount": float("inf"),
            "reliability": 0.995,
            "domestic_only": False,
        },
        "wire": {
            "name": "Wire Transfer",
            "fee_percentage": 1.5,
            "flat_fee": 15.0,
            "speed": "1-2 business days",
            "speed_seconds": 172800,
            "supported_currencies": ["USD", "AED", "SGD", "GBP", "EUR"],
            "max_amount": float("inf"),
            "reliability": 0.99,
            "domestic_only": False,
        },
        "e_rupee": {
            "name": "Digital Rupee (e₹) - CBDC",
            "fee_percentage": 0.0,
            "flat_fee": 0.0,
            "speed": "instant",
            "speed_seconds": 1,
            "supported_currencies": ["INR"],
            "max_amount": 200000,
            "reliability": 0.95,
            "domestic_only": True,
        }
    }
    
    def calculate_fee(self, route_id: str, amount: float) -> float:
        """Calculate total fee for a route."""
        route = self.ROUTES.get(route_id)
        if not route:
            return 0
        return round(amount * (route["fee_percentage"] / 100) + route["flat_fee"], 2)
    
    def get_eligible_routes(self, amount: float, currency: str, is_cross_border: bool) -> list:
        """Get all eligible routes for a transaction."""
        eligible = []
        for route_id, route in self.ROUTES.items():
            # Check domestic constraint
            if route["domestic_only"] and is_cross_border:
                continue
            # Check currency support
            if currency not in route["supported_currencies"]:
                continue
            # Check amount limit
            if amount > route["max_amount"]:
                continue
            
            fee = self.calculate_fee(route_id, amount)
            eligible.append({
                "route_id": route_id,
                **route,
                "calculated_fee": fee,
                "fee_display": f"₹{fee:.2f}" if currency == "INR" else f"${fee:.2f}",
            })
        
        return eligible
    
    def optimize_route(self, amount: float, currency: str, is_cross_border: bool, 
                       risk_level: str = "LOW", priority: str = "balanced") -> dict:
        """
        Find the optimal route based on priority.
        Priority: 'speed', 'cost', 'security', 'balanced'
        """
        eligible = self.get_eligible_routes(amount, currency, is_cross_border)
        
        if not eligible:
            return {
                "optimal_route": None,
                "alternatives": [],
                "explanation": "No eligible routes found for this transaction configuration.",
            }
        
        # Score each route
        for route in eligible:
            speed_score = 1 - min(route["speed_seconds"] / 259200, 1)  # Normalize to 0-1
            cost_score = 1 - min(route["calculated_fee"] / (amount * 0.03), 1)
            security_score = route["reliability"]
            
            # Adjust weights based on priority
            if priority == "speed":
                route["total_score"] = speed_score * 0.6 + cost_score * 0.2 + security_score * 0.2
            elif priority == "cost":
                route["total_score"] = speed_score * 0.2 + cost_score * 0.6 + security_score * 0.2
            elif priority == "security":
                route["total_score"] = speed_score * 0.15 + cost_score * 0.15 + security_score * 0.7
            else:  # balanced
                route["total_score"] = speed_score * 0.35 + cost_score * 0.35 + security_score * 0.3
            
            # Penalize if high risk
            if risk_level in ["HIGH", "CRITICAL"]:
                route["total_score"] *= route["reliability"]
        
        # Sort by score
        eligible.sort(key=lambda x: x["total_score"], reverse=True)
        
        optimal = eligible[0]
        alternatives = eligible[1:4]
        
        # Generate explanation
        explanation = self._generate_explanation(optimal, alternatives, amount, currency, is_cross_border, priority)
        
        return {
            "optimal_route": optimal,
            "alternatives": alternatives,
            "explanation": explanation,
            "savings_vs_worst": self._calculate_savings(eligible, amount),
        }
    
    def _generate_explanation(self, optimal, alternatives, amount, currency, is_cross_border, priority):
        """Generate human-readable explanation for routing decision."""
        parts = [f"Routing via {optimal['name']}"]
        
        if optimal["calculated_fee"] == 0:
            parts.append("with zero fees")
        else:
            parts.append(f"with fees of {optimal['fee_display']}")
        
        parts.append(f"— {optimal['speed']} settlement")
        
        if is_cross_border and optimal["route_id"] == "stablecoin":
            parts.append(". Stablecoin selected for cross-border: 60% lower fees than SWIFT with near-instant settlement")
        
        if alternatives:
            alt = alternatives[0]
            if alt["calculated_fee"] > optimal["calculated_fee"]:
                savings = alt["calculated_fee"] - optimal["calculated_fee"]
                parts.append(f". Saves ₹{savings:.2f} vs {alt['name']}")
        
        return " ".join(parts)
    
    def _calculate_savings(self, routes, amount):
        """Calculate savings vs the most expensive route."""
        if len(routes) < 2:
            return {"amount": 0, "percentage": 0}
        
        cheapest = min(r["calculated_fee"] for r in routes)
        most_expensive = max(r["calculated_fee"] for r in routes)
        savings = most_expensive - cheapest
        
        return {
            "amount": round(savings, 2),
            "percentage": round((savings / max(most_expensive, 0.01)) * 100, 1),
        }


# Global instance
routing_engine = RoutingEngine()
