#!/usr/bin/env python3
"""
FlowGuard AI — Developer CLI
Command-line interface for the FlowGuard payment platform.

Usage:
  flowguard send <amount> --to <recipient> [--currency INR]
  flowguard analyze --txid <transaction_id>
  flowguard optimize --amount <amount> --to <destination>
  flowguard balance
  flowguard status
  flowguard insight
"""
import typer
import httpx
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import print as rprint
import json
import time

app = typer.Typer(
    name="flowguard",
    help="🛡️ FlowGuard AI — Agentic Smart Payment + Fraud Guardian CLI",
    add_completion=False,
)

console = Console()
API_BASE = "http://localhost:8000"


def api_call(method, endpoint, data=None):
    """Make API call to FlowGuard backend."""
    url = f"{API_BASE}{endpoint}"
    try:
        with httpx.Client(timeout=30.0) as client:
            if method == "GET":
                r = client.get(url)
            else:
                r = client.post(url, json=data)
            r.raise_for_status()
            return r.json()
    except httpx.ConnectError:
        console.print("[red]❌ Cannot connect to FlowGuard backend. Is it running?[/red]")
        console.print(f"   Expected at: {API_BASE}")
        raise typer.Exit(1)
    except Exception as e:
        console.print(f"[red]❌ API Error: {e}[/red]")
        raise typer.Exit(1)


@app.command()
def send(
    amount: float = typer.Argument(..., help="Amount to send"),
    to: str = typer.Option(..., "--to", help="Recipient (e.g., upi:rahul@okaxis)"),
    currency: str = typer.Option("INR", "--currency", help="Currency code"),
    priority: str = typer.Option("balanced", "--priority", help="speed|cost|security|balanced"),
):
    """💸 Send a payment with AI fraud detection & routing optimization."""
    recipient = to.replace("upi:", "")
    
    console.print(Panel(
        f"[bold yellow]FlowGuard AI Payment[/bold yellow]\n"
        f"Amount: {currency} {amount:,.2f}\n"
        f"To: {recipient}\n"
        f"Priority: {priority}",
        title="🚀 Initiating Payment",
        border_style="yellow",
    ))

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Analyzing transaction...", total=None)
        time.sleep(0.5)
        progress.update(task, description="Running ML fraud detection...")
        time.sleep(0.5)
        progress.update(task, description="Optimizing payment route...")
        time.sleep(0.5)
        progress.update(task, description="AI Agent making decision...")
        
        result = api_call("POST", "/api/send", {
            "amount": amount,
            "currency": currency,
            "recipient": recipient,
            "priority": priority,
            "is_cross_border": currency != "INR",
        })
        
        progress.update(task, description="Complete!", completed=True)

    # Display result
    status = result.get("status", "unknown")
    status_icon = "✅" if status == "completed" else "🛑" if status == "blocked" else "⚠️"
    status_color = "green" if status == "completed" else "red" if status == "blocked" else "yellow"

    table = Table(title=f"{status_icon} Payment {status.upper()}", border_style=status_color)
    table.add_column("Field", style="dim")
    table.add_column("Value")
    
    tx = result.get("transaction", {})
    fraud = result.get("fraud_analysis", {})
    routing = result.get("routing", {}).get("optimal_route", {})
    
    table.add_row("Transaction ID", tx.get("id", "N/A"))
    table.add_row("Amount", f"{currency} {amount:,.2f}")
    table.add_row("Route", routing.get("name", "N/A"))
    table.add_row("Fee", routing.get("fee_display", "₹0.00"))
    table.add_row("Speed", routing.get("speed", "N/A"))
    table.add_row("Risk Score", f"{fraud.get('risk_score', 0):.3f} ({fraud.get('risk_level', 'N/A')})")
    table.add_row("Processing", f"{fraud.get('processing_time_ms', 0)}ms")
    
    console.print(table)
    
    # AI Analysis
    ai = result.get("ai_analysis", "")
    if ai:
        console.print(Panel(ai, title="🤖 AI Agent Analysis", border_style="cyan"))


@app.command()
def analyze(
    txid: str = typer.Option(..., "--txid", help="Transaction ID to analyze"),
):
    """🔍 Analyze a transaction for fraud risk."""
    console.print(f"\n[cyan]Analyzing transaction {txid}...[/cyan]\n")
    
    result = api_call("POST", "/api/analyze", {"transaction_id": txid})
    
    if "error" in result:
        console.print(f"[red]{result['error']}[/red]")
        return
    
    fraud = result.get("fraud_analysis", {})
    
    table = Table(title="📊 Fraud Analysis Report", border_style="yellow")
    table.add_column("Metric", style="dim")
    table.add_column("Value")
    
    table.add_row("Risk Score", f"{fraud.get('risk_score', 0):.3f}")
    table.add_row("Risk Level", fraud.get("risk_level", "N/A"))
    table.add_row("ML Anomaly Score", str(fraud.get("ml_anomaly_score", 0)))
    table.add_row("Is Anomaly", str(fraud.get("is_anomaly", False)))
    table.add_row("Confidence", f"{fraud.get('confidence', 0) * 100:.0f}%")
    table.add_row("Processing Time", f"{fraud.get('processing_time_ms', 0)}ms")
    
    console.print(table)
    
    if fraud.get("explanations"):
        rprint("\n[bold]Explanations:[/bold]")
        for exp in fraud["explanations"]:
            rprint(f"  • {exp}")
    
    ai = result.get("ai_analysis", "")
    if ai:
        console.print(Panel(ai, title="🤖 AI Agent Analysis", border_style="cyan"))


