'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { CryptoPrice, AllIndicators, ClaudeAnalysis, TradingPair, HistoricalData } from '@/types';
import { Header } from '@/components/Header';
import { PriceCard } from '@/components/PriceCard';
import { RSICard, MACDCard, BollingerBandsCard, EMACard } from '@/components/indicators';
import { ClaudeInsightsPanel } from '@/components/ai';
import { CandlestickChart } from '@/components/charts';

const TRADING_PAIRS: TradingPair[] = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedSymbol, setSelectedSymbol] = useState<TradingPair>('BTCUSDT');
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [indicators, setIndicators] = useState<AllIndicators | null>(null);
  const [analysis, setAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoadingPrices(true);
      const response = await fetch(`/api/crypto/price?symbols=${TRADING_PAIRS.join(',')}`);
      const data = await response.json();

      if (data.success) {
        setPrices(data.data);
      } else {
        setError(data.error || 'Failed to fetch prices');
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch prices');
    } finally {
      setIsLoadingPrices(false);
    }
  }, []);

  const fetchHistoricalData = useCallback(async (symbol: TradingPair) => {
    try {
      setIsLoadingChart(true);
      const response = await fetch(`/api/crypto/historical?symbol=${symbol}&interval=1h&limit=100`);
      const data = await response.json();

      if (data.success) {
        setHistoricalData(data.data);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  const fetchIndicators = useCallback(async (symbol: TradingPair) => {
    try {
      setIsLoadingIndicators(true);
      const response = await fetch(`/api/indicators/calculate?symbol=${symbol}&interval=1h`);
      const data = await response.json();

      if (data.success) {
        setIndicators(data.data);
      } else {
        setError(data.error || 'Failed to fetch indicators');
      }
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError('Failed to fetch indicators');
    } finally {
      setIsLoadingIndicators(false);
    }
  }, []);

  const fetchAnalysis = useCallback(async (symbol: TradingPair, forceRefresh = false) => {
    if (status !== 'authenticated') {
      setAnalysisError('Sign in to use AI analysis features');
      return;
    }

    try {
      setAnalysisError(null);
      setIsLoadingAnalysis(true);
      const response = await fetch('/api/analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, interval: '1h', forceRefresh }),
      });
      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setAnalysisError(data.error || 'Failed to fetch analysis');
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setAnalysisError('Failed to fetch analysis');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [status]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchHistoricalData(selectedSymbol);
      fetchIndicators(selectedSymbol);
      if (status === 'authenticated') {
        fetchAnalysis(selectedSymbol);
      }
    }
  }, [selectedSymbol, fetchHistoricalData, fetchIndicators, fetchAnalysis, status]);

  const currentPrice = prices.find((p) => p.symbol === selectedSymbol);

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-7xl pb-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Watchlist Sidebar */}
            <div className="lg:col-span-2">
              <div className="space-y-2">
                <h2 className="mb-3 text-sm font-semibold text-gray-400">Watchlist</h2>
                {isLoadingPrices ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg bg-gray-800"
                      />
                    ))}
                  </div>
                ) : (
                  prices.map((price) => (
                    <PriceCard
                      key={price.symbol}
                      price={price}
                      isSelected={price.symbol === selectedSymbol}
                      onClick={() => setSelectedSymbol(price.symbol as TradingPair)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-6">
              <div className="space-y-4">
                {/* Price Header & Chart */}
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedSymbol.replace('USDT', '')}/USDT
                      </h2>
                      {currentPrice && (
                        <div className="mt-1 flex items-baseline gap-3">
                          <span className="text-3xl font-bold text-white">
                            ${currentPrice.price.toFixed(2)}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              currentPrice.changePercent24h >= 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {currentPrice.changePercent24h >= 0 ? '+' : ''}
                            {currentPrice.changePercent24h.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isLoadingChart ? (
                    <div className="h-96 animate-pulse rounded-md bg-gray-800" />
                  ) : historicalData && historicalData.data.length > 0 ? (
                    <CandlestickChart data={historicalData.data} symbol={selectedSymbol} />
                  ) : (
                    <div className="h-96 flex items-center justify-center rounded-md bg-gray-800">
                      <p className="text-sm text-gray-400">No chart data available</p>
                    </div>
                  )}
                </div>

                {/* Technical Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  {isLoadingIndicators ? (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-48 animate-pulse rounded-lg bg-gray-800"
                        />
                      ))}
                    </>
                  ) : (
                    indicators && (
                      <>
                        <RSICard data={indicators.rsi} />
                        <MACDCard data={indicators.macd} />
                        <BollingerBandsCard
                          data={indicators.bollingerBands}
                          currentPrice={currentPrice?.price || 0}
                        />
                        <EMACard
                          ema={indicators.ema}
                          currentPrice={currentPrice?.price || 0}
                        />
                      </>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* AI Insights Sidebar */}
            <div className="lg:col-span-4">
              {status === 'unauthenticated' && (
                <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <p className="text-sm font-medium text-yellow-500 mb-2">
                    Sign in to unlock AI features
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Get Claude AI-powered market analysis, pattern recognition, and risk assessment.
                  </p>
                  <Link
                    href="/auth/signin"
                    className="inline-block rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {analysisError && status === 'authenticated' && (
                <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <p className="text-sm font-medium text-yellow-500 mb-2">
                    {analysisError}
                  </p>
                  {analysisError.includes('API key') && (
                    <>
                      <p className="text-xs text-gray-400 mb-3">
                        Add your Anthropic API key to enable AI analysis.
                      </p>
                      <Link
                        href="/settings"
                        className="inline-block rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Add API Key
                      </Link>
                    </>
                  )}
                </div>
              )}

              <ClaudeInsightsPanel
                analysis={analysis}
                isLoading={isLoadingAnalysis}
                onRefresh={() => fetchAnalysis(selectedSymbol, true)}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 bg-black py-4">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-gray-500">
            Data provided by Binance API • AI Analysis by Claude • Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
