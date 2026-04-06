# 🛡️ FlowGuard AI — Agentic Smart Payment + Fraud Guardian

<div align="center">

![FlowGuard AI](https://img.shields.io/badge/FlowGuard-AI%20Agent-F59E0B?style=for-the-badge&logo=shield&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)

**An AI-powered payment orchestration platform that detects fraud in real-time,
optimizes payment routes, and provides personalized financial insights.**

*Built for DevCraft Hackathon (SimonSays) — FinTech Track*

</div>

---

## 🎯 Problem Statement

Users and small businesses face high fraud risks, delays, and high fees in real-time/cross-border payments amid rising AI-generated scams. Traditional systems lack intelligent routing and instant risk scoring.

## 💡 Solution: FlowGuard AI

A unified platform where an **agentic AI** acts as the intelligent command center:

1. **Analyzes** transaction patterns (amount, recipient, behavior)
2. **Detects** fraud risk in milliseconds (ML model + rules)
3. **Routes** optimally (UPI domestic, stablecoin cross-border)
4. **Executes** or flags the transaction
5. **Delivers** personalized financial insights

## 🚀 Key Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Real-time balance, transactions, risk heatmap, agent activity |
| **💸 Smart Payments** | UPI + Stablecoin + SWIFT with AI routing optimization |
| **🛡️ Fraud Detection** | ML-powered (Isolation Forest) + rule-based, scores in ~2ms |
| **🤖 AI Agent** | Autonomous routing decisions with natural language explanations |
| **💻 CLI Terminal** | Developer-friendly commands (`flowguard send`, `analyze`, etc.) |
| **📈 Analytics** | Risk heatmaps, distribution charts, spending insights |

## 🏗️ Architecture

```
┌───────────────────────────────────────────────────┐
│            React + Vite Frontend (Vercel)          │
│  Dashboard │ Payments │ Analytics │ CLI Terminal   │
└────────────────────┬──────────────────────────────┘
                     │ REST API
┌────────────────────▼──────────────────────────────┐
│           FastAPI Backend (Render)                  │
│  ┌──────────┬──────────┬───────────┬──────────┐   │
│  │ Payment  │  Fraud   │ AI Agent  │ Route    │   │
│  │ Engine   │ Detector │(OpenRouter)│ Optimizer│   │
│  └──────────┴──────────┴───────────┴──────────┘   │
│            In-Memory Ledger + ML Model             │
└────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Vanilla CSS (golden/dark theme)
- **Backend**: FastAPI (Python) + Uvicorn
- **AI/LLM**: OpenRouter (Meta LLaMA 3.1 8B — free tier)
- **Fraud ML**: scikit-learn (Isolation Forest anomaly detection)
- **Payments**: In-memory ledger with UPI, IMPS, NEFT, SWIFT, Stablecoin simulation
- **CLI**: Built-in browser terminal + Python `typer` CLI

## 📦 Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set your OpenRouter API key (free at https://openrouter.ai/keys)
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

python main.py
# API runs at http://localhost:8000
```

