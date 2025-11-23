import axios from 'axios';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
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

  constructor() {
    this.baseURL = COINGECKO_API_BASE;
    this.apiKey = process.env.COINGECKO_API_KEY;
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
   * Map Binance symbols to CoinGecko IDs
   */
  static mapSymbolToCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      BTCUSDT: 'bitcoin',
      ETHUSDT: 'ethereum',
      BNBUSDT: 'binancecoin',
      SOLUSDT: 'solana',
      ADAUSDT: 'cardano',
    };
    return mapping[symbol] || symbol.toLowerCase().replace('usdt', '');
  }
}

// Export singleton instance
export const coinGeckoService = new CoinGeckoService();
