'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoCompareService } from '@/lib/services/cryptocompare';
import type {
    CryptoPrice,
    TradingPair,
    ConnectionState,
    WebSocketError,
} from '@/types';

interface UseCryptoCompareTickerStreamResult {
    prices: CryptoPrice[];
    isConnected: boolean;
    connectionState: ConnectionState;
    error: WebSocketError | null;
    reconnect: () => void;
}

export function useCryptoCompareTickerStream(symbols: TradingPair[]): UseCryptoCompareTickerStreamResult {
    const [prices, setPrices] = useState<CryptoPrice[]>([]);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<WebSocketError | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchInitial = async () => {
            if (symbols.length === 0) return;
            try {
                const initialPrices = await cryptoCompareService.getMultiplePrices(symbols);
                setPrices(initialPrices);
            } catch (err) {
                console.error('Failed to fetch initial prices:', err);
            }
        };
        fetchInitial();
    }, [symbols]);

    // WebSocket connection
    useEffect(() => {
        if (symbols.length === 0) {
            setConnectionState('disconnected');
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY; // Need to expose this if we want to use it client side, or use free stream without key
        const wsUrl = `wss://streamer.cryptocompare.com/v2?api_key=${apiKey || ''}`;

        console.log('[CryptoCompareStream] Connecting to:', wsUrl);
        setConnectionState('connecting');

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[CryptoCompareStream] Connected');
            setConnectionState('connected');
            setError(null);

            // Subscribe
            const subs = symbols.map(s => {
                const base = s.replace('USDT', '');
                return `2~Coinbase~${base}~USDT`; // 2 = Trade, Coinbase is reliable, or use CCCAGG (5)
            });
            // Try CCCAGG for aggregated data
            const subsAgg = symbols.map(s => {
                const base = s.replace('USDT', '');
                return `5~CCCAGG~${base}~USDT`;
            });

            const subMsg = {
                action: 'SubAdd',
                subs: subsAgg
            };
            ws.send(JSON.stringify(subMsg));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Type 5 is CCCAGG (Aggregated)
                if (data.TYPE === '5' && data.PRICE) {
                    const symbol = (data.FROMSYMBOL + data.TOSYMBOL) as TradingPair;

                    setPrices(prev => {
                        const index = prev.findIndex(p => p.symbol === symbol);
                        if (index === -1) return prev; // Don't add if not in list (or maybe we should?)

                        const updated = [...prev];
                        const current = updated[index];

                        // Update only fields present in the update (CryptoCompare sends partial updates)
                        updated[index] = {
                            ...current,
                            price: data.PRICE || current.price,
                            change24h: data.CHANGE24HOUR || current.change24h,
                            changePercent24h: data.CHANGEPCT24HOUR || current.changePercent24h,
                            high24h: data.HIGH24HOUR || current.high24h,
                            low24h: data.LOW24HOUR || current.low24h,
                            volume24h: data.VOLUME24HOURTO || current.volume24h,
                            lastUpdated: new Date(),
                        };
                        return updated;
                    });
                }
            } catch (err) {
                console.error('[CryptoCompareStream] Error parsing message:', err);
            }
        };

        ws.onerror = (event) => {
            console.error('[CryptoCompareStream] WebSocket error:', event);
            setConnectionState('error');
            setError({
                message: 'WebSocket connection error',
                timestamp: Date.now(),
            });
        };

        ws.onclose = () => {
            console.log('[CryptoCompareStream] Disconnected');
            setConnectionState('disconnected');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [symbols]);

    const reconnect = useCallback(() => {
        if (wsRef.current) wsRef.current.close();
    }, []);

    return {
        prices,
        isConnected: connectionState === 'connected',
        connectionState,
        error,
        reconnect,
    };
}
