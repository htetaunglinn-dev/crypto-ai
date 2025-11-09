'use client';

import { memo } from 'react';
import type { CryptoPrice } from '@/types';
import { formatCurrency, formatPercentage, formatLargeNumber, getChangeColor } from '@/lib/utils';

interface PriceCardProps {
  price: CryptoPrice;
  isSelected: boolean;
  onClick: () => void;
}

function PriceCardComponent({ price, isSelected, onClick }: PriceCardProps) {
  const isPositive = price.changePercent24h >= 0;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">
          {price.symbol.replace('USDT', '')}/USDT
        </h3>
        <span className={`text-xs font-medium ${getChangeColor(price.changePercent24h)}`}>
          {formatPercentage(price.changePercent24h)}
        </span>
      </div>

      <div className="mb-2">
        <div className="text-xl font-bold text-white">
          {formatCurrency(price.price)}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>24h Vol: {formatLargeNumber(price.volume24h)}</span>
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '▲' : '▼'} {formatCurrency(Math.abs(price.change24h))}
        </span>
      </div>
    </button>
  );
}

// Memoize to optimize re-renders for real-time price updates
export const PriceCard = memo(PriceCardComponent);
