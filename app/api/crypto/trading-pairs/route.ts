import { NextResponse } from 'next/server';
import axios from 'axios';

interface TradingPairInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  name?: string;
  coinGeckoId?: string;
}

interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

// Cache for 1 hour
let cachedPairs: TradingPairInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.toLowerCase() || '';

    const now = Date.now();

    // Fetch or use cached coins list
    if (!cachedPairs || (now - cacheTimestamp) > CACHE_DURATION) {
      console.log('[TradingPairs] Fetching coins from CoinGecko...');

      // Fetch top 250 coins by market cap from CoinGecko
      const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
          sparkline: false,
        },
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoAI/1.0)',
        },
        timeout: 10000,
      });

      const coins = response.data;

      // Convert to trading pair format
      cachedPairs = coins.map((coin: CoinGeckoCoin & { market_cap_rank: number }) => ({
        symbol: `${coin.symbol.toUpperCase()}USDT`,
        baseAsset: coin.symbol.toUpperCase(),
        quoteAsset: 'USDT',
        status: 'TRADING',
        name: coin.name,
        coinGeckoId: coin.id,
      }));

      cacheTimestamp = now;
      console.log(`[TradingPairs] Cached ${cachedPairs.length} trading pairs`);
    }

    // Filter based on search query
    let filteredPairs = cachedPairs || [];
    if (query) {
      filteredPairs = filteredPairs.filter(pair =>
        pair.baseAsset.toLowerCase().includes(query) ||
        pair.name?.toLowerCase().includes(query) ||
        pair.symbol.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      pairs: filteredPairs.slice(0, 100), // Limit to 100 results
      cached: (now - cacheTimestamp) < CACHE_DURATION,
      cachedAt: new Date(cacheTimestamp).toISOString(),
      total: filteredPairs.length,
    });
  } catch (error) {
    console.error('Error in trading-pairs API route:', error);

    // Return fallback pairs on error
    const fallbackPairs: TradingPairInfo[] = [
      { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING', name: 'Bitcoin' },
      { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING', name: 'Ethereum' },
      { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', status: 'TRADING', name: 'BNB' },
      { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING', name: 'Solana' },
      { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', status: 'TRADING', name: 'Cardano' },
      { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', status: 'TRADING', name: 'XRP' },
      { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', status: 'TRADING', name: 'Dogecoin' },
      { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', status: 'TRADING', name: 'Polkadot' },
      { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT', status: 'TRADING', name: 'Polygon' },
      { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', status: 'TRADING', name: 'Litecoin' },
      { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', status: 'TRADING', name: 'Avalanche' },
      { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', status: 'TRADING', name: 'Chainlink' },
    ];

    return NextResponse.json({
      pairs: fallbackPairs,
      cached: false,
      cachedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch from CoinGecko',
    });
  }
}
