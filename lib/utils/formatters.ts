/**
 * Format a number as USD currency
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format a timestamp to a readable date/time
 */
export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Format a timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Truncate a string to a specific length
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

/**
 * Get color based on percentage value
 */
export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

/**
 * Get background color based on signal type
 */
export function getSignalColor(signal: string): string {
  switch (signal) {
    case 'strong_buy':
      return 'bg-green-600';
    case 'buy':
      return 'bg-green-500';
    case 'hold':
      return 'bg-yellow-500';
    case 'sell':
      return 'bg-red-500';
    case 'strong_sell':
      return 'bg-red-600';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Get text color for signal
 */
export function getSignalTextColor(signal: string): string {
  switch (signal) {
    case 'strong_buy':
    case 'buy':
      return 'text-green-500';
    case 'hold':
      return 'text-yellow-500';
    case 'sell':
    case 'strong_sell':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Format signal for display
 */
export function formatSignal(signal: string): string {
  return signal.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
