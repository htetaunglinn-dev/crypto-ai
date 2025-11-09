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
  const position = data.percentB > 1 ? 'Above' : data.percentB < 0 ? 'Below' : 'Within';

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Bollinger Bands</h3>
        {isSqueeze && (
          <span className="text-xs font-medium text-orange-500">Squeeze Detected</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Upper Band</span>
          <span className="text-sm font-semibold text-blue-400">
            {formatCurrency(data.upper)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Middle (SMA)</span>
          <span className="text-sm font-semibold text-gray-300">
            {formatCurrency(data.middle)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Lower Band</span>
          <span className="text-sm font-semibold text-blue-400">
            {formatCurrency(data.lower)}
          </span>
        </div>

        <div className="mt-3 border-t border-gray-800 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Bandwidth</span>
            <span className="text-sm font-semibold text-white">{data.bandwidth.toFixed(2)}%</span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">Price Position</span>
            <span className={`text-sm font-semibold ${
              position === 'Above' ? 'text-red-500' : position === 'Below' ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {position} Bands
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const BollingerBandsCard = memo(BollingerBandsCardComponent);
