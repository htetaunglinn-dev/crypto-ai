import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import type { OHLCV, CryptoPrice, HistoricalData, TradingPair, TimeInterval } from '@/types';

const CRYPTOCOMPARE_API_BASE = 'https://min-api.cryptocompare.com/data';

export class CryptoCompareService {
    private baseURL: string;
    private axiosInstance: AxiosInstance;
    private apiKey?: string;

    constructor() {
        this.baseURL = CRYPTOCOMPARE_API_BASE;
        this.apiKey = process.env.CRYPTOCOMPARE_API_KEY;

        this.axiosInstance = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...(this.apiKey ? { 'Authorization': `Apikey ${this.apiKey}` } : {}),
            },
        });

        axiosRetry(this.axiosInstance, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
        });
    }

    // Helper to split symbol (e.g., BTCUSDT -> BTC, USDT)
    // CryptoCompare usually expects 'USD' instead of 'USDT' for better coverage, 
    // but let's try to be smart. 'USDT' is 'USDT'.
    private parseSymbol(symbol: string): { fsym: string; tsym: string } {
        // Basic parsing for standard pairs like BTCUSDT
        if (symbol.endsWith('USDT')) {
            return { fsym: symbol.replace('USDT', ''), tsym: 'USDT' };
        }
        // Fallback
        return { fsym: symbol.substring(0, 3), tsym: symbol.substring(3) };
    }

    async getCurrentPrice(symbol: TradingPair): Promise<CryptoPrice> {
        try {
            const { fsym, tsym } = this.parseSymbol(symbol);
            const response = await this.axiosInstance.get('/pricemultifull', {
                params: {
                    fsyms: fsym,
                    tsyms: tsym,
                }
            });

            const data = response.data.RAW?.[fsym]?.[tsym];
            if (!data) throw new Error('No data found');

            return {
                symbol,
                price: data.PRICE,
                change24h: data.CHANGE24HOUR,
                changePercent24h: data.CHANGEPCT24HOUR,
                high24h: data.HIGH24HOUR,
                low24h: data.LOW24HOUR,
                volume24h: data.VOLUME24HOURTO, // Quote volume
                marketCap: data.MKTCAP,
                lastUpdated: new Date(data.LASTUPDATE * 1000),
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
            const { fsym, tsym } = this.parseSymbol(symbol);
            const endpoint = this.getHistoricalEndpoint(interval);

            const response = await this.axiosInstance.get(endpoint, {
                params: {
                    fsym,
                    tsym,
                    limit,
                }
            });

            if (response.data.Response === 'Error') {
                throw new Error(response.data.Message);
            }

            const data: OHLCV[] = response.data.Data.Data.map((candle: any) => ({
                timestamp: candle.time * 1000,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volumeto, // Use quote volume
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

    async getMultiplePrices(symbols: TradingPair[]): Promise<CryptoPrice[]> {
        try {
            // Group by quote asset (assuming mostly USDT)
            const pairs = symbols.map(s => this.parseSymbol(s));
            const fsyms = Array.from(new Set(pairs.map(p => p.fsym))).join(',');
            const tsyms = 'USDT'; // Simplified for now, assuming all are USDT pairs

            const response = await this.axiosInstance.get('/pricemultifull', {
                params: {
                    fsyms,
                    tsyms,
                }
            });

            const results: CryptoPrice[] = [];
            const raw = response.data.RAW;

            if (!raw) return [];

            pairs.forEach(({ fsym, tsym }, index) => {
                const data = raw[fsym]?.[tsym];
                if (data) {
                    results.push({
                        symbol: symbols[index],
                        price: data.PRICE,
                        change24h: data.CHANGE24HOUR,
                        changePercent24h: data.CHANGEPCT24HOUR,
                        high24h: data.HIGH24HOUR,
                        low24h: data.LOW24HOUR,
                        volume24h: data.VOLUME24HOURTO,
                        marketCap: data.MKTCAP,
                        lastUpdated: new Date(data.LASTUPDATE * 1000),
                    });
                }
            });

            return results;
        } catch (error) {
            console.error('Error fetching multiple prices:', error);
            return [];
        }
    }

    async getAvailablePairs(): Promise<any[]> {
        // CryptoCompare top list
        try {
            const response = await this.axiosInstance.get('/top/mktcapfull', {
                params: {
                    limit: 20,
                    tsym: 'USD',
                }
            });

            return response.data.Data.map((item: any) => ({
                symbol: item.CoinInfo.Name + 'USDT',
                baseAsset: item.CoinInfo.Name,
                quoteAsset: 'USDT',
                status: 'TRADING'
            }));
        } catch (error) {
            console.error('Error fetching available pairs:', error);
            return [];
        }
    }

    private getHistoricalEndpoint(interval: TimeInterval): string {
        switch (interval) {
            case '1m': return '/v2/histominute';
            case '5m': return '/v2/histominute'; // aggregate=5
            case '15m': return '/v2/histominute'; // aggregate=15
            case '1h': return '/v2/histohour';
            case '4h': return '/v2/histohour'; // aggregate=4
            case '1d': return '/v2/histoday';
            case '1w': return '/v2/histoday'; // aggregate=7
            default: return '/v2/histohour';
        }
    }
}

export const cryptoCompareService = new CryptoCompareService();
