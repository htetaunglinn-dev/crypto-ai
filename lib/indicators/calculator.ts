import {
  RSI,
  MACD,
  EMA,
  BollingerBands,
  SMA,
} from 'technicalindicators';
import type {
  OHLCV,
  RSIData,
  MACDData,
  BollingerBandsData,
  VolumeProfileData,
  AllIndicators,
} from '@/types';

export class IndicatorCalculator {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  static calculateRSI(data: OHLCV[], period: number = 14): RSIData | null {
    if (data.length < period) {
      return null;
    }

    const values = data.map((d) => d.close);
    const rsiValues = RSI.calculate({ values, period });

    if (rsiValues.length === 0) {
      return null;
    }

    const latestRSI = rsiValues[rsiValues.length - 1];
    const latestTimestamp = data[data.length - 1].timestamp;

    let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (latestRSI > 70) signal = 'overbought';
    else if (latestRSI < 30) signal = 'oversold';

    return {
      value: latestRSI,
      timestamp: latestTimestamp,
      signal,
    };
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(
    data: OHLCV[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDData | null {
    if (data.length < slowPeriod + signalPeriod) {
      return null;
    }

    const values = data.map((d) => d.close);
    const macdValues = MACD.calculate({
      values,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });

    if (macdValues.length === 0) {
      return null;
    }

    const latest = macdValues[macdValues.length - 1];
    const latestTimestamp = data[data.length - 1].timestamp;

    return {
      macd: latest.MACD || 0,
      signal: latest.signal || 0,
      histogram: latest.histogram || 0,
      timestamp: latestTimestamp,
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average) for multiple periods
   * Calculates only the EMAs that have enough data points
   */
  static calculateEMAs(data: OHLCV[]): {
    ema9: number;
    ema21: number;
    ema50: number;
    ema200: number;
  } | null {
    // Need at least 50 candles for basic EMAs
    if (data.length < 50) {
      return null;
    }

    const values = data.map((d) => d.close);

    const ema9 = EMA.calculate({ values, period: 9 });
    const ema21 = EMA.calculate({ values, period: 21 });
    const ema50 = EMA.calculate({ values, period: 50 });

    // Only calculate EMA200 if we have enough data
    let ema200Value = 0;
    if (data.length >= 200) {
      const ema200 = EMA.calculate({ values, period: 200 });
      ema200Value = ema200[ema200.length - 1] || 0;
    }

    return {
      ema9: ema9[ema9.length - 1] || 0,
      ema21: ema21[ema21.length - 1] || 0,
      ema50: ema50[ema50.length - 1] || 0,
      ema200: ema200Value,
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(
    data: OHLCV[],
    period: number = 20,
    stdDev: number = 2
  ): BollingerBandsData | null {
    if (data.length < period) {
      return null;
    }

    const values = data.map((d) => d.close);
    const bbValues = BollingerBands.calculate({
      values,
      period,
      stdDev,
    });

    if (bbValues.length === 0) {
      return null;
    }

    const latest = bbValues[bbValues.length - 1];
    const latestTimestamp = data[data.length - 1].timestamp;
    const currentPrice = values[values.length - 1];

    // Calculate bandwidth (volatility measure)
    const bandwidth = ((latest.upper - latest.lower) / latest.middle) * 100;

    // Calculate %B (where price is relative to bands)
    const percentB = (currentPrice - latest.lower) / (latest.upper - latest.lower);

    return {
      upper: latest.upper,
      middle: latest.middle,
      lower: latest.lower,
      timestamp: latestTimestamp,
      bandwidth,
      percentB,
    };
  }

  /**
   * Calculate Volume Profile
   */
  static calculateVolumeProfile(data: OHLCV[], bins: number = 20): VolumeProfileData[] {
    if (data.length === 0) {
      return [];
    }

    // Find price range
    const prices = data.map((d) => (d.high + d.low) / 2);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceStep = (maxPrice - minPrice) / bins;

    // Create price levels
    const volumeByLevel: Record<number, number> = {};

    data.forEach((candle) => {
      const midPrice = (candle.high + candle.low) / 2;
      const level = Math.floor((midPrice - minPrice) / priceStep);
      const priceLevel = minPrice + level * priceStep;

      if (!volumeByLevel[priceLevel]) {
        volumeByLevel[priceLevel] = 0;
      }
      volumeByLevel[priceLevel] += candle.volume;
    });

    // Calculate total volume
    const totalVolume = Object.values(volumeByLevel).reduce((sum, vol) => sum + vol, 0);

    // Convert to array and calculate percentages
    return Object.entries(volumeByLevel)
      .map(([priceLevel, volume]) => ({
        priceLevel: parseFloat(priceLevel),
        volume,
        percentage: (volume / totalVolume) * 100,
      }))
      .sort((a, b) => b.volume - a.volume);
  }

  /**
   * Calculate all indicators at once
   */
  static calculateAll(symbol: string, data: OHLCV[]): AllIndicators | null {
    const rsi = this.calculateRSI(data);
    const macd = this.calculateMACD(data);
    const ema = this.calculateEMAs(data);
    const bollingerBands = this.calculateBollingerBands(data);
    const volumeProfile = this.calculateVolumeProfile(data);

    if (!rsi || !macd || !ema || !bollingerBands) {
      return null;
    }

    return {
      symbol,
      timestamp: Date.now(),
      rsi,
      macd,
      ema,
      bollingerBands,
      volumeProfile,
    };
  }

  /**
   * Detect simple moving average crossovers
   */
  static detectEMACrossover(data: OHLCV[]): {
    bullish: boolean;
    bearish: boolean;
  } {
    if (data.length < 50) {
      return { bullish: false, bearish: false };
    }

    const values = data.map((d) => d.close);
    const ema9 = EMA.calculate({ values, period: 9 });
    const ema21 = EMA.calculate({ values, period: 21 });

    if (ema9.length < 2 || ema21.length < 2) {
      return { bullish: false, bearish: false };
    }

    const current9 = ema9[ema9.length - 1];
    const current21 = ema21[ema21.length - 1];
    const prev9 = ema9[ema9.length - 2];
    const prev21 = ema21[ema21.length - 2];

    const bullish = prev9 <= prev21 && current9 > current21;
    const bearish = prev9 >= prev21 && current9 < current21;

    return { bullish, bearish };
  }
}
