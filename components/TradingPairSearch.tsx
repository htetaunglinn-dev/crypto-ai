'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { useMarketPairs } from '@/hooks/useMarketPairs';
import { CoinLogo } from '@/components/CoinLogo';
import { cn, formatCurrency, formatLargeNumber, formatPercentage } from '@/lib/utils';

interface TradingPairSearchProps {
  /** Called with the chosen pair; the dashboard adds it to the watchlist and opens it. */
  onSelect: (symbol: string) => void;
  onClose: () => void;
  /** Pairs already on the watchlist; picking one just opens it. */
  excludedSymbols: string[];
  isWatchlistFull?: boolean;
}

const MAX_RESULTS = 60;

export function TradingPairSearch({ onSelect, onClose, excludedSymbols, isWatchlistFull }: TradingPairSearchProps) {
  const { pairs, loading, error } = useMarketPairs();
  const [searchTerm, setSearchTerm] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = searchTerm.trim().toUpperCase();
    if (!q) return pairs.slice(0, MAX_RESULTS);

    // Exact ticker first, then prefix matches, then name/substring matches
    const score = (p: (typeof pairs)[number]) => {
      const name = (p.name ?? '').toUpperCase();
      if (p.baseAsset === q) return 0;
      if (p.baseAsset.startsWith(q)) return 1;
      if (name.startsWith(q)) return 2;
      if (p.baseAsset.includes(q) || name.includes(q)) return 3;
      return -1;
    };
    return pairs
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => a.s - b.s || b.p.quoteVolume - a.p.quoteVolume)
      .slice(0, MAX_RESULTS)
      .map((x) => x.p);
  }, [pairs, searchTerm]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const choose = (symbol: string) => {
    const inList = excludedSymbols.includes(symbol);
    if (!inList && isWatchlistFull) return;
    onSelect(symbol);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      choose(results[active].symbol);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-[10vh] backdrop-blur-sm animate-fade-in sm:p-6 sm:pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Search coins"
    >
      <div className="card flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden bg-surface animate-pop-in">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-gray-500" />
          <input
            type="text"
            placeholder="Search by ticker or name, e.g. BTC or Solana"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            className="h-14 flex-1 bg-transparent text-[15px] text-white placeholder-gray-500 focus:outline-none"
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="pair-results"
            aria-activedescendant={results[active] ? `pair-${results[active].symbol}` : undefined}
          />
          <button onClick={onClose} className="btn btn-ghost h-8 w-8 p-0" aria-label="Close search">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isWatchlistFull && (
          <div className="border-b border-line bg-yellow-500/5 px-4 py-2 text-xs text-yellow-400">
            Your watchlist is full (10 coins). Remove one to add another; you can still open coins already on it.
          </div>
        )}

        <div ref={listRef} id="pair-results" role="listbox" className="flex-1 overflow-y-auto p-1.5">
          {loading ? (
            <div className="space-y-1.5 p-1.5">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 skeleton" />)}
            </div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-red-400">{error}</p>
          ) : results.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-gray-300">No coins match “{searchTerm}”</p>
              <p className="mt-1 text-xs text-gray-500">Only pairs quoted in USDT are listed.</p>
            </div>
          ) : (
            <>
              {!searchTerm && <div className="eyebrow px-3 pb-1 pt-2">Most traded today</div>}
              {results.map((pair, index) => {
                const inList = excludedSymbols.includes(pair.symbol);
                const disabled = !inList && isWatchlistFull;
                const isUp = pair.changePercent24h >= 0;
                return (
                  <button
                    key={pair.symbol}
                    id={`pair-${pair.symbol}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === active}
                    aria-disabled={disabled}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(pair.symbol)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer',
                      index === active && 'bg-surface-3',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <CoinLogo src={pair.image} symbol={pair.symbol} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{pair.baseAsset}</span>
                        <span className="truncate text-xs text-gray-500">{pair.name ?? `${pair.baseAsset}/USDT`}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 num">Vol {formatLargeNumber(pair.quoteVolume)}</div>
                    </div>
                    <div className="text-right">
                      <div className="num text-sm text-gray-100">{formatCurrency(pair.price)}</div>
                      <div className={cn('num text-xs', isUp ? 'text-up' : 'text-down')}>
                        {formatPercentage(pair.changePercent24h)}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                        inList ? 'border-brand/40 bg-brand/15 text-blue-300' : 'border-line-strong text-gray-400'
                      )}
                      title={inList ? 'On your watchlist' : 'Add to watchlist'}
                    >
                      {inList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-gray-500">
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="kbd">↑</span><span className="kbd">↓</span> navigate
            <span className="kbd ml-2">↵</span> select
            <span className="kbd ml-2">esc</span> close
          </span>
          <span>{pairs.length > 0 ? `${pairs.length} USDT pairs · Binance & CoinGecko` : ''}</span>
        </div>
      </div>
    </div>
  );
}
