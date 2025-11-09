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
