export interface RSIData {
  value: number;
  timestamp: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
  timestamp: number;
}

export interface EMAData {
  period: number;
  value: number;
  timestamp: number;
}

export interface BollingerBandsData {
  upper: number;
  middle: number;
  lower: number;
  timestamp: number;
  bandwidth: number;
  percentB: number;
}

export interface VolumeProfileData {
  priceLevel: number;
  volume: number;
  percentage: number;
}

export interface AllIndicators {
  symbol: string;
  timestamp: number;
  rsi: RSIData;
  macd: MACDData;
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
  };
  bollingerBands: BollingerBandsData;
  volumeProfile: VolumeProfileData[];
}

export interface IndicatorCalculationInput {
  symbol: string;
  interval: string;
  period?: number;
}

export interface RSIHistoryPoint {
  time: number;
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
}

export interface MACDHistoryPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsHistoryPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
  price: number;
}

export interface EMAHistoryPoint {
  time: number;
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
}

export interface IndicatorHistory {
  rsiHistory: RSIHistoryPoint[];
  macdHistory: MACDHistoryPoint[];
  bbHistory: BollingerBandsHistoryPoint[];
  emaHistory: EMAHistoryPoint[];
}
