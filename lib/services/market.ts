import type { OHLCV, CryptoPrice, HistoricalData, TradingPair, TimeInterval } from '@/types';

/**
 * Free, keyless market data.
 *
 * Prices and candles come from Binance's public market-data endpoints. They need no API key
 * and are tried in order, so a region block on one host (api.binance.com returns 451 from US
 * servers such as Vercel) falls through to the next. CoinGecko's free public API fills in coin
 * names, logos and market caps, and is the last resort for prices.
 */
const BINANCE_REST_HOSTS = [
  'https://data-api.binance.vision/api/v3',
  'https://api.binance.com/api/v3',
  'https://api1.binance.com/api/v3',
  'https://api.binance.us/api/v3',
];

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const REQUEST_TIMEOUT = 8000;

export interface MarketPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  name?: string;
  image?: string;
  marketCapRank?: number;
  price: number;
  changePercent24h: number;
  quoteVolume: number;
}

export interface CoinMeta {
  symbol: string;
  name: string;
  image: string;
  marketCap: number;
  marketCapRank: number;
}

export interface GlobalMarket {
  totalMarketCap: number;
  totalVolume: number;
  marketCapChangePercent24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
}

interface BinanceTicker24h {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  closeTime: number;
}

async function fetchJson<T>(url: string, revalidate?: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Remember which Binance host last worked so we don't retry blocked hosts on every request.
let preferredHost = 0;

async function binance<T>(path: string): Promise<T> {
  const order = [
    ...BINANCE_REST_HOSTS.slice(preferredHost),
    ...BINANCE_REST_HOSTS.slice(0, preferredHost),
  ];
  let lastError: unknown;
  for (const host of order) {
    try {
      const data = await fetchJson<T>(`${host}${path}`);
      preferredHost = BINANCE_REST_HOSTS.indexOf(host);
      return data;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `All Binance public endpoints failed: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
  );
}

function tickerToPrice(t: BinanceTicker24h): CryptoPrice {
  return {
    symbol: t.symbol,
    price: parseFloat(t.lastPrice),
    change24h: parseFloat(t.priceChange),
    changePercent24h: parseFloat(t.priceChangePercent),
    high24h: parseFloat(t.highPrice),
    low24h: parseFloat(t.lowPrice),
    // Quote volume (USDT) reads better than base-asset volume in the UI
    volume24h: parseFloat(t.quoteVolume),
    lastUpdated: new Date(t.closeTime || Date.now()),
  };
}

function baseAssetOf(symbol: string): string {
  return symbol.endsWith('USDT') ? symbol.slice(0, -4) : symbol;
}

// --- CoinGecko metadata (names, logos, market caps), cached in memory ---------------------

let coinMetaCache: { data: Map<string, CoinMeta>; timestamp: number } | null = null;
const COIN_META_TTL = 60 * 60 * 1000;

export async function getCoinMeta(): Promise<Map<string, CoinMeta>> {
  if (coinMetaCache && Date.now() - coinMetaCache.timestamp < COIN_META_TTL) {
    return coinMetaCache.data;
  }

  const map = new Map<string, CoinMeta>();
  try {
    const pages = await Promise.all(
      [1, 2].map((page) =>
        fetchJson<Array<{
          symbol: string;
          name: string;
          image: string;
          market_cap: number;
          market_cap_rank: number;
        }>>(
          `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`,
          3600
        )
      )
    );
    for (const coin of pages.flat()) {
      const symbol = coin.symbol.toUpperCase();
      // Keep the highest-ranked coin when several share a ticker
      if (!map.has(symbol)) {
        map.set(symbol, {
          symbol,
          name: coin.name,
          image: coin.image,
          marketCap: coin.market_cap,
          marketCapRank: coin.market_cap_rank,
        });
      }
    }
    coinMetaCache = { data: map, timestamp: Date.now() };
  } catch (err) {
    console.warn('CoinGecko metadata unavailable:', err);
    if (coinMetaCache) return coinMetaCache.data;
  }
  return map;
}

// --- Public API ----------------------------------------------------------------------------

export class MarketDataService {
  async getCurrentPrice(symbol: TradingPair | string): Promise<CryptoPrice> {
    const [price] = await this.getMultiplePrices([symbol]);
    if (!price) throw new Error(`Failed to fetch price for ${symbol}`);
    return price;
  }

  async getMultiplePrices(symbols: (TradingPair | string)[]): Promise<CryptoPrice[]> {
    if (symbols.length === 0) return [];
    const meta = await getCoinMeta().catch(() => new Map<string, CoinMeta>());

    try {
      const param = encodeURIComponent(JSON.stringify(symbols));
      const tickers = await binance<BinanceTicker24h[]>(`/ticker/24hr?symbols=${param}`);
      return symbols
        .map((s) => tickers.find((t) => t.symbol === s))
        .filter((t): t is BinanceTicker24h => Boolean(t))
        .map((t) => ({ ...tickerToPrice(t), marketCap: meta.get(baseAssetOf(t.symbol))?.marketCap }));
    } catch (err) {
      // A single unknown symbol makes the batch request fail; retry one by one.
      const results = await Promise.all(
        symbols.map(async (s): Promise<CryptoPrice | null> => {
          try {
            const t = await binance<BinanceTicker24h>(`/ticker/24hr?symbol=${s}`);
            return { ...tickerToPrice(t), marketCap: meta.get(baseAssetOf(s))?.marketCap };
          } catch {
            return null;
          }
        })
      );
      const found = results.filter((r): r is CryptoPrice => r !== null);
      if (found.length > 0) return found;

      console.warn('Binance prices unavailable, falling back to CoinGecko:', err);
      return this.getCoinGeckoPrices(symbols);
    }
  }

  private async getCoinGeckoPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const symbolParam = symbols.map((s) => baseAssetOf(s).toLowerCase()).join(',');
    const coins = await fetchJson<Array<{
      symbol: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      high_24h: number;
      low_24h: number;
      total_volume: number;
      market_cap: number;
      last_updated: string;
    }>>(`${COINGECKO_BASE}/coins/markets?vs_currency=usd&symbols=${symbolParam}`);

    return symbols
      .map((s) => {
        const coin = coins.find((c) => c.symbol.toUpperCase() === baseAssetOf(s));
        if (!coin) return null;
        return {
          symbol: s,
          price: coin.current_price,
          change24h: coin.price_change_24h ?? 0,
          changePercent24h: coin.price_change_percentage_24h ?? 0,
          high24h: coin.high_24h ?? coin.current_price,
          low24h: coin.low_24h ?? coin.current_price,
          volume24h: coin.total_volume ?? 0,
          marketCap: coin.market_cap,
          lastUpdated: new Date(coin.last_updated),
        } satisfies CryptoPrice;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }

  async getHistoricalData(
    symbol: TradingPair | string,
    interval: TimeInterval = '1h',
    limit: number = 300
  ): Promise<HistoricalData> {
    const klines = await binance<Array<[number, string, string, string, string, string]>>(
      `/klines?symbol=${symbol}&interval=${interval}&limit=${Math.min(limit, 1000)}`
    );

    const data: OHLCV[] = klines.map((k) => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return { symbol, interval, data };
  }

  /** All USDT spot pairs, most liquid first, enriched with CoinGecko names and logos. */
  async getAvailablePairs(): Promise<MarketPair[]> {
    const [tickers, meta] = await Promise.all([
      binance<BinanceTicker24h[]>('/ticker/24hr'),
      getCoinMeta(),
    ]);

    // Leveraged tokens and stablecoin-to-stablecoin pairs aren't useful to analyse
    const excluded = /(UP|DOWN|BULL|BEAR)USDT$|^(USDC|FDUSD|TUSD|BUSD|USDP|DAI|EUR|AEUR)USDT$/;

    return tickers
      .filter((t) => t.symbol.endsWith('USDT') && !excluded.test(t.symbol))
      .filter((t) => parseFloat(t.quoteVolume) > 0)
      .map((t) => {
        const baseAsset = baseAssetOf(t.symbol);
        const coin = meta.get(baseAsset);
        return {
          symbol: t.symbol,
          baseAsset,
          quoteAsset: 'USDT',
          status: 'TRADING',
          name: coin?.name,
          image: coin?.image,
          marketCapRank: coin?.marketCapRank,
          price: parseFloat(t.lastPrice),
          changePercent24h: parseFloat(t.priceChangePercent),
          quoteVolume: parseFloat(t.quoteVolume),
        };
      })
      .sort((a, b) => b.quoteVolume - a.quoteVolume);
  }

  async getGlobalMarket(): Promise<GlobalMarket> {
    const { data } = await fetchJson<{
      data: {
        total_market_cap: Record<string, number>;
        total_volume: Record<string, number>;
        market_cap_change_percentage_24h_usd: number;
        market_cap_percentage: Record<string, number>;
        active_cryptocurrencies: number;
      };
    }>(`${COINGECKO_BASE}/global`, 300);

    return {
      totalMarketCap: data.total_market_cap.usd,
      totalVolume: data.total_volume.usd,
      marketCapChangePercent24h: data.market_cap_change_percentage_24h_usd,
      btcDominance: data.market_cap_percentage.btc,
      ethDominance: data.market_cap_percentage.eth,
      activeCryptocurrencies: data.active_cryptocurrencies,
    };
  }
}

export const marketDataService = new MarketDataService();
