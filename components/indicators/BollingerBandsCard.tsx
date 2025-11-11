'use client';

import { memo } from 'react';
import type { BollingerBandsData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface BollingerBandsCardProps {
  data: BollingerBandsData;
  currentPrice: number;
}

function BollingerBandsCardComponent({ data, currentPrice }: BollingerBandsCardProps) {
  const isSqueeze = data.bandwidth < 2;
  const position = data.percentB > 1 ? 'Above' : data.percentB < 0 ? 'Below' : 'Within Bands';

  const getPositionColor = () => {
    if (position === 'Above') return 'text-red-500';
    if (position === 'Below') return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gradient-to-br from-blue-500/10 to-transparent bg-gray-900 p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Bollinger Bands</h3>
        {isSqueeze && (
          <span className="animate-pulse rounded-full bg-orange-500/20 px-3 py-1 text-sm font-semibold text-orange-500">
            Squeeze
          </span>
        )}
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Upper Band</span>
          <span className="text-lg font-bold text-blue-400">
            {formatCurrency(data.upper)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Middle (SMA)</span>
          <span className="text-lg font-bold text-indigo-400">
            {formatCurrency(data.middle)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Lower Band</span>
          <span className="text-lg font-bold text-blue-400">
            {formatCurrency(data.lower)}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Bandwidth</span>
          <span className="text-xl font-bold text-white">{data.bandwidth.toFixed(2)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Price Position</span>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${getPositionColor()} ${
            position === 'Above' ? 'bg-red-500/20' : position === 'Below' ? 'bg-green-500/20' : 'bg-yellow-500/20'
          }`}>
            {position}
          </span>
        </div>
      </div>
    </div>
  );
}

export const BollingerBandsCard = memo(BollingerBandsCardComponent);
