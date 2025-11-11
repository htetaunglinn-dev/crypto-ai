'use client';

import { memo } from 'react';
import type { MACDData } from '@/types';

interface MACDCardProps {
  data: MACDData;
}

function MACDCardComponent({ data }: MACDCardProps) {
  const isBullish = data.histogram > 0;
  const getBackgroundGradient = () => {
    return isBullish ? 'from-green-500/20 to-transparent' : 'from-red-500/20 to-transparent';
  };

  return (
    <div className={`rounded-lg border border-gray-800 bg-gradient-to-br ${getBackgroundGradient()} bg-gray-900 p-6 shadow-lg`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">MACD</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isBullish ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {isBullish ? 'Bullish' : 'Bearish'}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">MACD Line</span>
          <span className="text-lg font-bold text-white">{data.macd.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Signal Line</span>
          <span className="text-lg font-bold text-white">{data.signal.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Histogram</span>
          <span className={`text-xl font-bold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
            {data.histogram > 0 && '+'}{data.histogram.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="relative mt-4 h-24 overflow-hidden rounded-lg bg-gray-800/50 p-2">
        <div className="flex h-full items-end justify-center">
          <div className={`h-full w-full rounded ${isBullish ? 'bg-gradient-to-t from-green-500 to-green-400' : 'bg-gradient-to-t from-red-500 to-red-400'}`}>
            <div className="relative h-full w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${isBullish ? 'text-white' : 'text-white'}`}>
                  {data.histogram > 0 && '+'}{data.histogram.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MACDCard = memo(MACDCardComponent);
