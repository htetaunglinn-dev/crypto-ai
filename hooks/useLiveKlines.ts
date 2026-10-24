'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BinanceWebSocketClient } from '@/lib/websocket/binance-client';
import { IndicatorCalculator } from '@/lib/indicators/client-calculator';
import type {
  OHLCV,
  TimeInterval,
  BinanceKlineStream,
  WebSocketMessage,
  ConnectionState,
  AllIndicators,
} from '@/types';

interface UseLiveKlinesResult {
  /** All candles including the one still forming; updates every tick. */
  ohlcvData: OHLCV[];
  /** Closed candles only; changes when a candle closes. Use for indicators. */
  closedData: OHLCV[];
  indicators: AllIndicators | null;
  isLoading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  reload: () => void;
}

const HISTORY_LIMIT = 300;
const POLL_MS = 30000;

/**
 * Candles for one pair and interval: history over REST, then live updates from Binance's free
 * public kline stream. Indicators are recalculated only when a candle closes.
 */
export function useLiveKlines(symbol: string, interval: TimeInterval): UseLiveKlinesResult {
  const [ohlcvData, setOhlcvData] = useState<OHLCV[]>([]);
  const [closedData, setClosedData] = useState<OHLCV[]>([]);
  const [indicators, setIndicators] = useState<AllIndicators | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reloadToken, setReloadToken] = useState(0);
  const requestRef = useRef(0);
  const dataRef = useRef<OHLCV[]>([]);

  const applyCandles = useCallback((candles: OHLCV[]) => {
    dataRef.current = candles;
    setOhlcvData(candles);
    // The last REST candle is still forming
    const closed = candles.slice(0, -1);
    setClosedData(closed);
    setIndicators(closed.length >= 200 ? IndicatorCalculator.calculateAll(symbol, closed) : null);
  }, [symbol]);

  const loadHistory = useCallback(async (silent = false) => {
    const requestId = ++requestRef.current;
    if (!silent) {
      dataRef.current = [];
      setOhlcvData([]);
      setClosedData([]);
      setIndicators(null);
      setIsLoading(true);
      setError(null);
    }
    try {
      const res = await fetch(`/api/crypto/historical?symbol=${symbol}&interval=${interval}&limit=${HISTORY_LIMIT}`);
      const json = await res.json();
      if (requestId !== requestRef.current) return;
      if (json.success) {
        applyCandles(json.data.data);
        setError(null);
      } else if (!silent) {
        setError(json.error || 'Failed to load chart data');
      }
    } catch {
      if (requestId === requestRef.current && !silent) setError('Failed to load chart data');
    } finally {
      if (requestId === requestRef.current && !silent) setIsLoading(false);
    }
  }, [symbol, interval, applyCandles]);

  useEffect(() => {
    // Fetching from the market API is the external sync this effect exists for
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadHistory, reloadToken]);

  useEffect(() => {
    const client = new BinanceWebSocketClient({
      streams: [`${symbol.toLowerCase()}@kline_${interval}`],
      onMessage: (message) => {
        const { data } = message as WebSocketMessage<BinanceKlineStream>;
        if (!data || data.e !== 'kline' || data.k.s !== symbol || data.k.i !== interval) return;
        const k = data.k;
        const candle: OHLCV = {
          timestamp: k.t,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };

        const prev = dataRef.current;
        if (prev.length === 0) return; // wait for history
        const last = prev[prev.length - 1];
        if (candle.timestamp < last.timestamp) return;
        const next = candle.timestamp === last.timestamp
          ? [...prev.slice(0, -1), candle]
          : [...prev, candle].slice(-HISTORY_LIMIT);

        dataRef.current = next;
        setOhlcvData(next);
        if (k.x) {
          setClosedData(next);
          setIndicators(next.length >= 200 ? IndicatorCalculator.calculateAll(symbol, next) : null);
        }
      },
      onError: () => {},
      onStateChange: setConnectionState,
    });
    client.connect();
    return () => client.disconnect();
  }, [symbol, interval]);

  // Without a live stream, refresh candles over REST
  useEffect(() => {
    if (connectionState === 'connected') return;
    const id = setInterval(() => loadHistory(true), POLL_MS);
    return () => clearInterval(id);
  }, [connectionState, loadHistory]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { ohlcvData, closedData, indicators, isLoading, error, connectionState, reload };
}
