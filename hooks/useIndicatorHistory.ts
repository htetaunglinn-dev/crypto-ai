import { useState, useEffect, useCallback } from 'react';
import type {
  AllIndicators,
  OHLCV,
  RSIHistoryPoint,
  MACDHistoryPoint,
  BollingerBandsHistoryPoint,
  EMAHistoryPoint,
  IndicatorHistory,
} from '@/types';
import { RSI, MACD, EMA, BollingerBands } from 'technicalindicators';

const MAX_HISTORY_LENGTH = 100;

export function useIndicatorHistory(ohlcvData: OHLCV[], currentIndicators: AllIndicators | null) {
  const [history, setHistory] = useState<IndicatorHistory>({
    rsiHistory: [],
    macdHistory: [],
    bbHistory: [],
    emaHistory: [],
  });

  const calculateHistoricalIndicators = useCallback((data: OHLCV[]): IndicatorHistory => {
    if (data.length === 0) {
      return {
        rsiHistory: [],
        macdHistory: [],
        bbHistory: [],
        emaHistory: [],
      };
    }

    const closes = data.map(d => d.close);

    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const bbValues = BollingerBands.calculate({
      values: closes,
      period: 20,
      stdDev: 2,
    });

    const ema9Values = EMA.calculate({ values: closes, period: 9 });
    const ema21Values = EMA.calculate({ values: closes, period: 21 });
    const ema50Values = EMA.calculate({ values: closes, period: 50 });
    const ema200Values = EMA.calculate({ values: closes, period: 200 });

    const rsiOffset = data.length - rsiValues.length;
    const macdOffset = data.length - macdValues.length;
    const bbOffset = data.length - bbValues.length;
    const emaOffset = data.length - ema200Values.length;

    const rsiHistory: RSIHistoryPoint[] = rsiValues.map((value, i) => {
      const dataIndex = i + rsiOffset;
      let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
      if (value > 70) signal = 'overbought';
      else if (value < 30) signal = 'oversold';

      return {
        time: data[dataIndex].timestamp,
        value,
        signal,
      };
    });

    const macdHistory: MACDHistoryPoint[] = macdValues.map((val, i) => ({
      time: data[i + macdOffset].timestamp,
      macd: val.MACD || 0,
      signal: val.signal || 0,
      histogram: val.histogram || 0,
    }));

    const bbHistory: BollingerBandsHistoryPoint[] = bbValues.map((val, i) => ({
      time: data[i + bbOffset].timestamp,
      upper: val.upper,
      middle: val.middle,
      lower: val.lower,
      price: closes[i + bbOffset],
    }));

    const emaHistory: EMAHistoryPoint[] = ema200Values.map((_, i) => ({
      time: data[i + emaOffset].timestamp,
      ema9: ema9Values[i - (emaOffset - (data.length - ema9Values.length))] || 0,
      ema21: ema21Values[i - (emaOffset - (data.length - ema21Values.length))] || 0,
      ema50: ema50Values[i - (emaOffset - (data.length - ema50Values.length))] || 0,
      ema200: ema200Values[i] || 0,
    }));

    return {
      rsiHistory: rsiHistory.slice(-MAX_HISTORY_LENGTH),
      macdHistory: macdHistory.slice(-MAX_HISTORY_LENGTH),
      bbHistory: bbHistory.slice(-MAX_HISTORY_LENGTH),
      emaHistory: emaHistory.slice(-MAX_HISTORY_LENGTH),
    };
  }, []);

  useEffect(() => {
    if (ohlcvData.length > 0) {
      const newHistory = calculateHistoricalIndicators(ohlcvData);
      setHistory(newHistory);
    }
  }, [ohlcvData, calculateHistoricalIndicators]);

  return history;
}
