"""
FlowGuard AI — Fraud Detection Engine
Uses Isolation Forest (unsupervised anomaly detection) for real-time fraud scoring.
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import random
import time


class FraudDetector:
    """ML-powered fraud detection using Isolation Forest + rule-based checks."""
    
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            max_samples='auto'
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self._train_on_synthetic_data()
    
    def _train_on_synthetic_data(self):
        """Train on synthetic PaySim-style data for demo."""
        np.random.seed(42)
        n_samples = 1000
        
        # Normal transactions
        normal_amounts = np.random.lognormal(mean=7, sigma=1.5, size=int(n_samples * 0.85))
        normal_hours = np.random.normal(loc=14, scale=4, size=int(n_samples * 0.85)).clip(0, 23)
        normal_velocity = np.random.poisson(lam=1, size=int(n_samples * 0.85))
        normal_recipient_freq = np.random.poisson(lam=5, size=int(n_samples * 0.85))
        normal_is_new_recipient = np.random.binomial(1, 0.1, size=int(n_samples * 0.85))
        normal_location_risk = np.random.uniform(0, 0.3, size=int(n_samples * 0.85))
        
        # Fraudulent transactions
        n_fraud = n_samples - int(n_samples * 0.85)
        fraud_amounts = np.random.lognormal(mean=10, sigma=2, size=n_fraud)
        fraud_hours = np.random.choice([0, 1, 2, 3, 4, 23], size=n_fraud).astype(float)
        fraud_velocity = np.random.poisson(lam=8, size=n_fraud)
        fraud_recipient_freq = np.random.poisson(lam=0.5, size=n_fraud)
        fraud_is_new_recipient = np.random.binomial(1, 0.8, size=n_fraud)
        fraud_location_risk = np.random.uniform(0.5, 1.0, size=n_fraud)
        
        # Combine features
        amounts = np.concatenate([normal_amounts, fraud_amounts])
        hours = np.concatenate([normal_hours, fraud_hours])
        velocity = np.concatenate([normal_velocity, fraud_velocity])
        recipient_freq = np.concatenate([normal_recipient_freq, fraud_recipient_freq])
        is_new_recipient = np.concatenate([normal_is_new_recipient, fraud_is_new_recipient])
        location_risk = np.concatenate([normal_location_risk, fraud_location_risk])
        
        X = np.column_stack([amounts, hours, velocity, recipient_freq, is_new_recipient, location_risk])
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled)
        self.is_trained = True
    
    def _get_location_risk(self, location: str) -> float:
        """Assign risk score based on location."""
        HIGH_RISK = {"Unknown": 0.9, "Lagos": 0.8, "Dubai": 0.5}
        MEDIUM_RISK = {"Singapore": 0.3, "London": 0.2, "New York": 0.2}
        return HIGH_RISK.get(location, MEDIUM_RISK.get(location, 0.1))
    
    def _rule_based_score(self, transaction: dict) -> tuple:
        """Apply rule-based checks and return (risk_boost, reasons)."""
        risk_boost = 0.0
        reasons = []
        
        amount = transaction.get("amount", 0)
        hour = transaction.get("hour", 12)
        velocity = transaction.get("velocity", 0)
        recipient = transaction.get("recipient", "")
        is_cross_border = transaction.get("is_cross_border", False)
        
        # Rule 1: Very high amount
        if amount > 100000:
            risk_boost += 0.2
            reasons.append(f"Unusually high amount: ₹{amount:,.2f}")
        
        # Rule 2: Near reporting threshold (structuring)
        if 9500 <= amount <= 10500:
            risk_boost += 0.15
            reasons.append("Amount near regulatory reporting threshold (₹10,000)")
        
        # Rule 3: Odd hours
        if hour < 5 or hour == 23:
            risk_boost += 0.15
            reasons.append(f"Transaction at unusual hour: {hour}:00")
        
        # Rule 4: High velocity
        if velocity > 5:
            risk_boost += 0.25
            reasons.append(f"High transaction velocity: {velocity} tx/min")
        
        # Rule 5: Suspicious recipient
        if "suspicious" in recipient or "fake" in recipient or "offshore" in recipient:
            risk_boost += 0.3
            reasons.append(f"Suspicious recipient: {recipient}")
        
        # Rule 6: Cross-border + high amount
        if is_cross_border and amount > 50000:
            risk_boost += 0.1
            reasons.append("High-value cross-border transaction")
        
        return min(risk_boost, 0.5), reasons
    
    def score_transaction(self, transaction: dict) -> dict:
        """
        Score a transaction for fraud risk.
        Returns risk score (0-1), risk level, and explanation.
        """
        start_time = time.time()
        
        # Extract features
        amount = transaction.get("amount", 0)
        hour = transaction.get("hour", 12)
        velocity = transaction.get("velocity", 0)
        recipient_freq = transaction.get("recipient_freq", 5)
        is_new_recipient = 1 if transaction.get("is_new_recipient", False) else 0
        location = transaction.get("location", "Mumbai")
        location_risk = self._get_location_risk(location)
        
        # ML score
        features = np.array([[amount, hour, velocity, recipient_freq, is_new_recipient, location_risk]])
        features_scaled = self.scaler.transform(features)
        
        # Isolation Forest: -1 = anomaly, 1 = normal
        # decision_function: lower = more anomalous
        anomaly_score = self.model.decision_function(features_scaled)[0]
        prediction = self.model.predict(features_scaled)[0]
        
        # Convert to 0-1 risk score (higher = more risky)
        ml_risk_score = max(0, min(1, 0.5 - anomaly_score))
        
        # Rule-based boost
        rule_boost, rule_reasons = self._rule_based_score(transaction)
        
        # Combined score
        final_score = min(1.0, ml_risk_score * 0.6 + rule_boost * 0.4 + (0.2 if prediction == -1 else 0))
        final_score = round(final_score, 3)
        
        # Determine risk level
        if final_score >= 0.8:
            risk_level = "CRITICAL"
        elif final_score >= 0.6:
            risk_level = "HIGH"
        elif final_score >= 0.35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        # Build explanation
        explanations = []
        if prediction == -1:
            explanations.append("ML model flagged this as anomalous behavior")
        if rule_reasons:
            explanations.extend(rule_reasons)
        if not explanations:
            explanations.append("Transaction appears normal based on historical patterns")
        
        processing_time = round((time.time() - start_time) * 1000, 1)
        
        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "ml_anomaly_score": round(float(anomaly_score), 4),
            "is_anomaly": prediction == -1,
            "confidence": round(abs(anomaly_score) / 0.5, 2),
            "explanations": explanations,
            "processing_time_ms": processing_time,
            "features_analyzed": {
                "amount": amount,
                "hour": hour,
                "velocity": velocity,
                "location_risk": location_risk,
                "is_new_recipient": bool(is_new_recipient),
            }
        }


# Global instance
fraud_detector = FraudDetector()
