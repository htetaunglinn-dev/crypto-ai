'use client';

import { formatCurrency } from '@/lib/utils';

interface EMACardProps {
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
  };
  currentPrice: number;
}

export function EMACard({ ema, currentPrice }: EMACardProps) {
  const getTrend = () => {
    if (ema.ema9 > ema.ema21 && ema.ema21 > ema.ema50 && ema.ema50 > ema.ema200) {
      return { text: 'Strong Uptrend', color: 'text-green-500' };
    }
    if (ema.ema9 < ema.ema21 && ema.ema21 < ema.ema50 && ema.ema50 < ema.ema200) {
      return { text: 'Strong Downtrend', color: 'text-red-500' };
    }
    return { text: 'Mixed Signals', color: 'text-yellow-500' };
  };

  const trend = getTrend();
  const above200 = currentPrice > ema.ema200;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">EMA Indicators</h3>
        <span className={`text-xs font-medium ${trend.color}`}>{trend.text}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">EMA 9</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(ema.ema9)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">EMA 21</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(ema.ema21)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">EMA 50</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(ema.ema50)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">EMA 200</span>
          <span className="text-sm font-semibold text-white">{formatCurrency(ema.ema200)}</span>
        </div>

        <div className="mt-3 border-t border-gray-800 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Price vs EMA200</span>
            <span className={`text-xs font-semibold ${above200 ? 'text-green-500' : 'text-red-500'}`}>
              {above200 ? 'Above (Bullish)' : 'Below (Bearish)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
