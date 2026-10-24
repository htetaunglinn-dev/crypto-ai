'use client';

import { useEffect, useState } from 'react';
import type { GlobalMarket } from '@/lib/services/market';
import type { FearGreedData } from '@/types/fear-greed';
import { formatLargeNumber, formatPercentage } from '@/lib/utils';

interface MarketStatsBarProps {
  fearGreed: FearGreedData | null;
}

function fearGreedColor(value: number) {
  if (value <= 25) return 'text-red-400';
  if (value <= 45) return 'text-orange-400';
  if (value <= 55) return 'text-yellow-400';
  if (value <= 75) return 'text-lime-400';
  return 'text-green-400';
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
      <span className="text-gray-500">{label}</span>
      <span className="num font-medium text-gray-200">{children}</span>
    </div>
  );
}

export function MarketStatsBar({ fearGreed }: MarketStatsBarProps) {
  const [global, setGlobal] = useState<GlobalMarket | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetch('/api/market/global')
        .then((res) => res.json())
        .then((json) => active && json.success && setGlobal(json.data))
        .catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="border-b border-line bg-surface/40">
      <div className="mx-auto flex h-9 max-w-[1600px] items-center gap-6 overflow-x-auto px-4 text-xs sm:px-6 [&::-webkit-scrollbar]:hidden">
        {global ? (
          <>
            <Stat label="Market cap">
              {formatLargeNumber(global.totalMarketCap)}{' '}
              <span className={global.marketCapChangePercent24h >= 0 ? 'text-up' : 'text-down'}>
                {formatPercentage(global.marketCapChangePercent24h)}
              </span>
            </Stat>
            <Stat label="24h volume">{formatLargeNumber(global.totalVolume)}</Stat>
            <Stat label="BTC dominance">{global.btcDominance.toFixed(1)}%</Stat>
            <Stat label="ETH dominance">{global.ethDominance.toFixed(1)}%</Stat>
          </>
        ) : (
          <div className="h-3 w-80 skeleton rounded-md" />
        )}
        {fearGreed && (
          <Stat label="Fear & Greed">
            <span className={fearGreedColor(fearGreed.value)}>
              {fearGreed.value} · {fearGreed.value_classification}
            </span>
          </Stat>
        )}
      </div>
    </div>
  );
}
