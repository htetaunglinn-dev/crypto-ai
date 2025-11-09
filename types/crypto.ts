export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface HistoricalData {
  symbol: string;
  interval: string;
  data: OHLCV[];
}

export type TradingPair = 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT' | 'ADAUSDT';
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

// WebSocket Types
export interface BinanceTickerStream {
  e: '24hrTicker';
  E: number; // Event time
  s: string; // Symbol
  c: string; // Current close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  p: string; // Price change
  P: string; // Price change percent
}

export interface BinanceKlineStream {
  e: 'kline';
  E: number; // Event time
  s: string; // Symbol
  k: {
    t: number; // Kline start time
    T: number; // Kline close time
    s: string; // Symbol
    i: string; // Interval
    o: string; // Open price
    c: string; // Close price
    h: string; // High price
    l: string; // Low price
    v: string; // Base asset volume
    x: boolean; // Is this kline closed?
    q: string; // Quote asset volume
  };
}

export interface WebSocketMessage<T> {
  stream: string;
  data: T;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

export interface WebSocketError {
  message: string;
  code?: string;
  timestamp: number;
}
