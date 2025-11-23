'use client';

import { useState, useEffect, useCallback } from 'react';
import { IndicatorCalculator } from '@/lib/indicators/client-calculator';
import { cryptoCompareService } from '@/lib/services/cryptocompare';
import type {
    OHLCV,
    TradingPair,
    TimeInterval,
    ConnectionState,
    WebSocketError,
    AllIndicators,
} from '@/types';

interface UseCryptoCompareKlineResult {
    ohlcvData: OHLCV[];
    indicators: AllIndicators | null;
    isConnected: boolean;
    connectionState: ConnectionState;
    error: WebSocketError | null;
    reconnect: () => void;
}

const MAX_CANDLES = 200;

export function useCryptoCompareKline(
    symbol: TradingPair,
    interval: TimeInterval,
    initialData: OHLCV[] = []
): UseCryptoCompareKlineResult {
    const [ohlcvData, setOhlcvData] = useState<OHLCV[]>(initialData);
    const [indicators, setIndicators] = useState<AllIndicators | null>(null);
    const [error, setError] = useState<WebSocketError | null>(null);

    // Update initial data when it changes or symbol changes
    useEffect(() => {
        // Reset data when symbol changes to avoid showing stale data
        setOhlcvData(initialData);
        setIndicators(null);

        if (initialData.length >= 200) {
            const newIndicators = IndicatorCalculator.calculateAll(symbol, initialData);
            if (newIndicators) {
                setIndicators(newIndicators);
            }
        }
    }, [initialData, symbol]);

    // Polling
    useEffect(() => {
        let isMounted = true;

        const pollData = async () => {
            try {
                // Fetch latest data (CryptoCompare returns full history usually, we might want to optimize)
                // Or just fetch last 24h/100 points
                const data = await cryptoCompareService.getHistoricalData(symbol, interval, 10);

                if (!isMounted) return;

                setOhlcvData(prev => {
                    const lastTimestamp = prev.length > 0 ? prev[prev.length - 1].timestamp : 0;
                    const newCandles = data.data.filter(c => c.timestamp >= lastTimestamp);

                    if (newCandles.length === 0) return prev;

                    let updated = [...prev];

                    // Merge logic
                    if (newCandles[0].timestamp === lastTimestamp) {
                        updated[updated.length - 1] = newCandles[0];
                        newCandles.shift();
                    }

                    updated = [...updated, ...newCandles];

                    if (updated.length > MAX_CANDLES) {
                        updated = updated.slice(updated.length - MAX_CANDLES);
                    }

                    if (updated.length >= 200) {
                        const newIndicators = IndicatorCalculator.calculateAll(symbol, updated);
                        setIndicators(newIndicators);
                    }

                    return updated;
                });

                setError(null);
            } catch (err) {
                console.error('Error polling candle data:', err);
            }
        };

        const intervalId = setInterval(pollData, 60000); // 1 minute

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [symbol, interval]);

    const reconnect = useCallback(() => { }, []);

    return {
        ohlcvData,
        indicators,
        isConnected: true,
        connectionState: 'connected',
        error,
        reconnect,
    };
}
