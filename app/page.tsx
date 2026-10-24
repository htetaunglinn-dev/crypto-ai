'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Plus, RefreshCw, WifiOff } from 'lucide-react';
import type { ClaudeAnalysis, TimeInterval } from '@/types';
import type { FearGreedData, FearGreedHistoryPoint, FearGreedResponse } from '@/types/fear-greed';
import { Header } from '@/components/Header';
import { MarketStatsBar } from '@/components/MarketStatsBar';
import { PriceCard } from '@/components/PriceCard';
import { PairHeader } from '@/components/PairHeader';
import { IndicatorSummary } from '@/components/indicators/IndicatorSummary';
import { RSICard, MACDCard, BollingerBandsCard, EMACard } from '@/components/indicators';
import { ClaudeInsightsPanel } from '@/components/ai';
import { CandlestickChart } from '@/components/charts';
import { TradingPairSearch } from '@/components/TradingPairSearch';
import { useLiveTickers } from '@/hooks/useLiveTickers';
import { useLiveKlines } from '@/hooks/useLiveKlines';
import { useMarketPairs } from '@/hooks/useMarketPairs';
import { useIndicatorHistory } from '@/hooks/useIndicatorHistory';
import { loadWatchlist, addToWatchlist, removeFromWatchlist, getWatchlistLimits } from '@/lib/storage/watchlist';

const INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '15m', label: '15m' },
  { value: '1h', label: '1H' },
  { value: '4h', label: '4H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
];

const SELECTED_KEY = 'crypto-selected';
const INTERVAL_KEY = 'crypto-interval';

function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); preferences just won't persist
  }
}

