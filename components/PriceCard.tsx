'use client';

import { memo, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CryptoPrice } from '@/types';
import { CoinLogo } from '@/components/CoinLogo';
import { cn, formatCurrency, formatPercentage, formatLargeNumber } from '@/lib/utils';

interface PriceCardProps {
  price: CryptoPrice;
  name?: string;
  image?: string;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: (symbol: string) => void;
  canRemove?: boolean;
  variant?: 'row' | 'chip';
}

/** Flash direction for a value that just changed. */
export function usePriceFlash(value: number) {
  const [prev, setPrev] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  if (value !== prev) {
    setPrev(value);
    if (prev && value) setFlash(value > prev ? 'up' : 'down');
  }

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [flash, value]);

  return flash;
}

function PriceCardComponent({
  price,
  name,
  image,
  isSelected,
  onClick,
  onRemove,
  canRemove = true,
  variant = 'row',
}: PriceCardProps) {
  const isPositive = price.changePercent24h >= 0;
  const flash = usePriceFlash(price.price);
  const base = price.symbol.replace(/USDT$/, '');
  const hasPrice = price.price > 0;

  if (variant === 'chip') {
    return (
      <button
        onClick={onClick}
        aria-pressed={isSelected}
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition cursor-pointer',
          isSelected ? 'border-brand/60 bg-brand/10' : 'border-line bg-surface hover:border-line-strong'
        )}
      >
        <CoinLogo src={image} symbol={price.symbol} size={20} />
        <span className="text-xs font-semibold text-white">{base}</span>
        <span className={cn('num text-xs font-medium', isPositive ? 'text-up' : 'text-down')}>
          {hasPrice ? formatPercentage(price.changePercent24h) : '—'}
        </span>
      </button>
    );
  }

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove && canRemove) {
      onRemove(price.symbol);
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50',
        isSelected ? 'bg-brand/10 ring-1 ring-inset ring-brand/40' : 'hover:bg-surface-2'
      )}
    >
      {isSelected && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand" />}
      <CoinLogo src={image} symbol={price.symbol} size={30} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-white">{base}</span>
          <span
            className={cn(
              'num text-sm font-medium text-gray-100',
              flash === 'up' && 'animate-flash-up',
              flash === 'down' && 'animate-flash-down'
            )}
          >
            {hasPrice ? formatCurrency(price.price) : <span className="inline-block h-3.5 w-16 skeleton rounded" />}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-gray-500">
            {name ?? `${base}/USDT`}
            {hasPrice && <span className="hidden xl:inline"> · {formatLargeNumber(price.volume24h)}</span>}
          </span>
          <span className={cn('num font-medium', isPositive ? 'text-up' : 'text-down')}>
            {hasPrice ? formatPercentage(price.changePercent24h) : ''}
          </span>
        </div>
      </div>

      {onRemove && canRemove && (
        <button
          onClick={handleRemoveClick}
          className="absolute left-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-surface-3 text-gray-400 shadow transition hover:border-red-500/50 hover:text-red-400 group-hover:flex group-focus-within:flex cursor-pointer"
          title="Remove from watchlist"
          aria-label={`Remove ${base} from watchlist`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// Memoize to optimize re-renders for real-time price updates
export const PriceCard = memo(PriceCardComponent);
