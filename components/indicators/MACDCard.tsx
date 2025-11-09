'use client';

import { memo } from 'react';
import type { MACDData } from '@/types';

interface MACDCardProps {
  data: MACDData;
}

function MACDCardComponent({ data }: MACDCardProps) {
  const isBullish = data.histogram > 0;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-300">MACD</h3>
        <span className={`text-xs font-medium ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
          {isBullish ? 'Bullish' : 'Bearish'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">MACD Line</span>
          <span className="text-sm font-semibold text-white">{data.macd.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Signal Line</span>
          <span className="text-sm font-semibold text-white">{data.signal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Histogram</span>
          <span className={`text-sm font-semibold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
            {data.histogram > 0 && '+'}{data.histogram.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-3 h-20 flex items-end justify-center">
        <div className="flex h-full w-full items-end justify-center gap-1">
          <div
            className={`w-full transition-all ${isBullish ? 'bg-green-500' : 'bg-red-500'}`}
            style={{
              height: `${Math.min(Math.abs(data.histogram) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export const MACDCard = memo(MACDCardComponent);
