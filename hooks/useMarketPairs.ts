'use client';

import { useEffect, useState } from 'react';
import type { MarketPair } from '@/lib/services/market';

// One shared request per page load; the server caches the list too
let pairsPromise: Promise<MarketPair[]> | null = null;

function loadPairs(): Promise<MarketPair[]> {
  if (!pairsPromise) {
    pairsPromise = fetch('/api/crypto/trading-pairs')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trading pairs');
        return res.json();
      })
      .then((json) => (json.pairs || []) as MarketPair[])
      .catch((err) => {
        pairsPromise = null; // allow a retry next time
        throw err;
      });
  }
  return pairsPromise;
}

/** All USDT pairs with names and logos, plus a lookup by symbol. */
export function useMarketPairs() {
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadPairs()
      .then((data) => active && setPairs(data))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load pairs'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const bySymbol = new Map(pairs.map((p) => [p.symbol, p]));

  return { pairs, bySymbol, loading, error };
}
