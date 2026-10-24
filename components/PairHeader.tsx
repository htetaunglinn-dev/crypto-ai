'use client';

import type { CryptoPrice } from '@/types';
import { CoinLogo } from '@/components/CoinLogo';
import { usePriceFlash } from '@/components/PriceCard';
import { cn, formatCurrency, formatLargeNumber, formatPercentage } from '@/lib/utils';

interface PairHeaderProps {
  symbol: string;
  price?: CryptoPrice;
  name?: string;
  image?: string;
  rank?: number;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="num truncate text-sm font-medium text-gray-100">{value}</div>
    </div>
  );
}

export function PairHeader({ symbol, price, name, image, rank }: PairHeaderProps) {
  const base = symbol.replace(/USDT$/, '');
  const flash = usePriceFlash(price?.price ?? 0);
  const isUp = (price?.changePercent24h ?? 0) >= 0;
  const hasPrice = !!price && price.price > 0;

  // Where the price sits inside today's range, for the range bar
  const range = price && price.high24h > price.low24h
    ? Math.min(100, Math.max(0, ((price.price - price.low24h) / (price.high24h - price.low24h)) * 100))
    : 50;

  return (
    <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="flex items-center gap-3">
        <CoinLogo src={image} symbol={symbol} size={44} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">{name ?? base}</h1>
            <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-gray-300">
              {base}/USDT
            </span>
            {rank && <span className="hidden text-xs text-gray-500 sm:inline">#{rank}</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {hasPrice ? (
              <>
                <span
                  className={cn(
                    'num text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[32px]',
                    flash === 'up' && 'animate-flash-up',
                    flash === 'down' && 'animate-flash-down'
                  )}
                >
                  {formatCurrency(price.price)}
                </span>
                <span className={isUp ? 'pill pill-up' : 'pill pill-down'}>
                  {isUp ? '▲' : '▼'} {formatPercentage(price.changePercent24h)}
                </span>
                <span className={cn('num hidden text-sm sm:inline', isUp ? 'text-up' : 'text-down')}>
                  {isUp ? '+' : ''}{formatCurrency(price.change24h)}
                </span>
              </>
            ) : (
              <span className="mt-1 inline-block h-8 w-48 skeleton" />
            )}
          </div>
        </div>
      </div>

      {hasPrice && (
        <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 2xl:min-w-[440px]">
          <div className="col-span-2">
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>24h low</span>
              <span>24h high</span>
            </div>
            <div className="relative my-1.5 h-1.5 rounded-full bg-gradient-to-r from-down/50 via-gray-600 to-up/50">
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-app bg-white shadow"
                style={{ left: `${range}%` }}
              />
            </div>
            <div className="num flex justify-between text-xs font-medium text-gray-200">
              <span>{formatCurrency(price.low24h)}</span>
              <span>{formatCurrency(price.high24h)}</span>
            </div>
          </div>
          <Metric label="24h volume" value={formatLargeNumber(price.volume24h)} />
          <Metric label="Market cap" value={price.marketCap ? formatLargeNumber(price.marketCap) : '—'} />
        </div>
      )}
    </div>
  );
}