@app.command()
def optimize(
    amount: float = typer.Option(10000, "--amount", help="Amount to optimize"),
    to: str = typer.Option("domestic", "--to", help="domestic|international"),
    currency: str = typer.Option("INR", "--currency", help="Currency code"),
    priority: str = typer.Option("balanced", "--priority", help="Optimization priority"),
):
    """🔀 Find the optimal payment route for an amount."""
    console.print(f"\n[cyan]Optimizing route for {currency} {amount:,.2f} ({to})...[/cyan]\n")
    
    result = api_call("POST", "/api/optimize", {
        "amount": amount,
        "currency": currency,
        "destination": to,
        "priority": priority,
    })
    
    optimal = result.get("optimal_route", {})
    
    table = Table(title="🔀 Optimal Route", border_style="green")
    table.add_column("Field", style="dim")
    table.add_column("Value")
    
    table.add_row("Route", optimal.get("name", "N/A"))
    table.add_row("Fee", optimal.get("fee_display", "₹0.00"))
    table.add_row("Speed", optimal.get("speed", "N/A"))
    table.add_row("Reliability", f"{optimal.get('reliability', 0) * 100:.1f}%")
    
    console.print(table)
    
    # Alternatives
    alts = result.get("alternatives", [])
    if alts:
        alt_table = Table(title="Alternative Routes", border_style="dim")
        alt_table.add_column("Route")
        alt_table.add_column("Fee")
        alt_table.add_column("Speed")
        for alt in alts[:3]:
            alt_table.add_row(alt.get("name", ""), alt.get("fee_display", ""), alt.get("speed", ""))
        console.print(alt_table)
    
    savings = result.get("savings_vs_worst", {})
    if savings.get("amount", 0) > 0:
        rprint(f"\n[green]💰 Savings vs expensive route: ₹{savings['amount']:,.2f} ({savings['percentage']:.1f}%)[/green]")
    
    explanation = result.get("explanation", "")
    if explanation:
        console.print(Panel(explanation, title="📝 Explanation", border_style="yellow"))


@app.command()
def balance():
    """💰 Show current balance across currencies."""
    data = api_call("GET", "/api/dashboard")
    balances = data.get("summary", {}).get("balances", {})
    
    table = Table(title="💰 Account Balances", border_style="yellow")
    table.add_column("Currency", style="bold")
    table.add_column("Balance", justify="right")
    
    for cur, amt in balances.items():
        symbol = "₹" if cur == "INR" else "$"
        table.add_row(cur, f"{symbol}{amt:,.2f}")
    
    console.print(table)
    
    summary = data.get("summary", {})
    rprint(f"\n  Financial Health: [bold]{summary.get('financial_health_score', 78)}/100[/bold]")
    rprint(f"  Savings Rate: [green]{summary.get('savings_rate', 0.44) * 100:.0f}%[/green]")
    rprint(f"  Total Transactions: {summary.get('total_transactions', 0)}")
    rprint(f"  Flagged: [red]{summary.get('flagged_transactions', 0)}[/red]")


@app.command()
def status():
    """⚡ Show system & AI agent status."""
    health = api_call("GET", "/health")
    
    console.print(Panel(
        f"[bold green]FlowGuard AI — System Status[/bold green]\n\n"
        f"  Status: {'🟢 Operational' if health.get('status') == 'healthy' else '🔴 Down'}\n"
        f"  Fraud Model: {'🟢 ' + health.get('fraud_model', 'unknown')}\n"
        f"  AI Agent: {'🟢 ' + health.get('ai_agent', 'unknown')}\n"
        f"  Timestamp: {health.get('timestamp', 'N/A')}",
        title="⚡ System Status",
        border_style="green",
    ))


@app.command()
def insight():
    """💡 Get personalized financial insight from AI."""
    console.print("[cyan]Generating insight...[/cyan]\n")
    result = api_call("GET", "/api/ai/insight")
    console.print(Panel(
        result.get("insight", "No insight available."),
        title="💡 FlowGuard AI Insight",
        border_style="yellow",
    ))


if __name__ == "__main__":
    app()