export default function Home() {
  const { status } = useSession();
  const [watchlistPairs, setWatchlistPairs] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('1d');
  const [analysis, setAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  const [fearGreedHistory, setFearGreedHistory] = useState<FearGreedHistoryPoint[]>([]);

  const { max: maxWatchlist } = getWatchlistLimits();

  useEffect(() => {
    const pairs = loadWatchlist();
    setWatchlistPairs(pairs);
    const saved = readPref(SELECTED_KEY);
    setSelectedSymbol(saved && pairs.includes(saved) ? saved : pairs[0]);
    const savedInterval = readPref(INTERVAL_KEY) as TimeInterval | null;
    if (savedInterval && INTERVALS.some((i) => i.value === savedInterval)) {
      setSelectedInterval(savedInterval);
    }
  }, []);

  const { bySymbol } = useMarketPairs();

  const {
    prices,
    isConnected: isPricesConnected,
    connectionState: pricesState,
    reconnect: reconnectPrices,
  } = useLiveTickers(watchlistPairs);

  const {
    ohlcvData,
    closedData,
    indicators,
    isLoading: isLoadingChart,
    error: chartError,
    reload: reloadChart,
  } = useLiveKlines(selectedSymbol, selectedInterval);

  const indicatorHistory = useIndicatorHistory(closedData, indicators);

  const selectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    writePref(SELECTED_KEY, symbol);
  }, []);

  const selectInterval = useCallback((interval: TimeInterval) => {
    setSelectedInterval(interval);
    writePref(INTERVAL_KEY, interval);
  }, []);

  const fetchAnalysis = useCallback(async (symbol: string, forceRefresh = false) => {
    if (status !== 'authenticated') return;

    startTransition(() => {
      setAnalysisError(null);
      setIsLoadingAnalysis(true);
    });

    try {
      const { data } = await axios.post('/api/analysis/generate', {
        symbol,
        interval: '1d',
        forceRefresh,
      });

      startTransition(() => {
        if (data.success) {
          setAnalysis(data.data);
        } else {
          setAnalysisError(data.error || 'Failed to fetch analysis');
        }
        setIsLoadingAnalysis(false);
      });
    } catch (err) {
      startTransition(() => {
        if (axios.isAxiosError(err)) {
          setAnalysisError(err.response?.data?.error || err.message || 'Failed to fetch analysis');
        } else {
          setAnalysisError('Failed to fetch analysis');
        }
        setIsLoadingAnalysis(false);
      });
    }
  }, [status]);

  // New coin: drop the old coin's analysis and fetch a fresh one
  useEffect(() => {
    setAnalysis(null);
    setAnalysisError(null);
    if (status !== 'authenticated') return;
    const timer = setTimeout(() => fetchAnalysis(selectedSymbol), 150);
    return () => clearTimeout(timer);
  }, [selectedSymbol, fetchAnalysis, status]);

  useEffect(() => {
    fetch('/api/fear-greed')
      .then((res) => res.json())
      .then((data: FearGreedResponse) => {
        if (data.current) {
          setFearGreedData(data.current);
          setFearGreedHistory(data.history);
        }
      })
      .catch((err) => console.error('Error fetching Fear & Greed data:', err));
  }, []);

  // ⌘K / Ctrl+K or "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setShowSearchDialog(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  const handlePickPair = useCallback((symbol: string) => {
    try {
      if (!watchlistPairs.includes(symbol)) {
        const updatedPairs = addToWatchlist(symbol);
        if (updatedPairs) setWatchlistPairs(updatedPairs);
      }
      selectSymbol(symbol);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to add pair to watchlist');
    }
  }, [watchlistPairs, selectSymbol]);

  const handleRemovePair = useCallback((symbol: string) => {
    try {
      const updatedPairs = removeFromWatchlist(symbol);
      if (updatedPairs) {
        setWatchlistPairs(updatedPairs);
        if (symbol === selectedSymbol && updatedPairs.length > 0) {
          selectSymbol(updatedPairs[0]);
        }
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to remove pair from watchlist');
    }
  }, [selectedSymbol, selectSymbol]);

  const currentPrice = prices.find((p) => p.symbol === selectedSymbol);
  const selectedMeta = bySymbol.get(selectedSymbol);
  const lastClose = ohlcvData.length > 0 ? ohlcvData[ohlcvData.length - 1].close : 0;
  const livePrice = currentPrice?.price || lastClose;
  const streamDown = pricesState === 'error';
  const watchlistFull = watchlistPairs.length >= maxWatchlist;

  // Placeholder rows keep the watchlist stable while prices load
  const watchlistRows = watchlistPairs.map((symbol) =>
    prices.find((p) => p.symbol === symbol) ?? {
      symbol,
      price: 0,
      change24h: 0,
      changePercent24h: 0,
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      lastUpdated: new Date(),
    }
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header onOpenSearch={() => setShowSearchDialog(true)} isLive={isPricesConnected} />
      <MarketStatsBar fearGreed={fearGreedData} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {(notice || streamDown) && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5 text-sm text-yellow-300 animate-fade-in">
            {streamDown && <WifiOff className="h-4 w-4 shrink-0" />}
            <span className="flex-1">
              {notice ?? 'Live stream unavailable. Prices refresh every 15 seconds instead.'}
            </span>
            {streamDown && !notice && (
              <button onClick={reconnectPrices} className="btn btn-secondary h-8 px-3 text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Mobile watchlist */}
        <div className="-mx-3 mb-4 flex gap-2 overflow-x-auto px-3 pb-1 lg:hidden [&::-webkit-scrollbar]:hidden">
          {watchlistRows.map((price) => (
            <PriceCard
              key={price.symbol}
              variant="chip"
              price={price}
              image={bySymbol.get(price.symbol)?.image}
              isSelected={price.symbol === selectedSymbol}
              onClick={() => selectSymbol(price.symbol)}
            />
          ))}
          <button
            onClick={() => setShowSearchDialog(true)}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-dashed border-line-strong px-3 text-xs font-medium text-gray-400 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)_380px] 2xl:grid-cols-[288px_minmax(0,1fr)_400px]">
          {/* Watchlist */}
          <aside className="card hidden p-2 lg:sticky lg:top-20 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:block xl:row-span-2">
            <div className="flex items-center justify-between px-2 pb-2 pt-1.5">
              <h2 className="eyebrow">Watchlist</h2>
              <span className="text-[11px] text-gray-500 num">{watchlistPairs.length}/{maxWatchlist}</span>
            </div>
            <div className="max-h-[calc(100vh-14rem)] space-y-0.5 overflow-y-auto overflow-x-hidden">
              {watchlistRows.map((price) => {
                const meta = bySymbol.get(price.symbol);
                return (
                  <PriceCard
                    key={price.symbol}
                    price={price}
                    name={meta?.name}
                    image={meta?.image}
                    isSelected={price.symbol === selectedSymbol}
                    onClick={() => selectSymbol(price.symbol)}
                    onRemove={handleRemovePair}
                    canRemove={watchlistPairs.length > 1}
                  />
                );
              })}
            </div>
            <button
              onClick={() => setShowSearchDialog(true)}
              disabled={watchlistFull}
              className="btn mt-2 w-full border border-dashed border-line-strong text-gray-400 hover:border-brand/50 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              {watchlistFull ? 'Watchlist full' : 'Add coin'}
            </button>
          </aside>

          {/* Price + chart */}
          <section className="card card-pad lg:col-start-2 lg:row-start-1">
            <PairHeader
              symbol={selectedSymbol}
              price={currentPrice}
              name={selectedMeta?.name}
              image={selectedMeta?.image}
              rank={selectedMeta?.marketCapRank}
            />

            <div className="mb-2 mt-5 flex items-center justify-between gap-3">
              <div className="segmented" role="tablist" aria-label="Chart interval">
                {INTERVALS.map(({ value, label }) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={selectedInterval === value}
                    data-active={selectedInterval === value}
                    onClick={() => selectInterval(value)}
                    className="segmented-item"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="hidden text-[11px] text-gray-500 sm:inline">Binance spot · USDT</span>
            </div>

            {isLoadingChart && ohlcvData.length === 0 ? (
              <div className="h-[340px] skeleton sm:h-[420px]" />
            ) : chartError && ohlcvData.length === 0 ? (
              <div className="flex h-[340px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong sm:h-[420px]">
                <p className="text-sm text-gray-400">{chartError}</p>
                <button onClick={reloadChart} className="btn btn-secondary h-8 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : (
              <CandlestickChart key={`${selectedSymbol}-${selectedInterval}`} data={ohlcvData} symbol={selectedSymbol} />
            )}
          </section>

          {/* AI insights */}
          <aside className="lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-span-2 xl:row-start-1">
            <ClaudeInsightsPanel
              authStatus={status}
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              error={analysisError}
              onRefresh={() => fetchAnalysis(selectedSymbol, true)}
              fearGreedData={fearGreedData}
              fearGreedHistory={fearGreedHistory}
            />
          </aside>

          {/* Technical indicators */}
          <section className="lg:col-start-2 lg:row-start-3 xl:row-start-2">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-semibold text-white">Technical indicators</h2>
                <p className="text-xs text-gray-500">
                  Calculated from closed {INTERVALS.find((i) => i.value === selectedInterval)?.label} candles
                </p>
              </div>
              {indicators && <IndicatorSummary indicators={indicators} price={livePrice} />}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!indicators ? (
                isLoadingChart ? (
                  [...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton" />)
                ) : (
                  <div className="card card-pad col-span-full text-center text-sm text-gray-400">
                    Not enough price history on this timeframe to calculate indicators (needs 200 candles). Try a
                    shorter interval.
                  </div>
                )
              ) : (
                <>
                  <RSICard data={indicators.rsi} history={indicatorHistory.rsiHistory} />
                  <MACDCard data={indicators.macd} history={indicatorHistory.macdHistory} />
                  <BollingerBandsCard
                    data={indicators.bollingerBands}
                    currentPrice={livePrice}
                    history={indicatorHistory.bbHistory}
                  />
                  <EMACard ema={indicators.ema} currentPrice={livePrice} />
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Market data: Binance public API · CoinGecko · Alternative.me. AI analysis by{' '}
            {analysis?.aiProvider === 'gemini' ? 'Gemini' : 'Claude'}.
          </p>
          <p>Not financial advice.</p>
        </div>
      </footer>

      {showSearchDialog && (
        <TradingPairSearch
          onSelect={handlePickPair}
          onClose={() => setShowSearchDialog(false)}
          excludedSymbols={watchlistPairs}
          isWatchlistFull={watchlistFull}
        />
      )}
    </div>
  );
}
