import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { OHLCV, CryptoPrice, HistoricalData, TradingPair, TimeInterval } from '@/types';

const COINCAP_API_BASE = 'https://api.coincap.io/v2';

export class CoinCapService {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  // Mapping from TradingPair to CoinCap ID
  private symbolToId: Record<string, string> = {
    'BTCUSDT': 'bitcoin',
    'ETHUSDT': 'ethereum',
    'BNBUSDT': 'binance-coin',
    'SOLUSDT': 'solana',
    'ADAUSDT': 'cardano',
    'LTCUSDT': 'litecoin',
    'ENAUSDT': 'ethena', // Might need verification
    'BIOUSDT': 'biotech', // Placeholder, likely not on CoinCap top list easily without check
    'SUIUSDT': 'sui',
  };

  // Reverse mapping for WebSocket
  private idToSymbol: Record<string, TradingPair> = {};

  constructor() {
    this.baseURL = COINCAP_API_BASE;
    
    // Initialize reverse mapping
    Object.entries(this.symbolToId).forEach(([symbol, id]) => {
      this.idToSymbol[id] = symbol as TradingPair;
    });

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });
  }

  getSymbolId(symbol: string): string {
    return this.symbolToId[symbol] || symbol.toLowerCase().replace('usdt', '');
  }

  getSymbolFromId(id: string): TradingPair {
    return this.idToSymbol[id] || (id.toUpperCase() + 'USDT') as TradingPair;
  }

  async getCurrentPrice(symbol: TradingPair): Promise<CryptoPrice> {
    try {
      const id = this.getSymbolId(symbol);
      const response = await this.axiosInstance.get(`/assets/${id}`);
      const data = response.data.data;

      return {
        symbol,
        price: parseFloat(data.priceUsd),
        change24h: parseFloat(data.changePercent24Hr) * (parseFloat(data.priceUsd) / 100), // Approx absolute change
        changePercent24h: parseFloat(data.changePercent24Hr),
        high24h: 0, // CoinCap assets endpoint doesn't provide 24h high/low directly
        low24h: 0,  // We might need another endpoint or accept 0
        volume24h: parseFloat(data.volumeUsd24Hr),
        marketCap: parseFloat(data.marketCapUsd),
        lastUpdated: new Date(data.timestamp || Date.now()),
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  }

  async getHistoricalData(
    symbol: TradingPair,
    interval: TimeInterval = '1h',
    limit: number = 100
  ): Promise<HistoricalData> {
    try {
      const id = this.getSymbolId(symbol);
      const coinCapInterval = this.mapInterval(interval);
      
      // CoinCap candles endpoint requires exchange, but 'binance' usually works for major pairs
      // If 'binance' fails, we might try 'poloniex' or others, but let's stick to binance for consistency
      const response = await this.axiosInstance.get('/candles', {
        params: {
          exchange: 'binance',
          interval: coinCapInterval,
          baseId: id,
          quoteId: 'tether',
        }
      });

      const data: OHLCV[] = response.data.data.map((candle: any) => ({
        timestamp: candle.period,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume),
      }));

      // Sort by timestamp just in case
      data.sort((a, b) => a.timestamp - b.timestamp);

      return {
        symbol,
        interval,
        data: data.slice(-limit), // Apply limit manually as CoinCap doesn't support it directly in candles
      };
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
  }

  async getMultiplePrices(symbols: TradingPair[]): Promise<CryptoPrice[]> {
    try {
      // CoinCap supports getting all assets, but filtering might be better done client side or by individual requests
      // For efficiency, let's fetch all assets (limit 2000) and filter, or do parallel requests.
      // Fetching all assets is one request vs N requests.
      
      const response = await this.axiosInstance.get('/assets', {
        params: { limit: 2000 }
      });
      
      const allAssets = response.data.data;
      const targetIds = new Set(symbols.map(s => this.getSymbolId(s)));
      
      const matchedAssets = allAssets.filter((asset: any) => targetIds.has(asset.id));
      
      return matchedAssets.map((asset: any) => {
        const symbol = this.getSymbolFromId(asset.id);
        return {
          symbol,
          price: parseFloat(asset.priceUsd),
          change24h: parseFloat(asset.changePercent24Hr) * (parseFloat(asset.priceUsd) / 100),
          changePercent24h: parseFloat(asset.changePercent24Hr),
          high24h: 0,
          low24h: 0,
          volume24h: parseFloat(asset.volumeUsd24Hr),
          marketCap: parseFloat(asset.marketCapUsd),
          lastUpdated: new Date(asset.timestamp || Date.now()),
        };
      });
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      // Fallback to individual requests if bulk fetch fails
      return Promise.all(symbols.map(s => this.getCurrentPrice(s)));
    }
  }

  async getAvailablePairs(): Promise<any[]> {
    // CoinCap doesn't have a direct "pairs" endpoint like Binance exchangeInfo
    // We can return the static list or fetch top assets
    const response = await this.axiosInstance.get('/assets', { params: { limit: 20 } });
    return response.data.data.map((asset: any) => ({
      symbol: this.getSymbolFromId(asset.id),
      baseAsset: asset.symbol,
      quoteAsset: 'USDT',
      status: 'TRADING'
    }));
  }

  private mapInterval(interval: TimeInterval): string {
    const map: Record<TimeInterval, string> = {
      '1m': 'm1',
      '5m': 'm5',
      '15m': 'm15',
      '1h': 'h1',
      '4h': 'h4',
      '1d': 'd1',
      '1w': 'w1',
    };
    return map[interval] || 'h1';
  }
}

export const coinCapService = new CoinCapService();
