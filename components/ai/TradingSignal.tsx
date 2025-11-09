'use client';

import { formatSignal, getSignalColor, getSignalTextColor } from '@/lib/utils';
import type { TradingSignal as TradingSignalType } from '@/types';

interface TradingSignalProps {
  signal: TradingSignalType;
  confidence: number;
}

export function TradingSignal({ signal, confidence }: TradingSignalProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-300">Trading Signal</h3>

      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${getSignalTextColor(signal)}`}>
            {formatSignal(signal)}
          </div>
          <div className="mt-1 text-xs text-gray-400">Confidence: {confidence}%</div>
        </div>

        <div className="relative h-24 w-24">
          <svg className="h-full w-full -rotate-90 transform">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-800"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - confidence / 100)}`}
              className={`transition-all duration-500 ${getSignalTextColor(signal)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{confidence}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className={`rounded-md ${getSignalColor(signal)} bg-opacity-10 p-3`}>
          <p className={`text-xs ${getSignalTextColor(signal)}`}>
            {signal === 'strong_buy' && 'Strong buying opportunity with multiple bullish confirmations'}
            {signal === 'buy' && 'Bullish bias with some positive signals'}
            {signal === 'hold' && 'Mixed signals - wait for clearer confirmation'}
            {signal === 'sell' && 'Bearish bias with some negative signals'}
            {signal === 'strong_sell' && 'Strong selling signal with multiple bearish confirmations'}
          </p>
        </div>
      </div>
    </div>
  );
}
