/**
 * FlowGuard AI — Format Utilities
 */

export function formatCurrency(amount, currency = 'INR') {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  }
  if (currency === 'USDC') {
    return `${amount.toFixed(2)} USDC`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRiskColor(level) {
  switch (level?.toUpperCase()) {
    case 'LOW': return 'var(--success)';
    case 'MEDIUM': return 'var(--warning)';
    case 'HIGH': return 'var(--danger)';
    case 'CRITICAL': return '#ff4444';
    default: return 'var(--text-tertiary)';
  }
}

export function getRiskBadgeClass(level) {
  switch (level?.toUpperCase()) {
    case 'LOW': return 'badge-low';
    case 'MEDIUM': return 'badge-medium';
    case 'HIGH': return 'badge-high';
    case 'CRITICAL': return 'badge-critical';
    default: return '';
  }
}

export function getStatusBadgeClass(status) {
  switch (status?.toLowerCase()) {
    case 'completed': return 'badge-completed';
    case 'blocked': return 'badge-blocked';
    case 'flagged': return 'badge-flagged';
    default: return '';
  }
}

export function truncateAddress(addr, chars = 6) {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}
