/**
 * FlowGuard AI — Intelligent Payment Routing Engine (JS Port)
 */

export class RoutingEngine {
  constructor() {
    this.ROUTES = {
      upi: {
        name: 'UPI (Unified Payments Interface)',
        fee_percentage: 0.0, flat_fee: 0.0, speed: 'instant',
        speed_seconds: 3, supported_currencies: ['INR'],
        max_amount: 100000, reliability: 0.99, domestic_only: true,
      },
      imps: {
        name: 'IMPS (Immediate Payment Service)',
        fee_percentage: 0.0, flat_fee: 5.0, speed: 'instant',
        speed_seconds: 10, supported_currencies: ['INR'],
        max_amount: 500000, reliability: 0.98, domestic_only: true,
      },
      neft: {
        name: 'NEFT (National Electronic Funds Transfer)',
        fee_percentage: 0.0, flat_fee: 2.5, speed: '30 minutes',
        speed_seconds: 1800, supported_currencies: ['INR'],
        max_amount: 10000000, reliability: 0.999, domestic_only: true,
      },
      stablecoin: {
        name: 'Stablecoin Transfer (USDC)',
        fee_percentage: 0.1, flat_fee: 0.5, speed: '30 seconds',
        speed_seconds: 30, supported_currencies: ['USDC', 'USD', 'INR'],
        max_amount: Infinity, reliability: 0.97, domestic_only: false,
      },
      swift: {
        name: 'SWIFT International Transfer',
        fee_percentage: 2.5, flat_fee: 25.0, speed: '1-3 business days',
        speed_seconds: 259200, supported_currencies: ['USD', 'AED', 'SGD', 'GBP', 'EUR'],
        max_amount: Infinity, reliability: 0.995, domestic_only: false,
      },
      wire: {
        name: 'Wire Transfer',
        fee_percentage: 1.5, flat_fee: 15.0, speed: '1-2 business days',
        speed_seconds: 172800, supported_currencies: ['USD', 'AED', 'SGD', 'GBP', 'EUR'],
        max_amount: Infinity, reliability: 0.99, domestic_only: false,
      },
      e_rupee: {
        name: 'Digital Rupee (e₹) - CBDC',
        fee_percentage: 0.0, flat_fee: 0.0, speed: 'instant',
        speed_seconds: 1, supported_currencies: ['INR'],
        max_amount: 200000, reliability: 0.95, domestic_only: true,
      },
    };
  }

  calculateFee(routeId, amount) {
    const route = this.ROUTES[routeId];
    if (!route) return 0;
    return Math.round((amount * (route.fee_percentage / 100) + route.flat_fee) * 100) / 100;
  }

  getEligibleRoutes(amount, currency, isCrossBorder) {
    const eligible = [];
    for (const [routeId, route] of Object.entries(this.ROUTES)) {
      if (route.domestic_only && isCrossBorder) continue;
      if (!route.supported_currencies.includes(currency)) continue;
      if (amount > route.max_amount) continue;

      const fee = this.calculateFee(routeId, amount);
      eligible.push({
        route_id: routeId,
        ...route,
        calculated_fee: fee,
        fee_display: currency === 'INR' ? `₹${fee.toFixed(2)}` : `$${fee.toFixed(2)}`,
      });
    }
    return eligible;
  }

  optimizeRoute(amount, currency, isCrossBorder, riskLevel = 'LOW', priority = 'balanced') {
    const eligible = this.getEligibleRoutes(amount, currency, isCrossBorder);

    if (eligible.length === 0) {
      return { optimal_route: null, alternatives: [], explanation: 'No eligible routes found.' };
    }

    for (const route of eligible) {
      const speedScore = 1 - Math.min(route.speed_seconds / 259200, 1);
      const costScore = 1 - Math.min(route.calculated_fee / (amount * 0.03), 1);
      const securityScore = route.reliability;

      if (priority === 'speed') route.total_score = speedScore * 0.6 + costScore * 0.2 + securityScore * 0.2;
      else if (priority === 'cost') route.total_score = speedScore * 0.2 + costScore * 0.6 + securityScore * 0.2;
      else if (priority === 'security') route.total_score = speedScore * 0.15 + costScore * 0.15 + securityScore * 0.7;
      else route.total_score = speedScore * 0.35 + costScore * 0.35 + securityScore * 0.3;

      if (['HIGH', 'CRITICAL'].includes(riskLevel)) route.total_score *= route.reliability;
    }

    eligible.sort((a, b) => b.total_score - a.total_score);
    const optimal = eligible[0];
    const alternatives = eligible.slice(1, 4);

    const explanation = this._generateExplanation(optimal, alternatives, amount, currency, isCrossBorder, priority);

    return {
      optimal_route: optimal,
      alternatives,
      explanation,
      savings_vs_worst: this._calculateSavings(eligible, amount),
    };
  }

  _generateExplanation(optimal, alternatives, amount, currency, isCrossBorder, priority) {
    const parts = [`Routing via ${optimal.name}`];
    if (optimal.calculated_fee === 0) parts.push('with zero fees');
    else parts.push(`with fees of ${optimal.fee_display}`);
    parts.push(`— ${optimal.speed} settlement`);

    if (isCrossBorder && optimal.route_id === 'stablecoin')
      parts.push('. Stablecoin selected for cross-border: 60% lower fees than SWIFT with near-instant settlement');

    if (alternatives.length > 0 && alternatives[0].calculated_fee > optimal.calculated_fee) {
      const savings = alternatives[0].calculated_fee - optimal.calculated_fee;
      parts.push(`. Saves ₹${savings.toFixed(2)} vs ${alternatives[0].name}`);
    }

    return parts.join(' ');
  }

  _calculateSavings(routes, amount) {
    if (routes.length < 2) return { amount: 0, percentage: 0 };
    const cheapest = Math.min(...routes.map(r => r.calculated_fee));
    const mostExpensive = Math.max(...routes.map(r => r.calculated_fee));
    const savings = mostExpensive - cheapest;
    return {
      amount: Math.round(savings * 100) / 100,
      percentage: Math.round((savings / Math.max(mostExpensive, 0.01)) * 1000) / 10,
    };
  }
}
