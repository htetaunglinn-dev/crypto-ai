'use client';

import { memo } from 'react';
import type { RSIData } from '@/types';

interface RSICardProps {
  data: RSIData;
}

function RSICardComponent({ data }: RSICardProps) {
  const getColor = () => {
    if (data.value > 70) return 'text-red-500';
    if (data.value < 30) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getSignalText = () => {
    if (data.signal === 'overbought') return 'Overbought';
    if (data.signal === 'oversold') return 'Oversold';
    return 'Neutral';
  };

  const getProgressWidth = () => {
    return `${data.value}%`;
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">RSI (14)</h3>
        <span className={`text-xs font-medium ${getColor()}`}>{getSignalText()}</span>
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-white">{data.value.toFixed(2)}</div>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full transition-all duration-300 ${
            data.value > 70 ? 'bg-red-500' : data.value < 30 ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: getProgressWidth() }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Oversold (30)</span>
        <span>Neutral</span>
        <span>Overbought (70)</span>
      </div>
    </div>
  );
}

export const RSICard = memo(RSICardComponent);
