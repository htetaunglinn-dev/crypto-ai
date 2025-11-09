import axios from 'axios';
import type { OHLCV, CryptoPrice, HistoricalData, TradingPair, TimeInterval } from '@/types';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

export class BinanceService {
  private baseURL: string;

  constructor() {
    this.baseURL = BINANCE_API_BASE;
  }

  /**
   * Get current price for a trading pair
   */
  async getCurrentPrice(symbol: TradingPair): Promise<CryptoPrice> {
    try {
      const [ticker24h, tickerPrice] = await Promise.all([
        axios.get(`${this.baseURL}/ticker/24hr`, { params: { symbol } }),
        axios.get(`${this.baseURL}/ticker/price`, { params: { symbol } }),
      ]);

      const data = ticker24h.data;

      return {
        symbol,
        price: parseFloat(tickerPrice.data.price),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        lastUpdated: new Date(),
      };
    } catch (error) {
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
      const response = await axios.get(`${this.baseURL}/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
      });

      const data: OHLCV[] = response.data.map((candle: number[]) => ({
        timestamp: candle[0],
        open: parseFloat(candle[1].toString()),
        high: parseFloat(candle[2].toString()),
        low: parseFloat(candle[3].toString()),
        close: parseFloat(candle[4].toString()),
        volume: parseFloat(candle[5].toString()),
      }));

      return {
        symbol,
        interval,
        data,
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  /**
   * Get multiple trading pairs at once
   */
  async getMultiplePrices(symbols: TradingPair[]): Promise<CryptoPrice[]> {
    try {
      const prices = await Promise.all(
        symbols.map((symbol) => this.getCurrentPrice(symbol))
      );
      return prices;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      throw new Error('Failed to fetch multiple prices');
    }
  }

  /**
   * Convert Binance interval to milliseconds
   */
  static intervalToMilliseconds(interval: TimeInterval): number {
    const intervals: Record<TimeInterval, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    return intervals[interval];
  }
}

// Export singleton instance
export const binanceService = new BinanceService();
