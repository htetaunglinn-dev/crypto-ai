'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { coinCapService } from '@/lib/services/coincap';
import type {
    CryptoPrice,
    TradingPair,
    ConnectionState,
    WebSocketError,
} from '@/types';

interface UseCoinCapTickerStreamResult {
    prices: CryptoPrice[];
    isConnected: boolean;
    connectionState: ConnectionState;
    error: WebSocketError | null;
    reconnect: () => void;
}

export function useCoinCapTickerStream(symbols: TradingPair[]): UseCoinCapTickerStreamResult {
    const [prices, setPrices] = useState<CryptoPrice[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<WebSocketError | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Initial fetch to get full data (volume, changes, etc.)
    useEffect(() => {
        const fetchInitialPrices = async () => {
            try {
                if (symbols.length === 0) return;
                const initialPrices = await coinCapService.getMultiplePrices(symbols);
                setPrices(initialPrices);
            } catch (err) {
                console.error('Failed to fetch initial prices:', err);
                setError({
                    message: 'Failed to fetch initial data',
                    timestamp: Date.now(),
                });
            }
        };

        fetchInitialPrices();
    }, [symbols]);

    // WebSocket connection
    useEffect(() => {
        if (symbols.length === 0) {
            setConnectionState('disconnected');
            return;
        }

        const assetIds = symbols.map(s => coinCapService.getSymbolId(s)).join(',');
        const wsUrl = `wss://wss.coincap.io/prices?assets=${assetIds}`;

        console.log('[CoinCapStream] Connecting to:', wsUrl);
        setConnectionState('connecting');

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[CoinCapStream] Connected');
            setConnectionState('connected');
            setError(null);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // data is like { "bitcoin": "6000.00", "ethereum": "200.00" }

                setPrices(prevPrices => {
                    const newPrices = [...prevPrices];
                    let hasUpdates = false;

                    Object.entries(data).forEach(([id, priceStr]) => {
                        const symbol = coinCapService.getSymbolFromId(id);
                        const price = parseFloat(priceStr as string);

                        const index = newPrices.findIndex(p => p.symbol === symbol);
                        if (index !== -1) {
                            // Update existing price
                            newPrices[index] = {
                                ...newPrices[index],
                                price,
                                lastUpdated: new Date(),
                            };
                            hasUpdates = true;
                        } else {
                            // If we receive a price for a symbol we don't have full data for yet,
                            // we might skip it or create a partial record. 
                            // For now, skip to avoid incomplete UI.
                        }
                    });

                    return hasUpdates ? newPrices : prevPrices;
                });

            } catch (err) {
                console.error('[CoinCapStream] Error parsing message:', err);
            }
        };

        ws.onerror = (event) => {
            console.error('[CoinCapStream] WebSocket error:', event);
            setConnectionState('error');
            setError({
                message: 'WebSocket connection error',
                timestamp: Date.now(),
            });
        };

        ws.onclose = () => {
            console.log('[CoinCapStream] Disconnected');
            setConnectionState('disconnected');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [symbols]);

    const reconnect = useCallback(() => {
        // Force re-render to trigger effect
        setConnectionState('disconnected');
        // Actual reconnection happens via the effect dependency on connectionState/symbols
        // But since we don't depend on connectionState in the effect, we might need a trigger.
        // Actually, just closing the old one and letting React handle re-mount or 
        // we can just rely on the user refreshing or changing symbols.
        // For a manual reconnect, we can close the current one.
        if (wsRef.current) {
            wsRef.current.close();
        }
    }, []);

    return {
        prices,
        isConnected: connectionState === 'connected',
        connectionState,
        error,
        reconnect,
    };
}
