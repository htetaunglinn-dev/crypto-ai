import axios, { AxiosInstance } from 'axios';
import type { OHLCV, CryptoPrice, HistoricalData, TradingPair, TimeInterval } from '@/types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_24h: number;
  high_24h: number;
  low_24h: number;
  total_volume: number;
}

interface MarketData {
  symbol: string;
  marketCap: number;
  marketCapRank: number;
  volume: number;
  priceChange24h: number;
}

export class CoinGeckoService {
  private baseURL: string;
  private apiKey?: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = COINGECKO_API_BASE;
    this.apiKey = process.env.COINGECKO_API_KEY;

    // Create axios instance with headers
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoAI/1.0)',
        'Accept': 'application/json',
        ...(this.apiKey ? { 'x-cg-demo-api-key': this.apiKey } : {}),
      },
    });
  }

  /**
   * Get current price for a trading pair
   */
  async getCurrentPrice(symbol: TradingPair): Promise<CryptoPrice> {
    try {
      const coinId = CoinGeckoService.mapSymbolToCoinGeckoId(symbol);
      const response = await this.axiosInstance.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinId,
          order: 'market_cap_desc',
          per_page: 1,
          page: 1,
          sparkline: false,
          price_change_percentage: '24h',
        },
      });

      const coin: CoinGeckoPrice = response.data[0];

      if (!coin) {
        throw new Error(`No data found for ${symbol}`);
      }

      return {
        symbol,
        price: coin.current_price,
        change24h: coin.price_change_24h || 0,
        changePercent24h: coin.price_change_percentage_24h || 0,
        high24h: coin.high_24h || coin.current_price,
        low24h: coin.low_24h || coin.current_price,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: new Date(),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`CoinGecko API Error for ${symbol}:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });
        throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
      }
      console.error(`Error fetching price for ${symbol}:`, error);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  }

  /**
   * Get historical OHLCV data
   */
  async getHistoricalData(
    symbol: TradingPair,
    interval: TimeInterval = '1h',
    limit: number = 100
  ): Promise<HistoricalData> {
    try {
      const coinId = CoinGeckoService.mapSymbolToCoinGeckoId(symbol);
      const days = CoinGeckoService.intervalToDays(interval);

      // Use OHLC endpoint for proper candlestick data
      const response = await this.axiosInstance.get(`/coins/${coinId}/ohlc`, {
        params: {
          vs_currency: 'usd',
          days,
        },
      });

      // CoinGecko OHLC returns: [[timestamp, open, high, low, close], ...]
      const ohlcData: [number, number, number, number, number][] = response.data || [];

      console.log(`[CoinGecko] Received ${ohlcData.length} candles for ${symbol} ${interval} (days=${days})`);

      // Convert to OHLCV format
      const data: OHLCV[] = ohlcData.slice(0, limit).map((candle) => {
        return {
          timestamp: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: 0, // OHLC endpoint doesn't provide volume, set to 0
        };
      });

      console.log(`[CoinGecko] Returning ${data.length} candles after applying limit=${limit}`);

      return {
        symbol,
        interval,
        data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`CoinGecko API Error for ${symbol} historical data:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
        });
        throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
      }
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Get market data for specific coins
   */
  async getMarketData(coinIds: string[]): Promise<MarketData[]> {
    try {
      const response = await axios.get(`${this.baseURL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: coinIds.length,
          page: 1,
          sparkline: false,
        },
        headers: this.apiKey ? { 'x-cg-demo-api-key': this.apiKey } : {},
      });

      return response.data.map((coin: CoinGeckoPrice) => ({
        symbol: coin.symbol.toUpperCase(),
        marketCap: coin.market_cap,
        marketCapRank: coin.market_cap_rank,
        volume: coin.total_volume,
        priceChange24h: coin.price_change_percentage_24h,
      }));
    } catch (error) {
      console.error('Error fetching market data from CoinGecko:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins() {
    try {
      const response = await axios.get(`${this.baseURL}/search/trending`, {
        headers: this.apiKey ? { 'x-cg-demo-api-key': this.apiKey } : {},
      });
      return response.data.coins.map((item: { item: { symbol: string; name: string } }) => ({
        symbol: item.item.symbol,
        name: item.item.name,
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw new Error('Failed to fetch trending coins');
    }
  }

  /**
   * Map trading pair symbols to CoinGecko IDs
   * Uses a known mapping for common coins, otherwise attempts to derive from symbol
   */
  static mapSymbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      // Major cryptocurrencies
      BTCUSDT: 'bitcoin',
      ETHUSDT: 'ethereum',
      BNBUSDT: 'binancecoin',
      SOLUSDT: 'solana',
      ADAUSDT: 'cardano',
      DOGEUSDT: 'dogecoin',
      XRPUSDT: 'ripple',
      DOTUSDT: 'polkadot',
      MATICUSDT: 'matic-network',
      LTCUSDT: 'litecoin',
      AVAXUSDT: 'avalanche-2',
      LINKUSDT: 'chainlink',

      // Additional popular coins
      ATOMUSDT: 'cosmos',
      UNIUSDT: 'uniswap',
      XLMUSDT: 'stellar',
      ALGOUSDT: 'algorand',
      VETUSDT: 'vechain',
      FILUSDT: 'filecoin',
      TRXUSDT: 'tron',
      ETCUSDT: 'ethereum-classic',
      XMRUSDT: 'monero',
      EOSUSDT: 'eos',
      AAVEUSDT: 'aave',
      MKRUSDT: 'maker',
      THETAUSDT: 'theta-token',
      AXSUSDT: 'axie-infinity',
      SANDUSDT: 'the-sandbox',
      MANAUSDT: 'decentraland',
      FTMUSDT: 'fantom',
      NEARUSDT: 'near',
      APTUSDT: 'aptos',
      OPUSDT: 'optimism',
      ARBUSDT: 'arbitrum',
    };

    // Return known mapping or attempt to derive from symbol
    // Remove USDT suffix and convert to lowercase
    return mapping[symbol] || symbol.toLowerCase().replace('usdt', '');
  }

  /**
   * Convert time interval to days parameter for CoinGecko OHLC endpoint
   * CoinGecko OHLC only accepts specific day values: 1, 7, 14, 30, 90, 180, 365
   * CoinGecko OHLC candle granularity:
   * - 1 day: 30 minutes (48 candles)
   * - 7-30 days: 4 hours (42-180 candles)
   * - 31+ days: 4 days (7-91 candles)
   *
   * We need at least 50 candles for analysis, so we request more days to ensure enough data
   */
  static intervalToDays(interval: TimeInterval): number {
    // Valid days values for CoinGecko OHLC endpoint
    const validDays = [1, 7, 14, 30, 90, 180, 365];

    // Map intervals to appropriate day ranges
    // Requesting more days to ensure we get at least 50 candles
    const intervalToDaysMap: Record<TimeInterval, number> = {
      '1m': 14,   // 4-hour candles (~84 candles)
      '5m': 14,   // 4-hour candles (~84 candles)
      '15m': 14,  // 4-hour candles (~84 candles)
      '1h': 14,   // 4-hour candles (~84 candles)
      '4h': 30,   // 4-hour candles (~180 candles)
      '1d': 365,  // 4-day candles (~91 candles)
      '1w': 365,  // 4-day candles (~91 candles)
    };

    const preferredDays = intervalToDaysMap[interval] || 30;

    // Find the closest valid day value that's >= preferredDays
    const validDay = validDays.find(d => d >= preferredDays) || 365;

    return validDay;
  }

  /**
   * Get the appropriate interval parameter for CoinGecko API
   */
  static getIntervalParam(interval: TimeInterval): string {
    // CoinGecko uses 'daily' for > 90 days, otherwise automatic
    const intervalMap: Record<TimeInterval, string> = {
      '1m': 'minutely',
      '5m': 'minutely',
      '15m': 'minutely',
      '1h': 'hourly',
      '4h': 'hourly',
      '1d': 'daily',
      '1w': 'daily',
    };
    return intervalMap[interval] || 'daily';
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService();
