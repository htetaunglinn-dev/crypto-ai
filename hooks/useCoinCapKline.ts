'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IndicatorCalculator } from '@/lib/indicators/client-calculator';
import { coinCapService } from '@/lib/services/coincap';
import type {
    OHLCV,
    TradingPair,
    TimeInterval,
    ConnectionState,
    WebSocketError,
    AllIndicators,
} from '@/types';

interface UseCoinCapKlineResult {
    ohlcvData: OHLCV[];
    indicators: AllIndicators | null;
    isConnected: boolean;
    connectionState: ConnectionState;
    error: WebSocketError | null;
    reconnect: () => void;
}

const MAX_CANDLES = 200;

export function useCoinCapKline(
    symbol: TradingPair,
    interval: TimeInterval,
    initialData: OHLCV[] = []
): UseCoinCapKlineResult {
    const [ohlcvData, setOhlcvData] = useState<OHLCV[]>(initialData);
    const [indicators, setIndicators] = useState<AllIndicators | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('connected'); // Simulated state
    const [error, setError] = useState<WebSocketError | null>(null);

    // Update initial data when it changes
    useEffect(() => {
        if (initialData.length === 0) return;

        setOhlcvData(initialData);

        if (initialData.length >= 200) {
            const newIndicators = IndicatorCalculator.calculateAll(symbol, initialData);
            if (newIndicators) {
                setIndicators(newIndicators);
            }
        }
    }, [initialData, symbol]);

    // Polling for new data
    useEffect(() => {
        let isMounted = true;

        const pollData = async () => {
            try {
                // Fetch latest candles
                const data = await coinCapService.getHistoricalData(symbol, interval, 5); // Get last few candles

                if (!isMounted) return;

                setOhlcvData(prev => {
                    // Merge new data with existing data
                    // This is a simplified merge strategy
                    const lastTimestamp = prev.length > 0 ? prev[prev.length - 1].timestamp : 0;
                    const newCandles = data.data.filter(c => c.timestamp >= lastTimestamp);

                    if (newCandles.length === 0) return prev;

                    let updated = [...prev];

                    // If the first new candle has same timestamp as last existing, update it
                    if (newCandles[0].timestamp === lastTimestamp) {
                        updated[updated.length - 1] = newCandles[0];
                        newCandles.shift();
                    }

                    updated = [...updated, ...newCandles];

                    if (updated.length > MAX_CANDLES) {
                        updated = updated.slice(updated.length - MAX_CANDLES);
                    }

                    // Recalculate indicators
                    if (updated.length >= 200) {
                        const newIndicators = IndicatorCalculator.calculateAll(symbol, updated);
                        setIndicators(newIndicators);
                    }

                    return updated;
                });

                setError(null);
            } catch (err) {
                console.error('Error polling candle data:', err);
                // Don't set error state to avoid flashing UI errors on transient network issues
            }
        };

        // Poll every 60 seconds
        const intervalId = setInterval(pollData, 60000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [symbol, interval]);

    const reconnect = useCallback(() => {
        // No-op for polling
        console.log('Reconnect triggered (polling reset)');
    }, []);

    return {
        ohlcvData,
        indicators,
        isConnected: true, // Always "connected" for polling
        connectionState: 'connected',
        error,
        reconnect,
    };
}
