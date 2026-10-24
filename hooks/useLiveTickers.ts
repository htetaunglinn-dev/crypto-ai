'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BinanceWebSocketClient } from '@/lib/websocket/binance-client';
import type {
  CryptoPrice,
  BinanceTickerStream,
  WebSocketMessage,
  ConnectionState,
  WebSocketError,
} from '@/types';

interface UseLiveTickersResult {
  prices: CryptoPrice[];
  isConnected: boolean;
  connectionState: ConnectionState;
  error: WebSocketError | null;
  reconnect: () => void;
}

// While the live stream is down, refresh prices over REST at this interval
const FALLBACK_POLL_MS = 15000;

/**
 * Live 24h tickers for a watchlist. Loads a snapshot over REST, then streams updates from
 * Binance's free public WebSocket. Falls back to polling if the stream can't connect.
 */
export function useLiveTickers(symbols: string[]): UseLiveTickersResult {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<WebSocketError | null>(null);
  const clientRef = useRef<BinanceWebSocketClient | null>(null);
  const key = symbols.join(',');

  const mergePrices = useCallback((incoming: CryptoPrice[]) => {
    setPrices((prev) => {
      const map = new Map(prev.map((p) => [p.symbol, p]));
      incoming.forEach((p) => {
        // Keep the market cap from the REST snapshot; the stream doesn't carry it
        map.set(p.symbol, { ...p, marketCap: p.marketCap ?? map.get(p.symbol)?.marketCap });
      });
      return key.split(',').filter(Boolean).map((s) => map.get(s)).filter((p): p is CryptoPrice => Boolean(p));
    });
  }, [key]);

  const fetchSnapshot = useCallback(async () => {
    if (!key) return;
    try {
      const res = await fetch(`/api/crypto/price?symbols=${key}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        mergePrices(json.data.map((p: CryptoPrice) => ({ ...p, lastUpdated: new Date(p.lastUpdated) })));
      }
    } catch (err) {
      console.error('[LiveTickers] Snapshot failed:', err);
    }
  }, [key, mergePrices]);

  // Snapshot on watchlist change; mergePrices drops symbols that were removed
  useEffect(() => {
    // Fetching from the market API is the external sync this effect exists for
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSnapshot();
  }, [key, fetchSnapshot]);

  useEffect(() => {
    if (!key) return;

    const client = new BinanceWebSocketClient({
      streams: key.split(',').map((s) => `${s.toLowerCase()}@ticker`),
      onMessage: (message) => {
        const { data } = message as WebSocketMessage<BinanceTickerStream>;
        if (!data || data.e !== '24hrTicker') return;
        mergePrices([{
          symbol: data.s,
          price: parseFloat(data.c),
          change24h: parseFloat(data.p),
          changePercent24h: parseFloat(data.P),
          high24h: parseFloat(data.h),
          low24h: parseFloat(data.l),
          volume24h: parseFloat(data.q),
          lastUpdated: new Date(data.E),
        }]);
      },
      onError: setError,
      onStateChange: (state) => {
        setConnectionState(state);
        if (state === 'connected') setError(null);
      },
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [key, mergePrices]);

  // REST polling while the stream is not connected
  useEffect(() => {
    if (connectionState === 'connected' || !key) return;
    const id = setInterval(fetchSnapshot, FALLBACK_POLL_MS);
    return () => clearInterval(id);
  }, [connectionState, key, fetchSnapshot]);

  const reconnect = useCallback(() => {
    setError(null);
    clientRef.current?.reconnect();
    fetchSnapshot();
  }, [fetchSnapshot]);

  return {
    prices,
    isConnected: connectionState === 'connected',
    connectionState,
    error,
    reconnect,
  };
}
