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

  const getBackgroundGradient = () => {
    if (data.value > 70) return 'from-red-500/20 to-transparent';
    if (data.value < 30) return 'from-green-500/20 to-transparent';
    return 'from-yellow-500/20 to-transparent';
  };

  return (
    <div className={`rounded-lg border border-gray-800 bg-gradient-to-br ${getBackgroundGradient()} bg-gray-900 p-6 shadow-lg`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">RSI (14)</h3>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getColor()} ${
          data.value > 70 ? 'bg-red-500/20' : data.value < 30 ? 'bg-green-500/20' : 'bg-yellow-500/20'
        }`}>
          {getSignalText()}
        </span>
      </div>

      <div className="mb-6">
        <div className="text-5xl font-bold text-white">{data.value.toFixed(2)}</div>
      </div>

      <div className="relative mb-4 h-3 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            data.value > 70 ? 'bg-gradient-to-r from-yellow-500 to-red-500' :
            data.value < 30 ? 'bg-gradient-to-r from-green-500 to-yellow-500' :
            'bg-gradient-to-r from-yellow-400 to-yellow-500'
          }`}
          style={{ width: getProgressWidth() }}
        />
        {/* Marker lines for thresholds */}
        <div className="absolute top-0 h-full w-px bg-green-500/50" style={{ left: '30%' }} />
        <div className="absolute top-0 h-full w-px bg-red-500/50" style={{ left: '70%' }} />
      </div>

      <div className="flex justify-between text-xs font-medium text-gray-400">
        <span className="text-green-500">Oversold (30)</span>
        <span>Neutral</span>
        <span className="text-red-500">Overbought (70)</span>
      </div>
    </div>
  );
}

export const RSICard = memo(RSICardComponent);
