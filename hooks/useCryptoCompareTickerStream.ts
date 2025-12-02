"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cryptoCompareService } from "@/lib/services/cryptocompare";
import type {
  CryptoPrice,
  TradingPair,
  ConnectionState,
  WebSocketError,
} from "@/types";

interface UseCryptoCompareTickerStreamResult {
  prices: CryptoPrice[];
  isConnected: boolean;
  connectionState: ConnectionState;
  error: WebSocketError | null;
  reconnect: () => void;
}

export function useCryptoCompareTickerStream(
  symbols: TradingPair[]
): UseCryptoCompareTickerStreamResult {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [error, setError] = useState<WebSocketError | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPrices((prev) => {
      const newPrices = [...prev];
      let changed = false;

      const currentSymbols = new Set(symbols);
      const filtered = newPrices.filter((p) =>
        currentSymbols.has(p.symbol as TradingPair)
      );
      if (filtered.length !== newPrices.length) {
        changed = true;
      }

      symbols.forEach((s) => {
        if (!filtered.find((p) => p.symbol === s)) {
          filtered.push({
            symbol: s,
            price: 0,
            change24h: 0,
            changePercent24h: 0,
            high24h: 0,
            low24h: 0,
            volume24h: 0,
            lastUpdated: new Date(),
          });
          changed = true;
        }
      });

      return changed ? filtered : prev;
    });
  }, [symbols]);

  useEffect(() => {
    const fetchInitial = async () => {
      if (symbols.length === 0) return;
      try {
        console.log(
          "[CryptoCompareStream] Fetching initial prices for:",
          symbols
        );
        const initialPrices = await cryptoCompareService.getMultiplePrices(
          symbols
        );

        if (initialPrices.length > 0) {
          setPrices((prev) => {
            const updated = prev.map((p) => {
              const newPrice = initialPrices.find(
                (ip) => ip.symbol === p.symbol
              );
              if (newPrice) {
                return newPrice;
              }
              return p;
            });

            initialPrices.forEach((newPrice) => {
              if (!updated.find((p) => p.symbol === newPrice.symbol)) {
                updated.push(newPrice);
              }
            });

            return updated;
          });
          console.log(
            "[CryptoCompareStream] ✅ Initial prices loaded:",
            initialPrices.length
          );
        } else {
          console.warn("[CryptoCompareStream] No initial prices received");
        }
      } catch (err) {
        console.error(
          "[CryptoCompareStream] Failed to fetch initial prices:",
          err
        );
      }
    };
    fetchInitial();
  }, [symbols]);

  const subscriptionKey = symbols.sort().join(",");

  const cleanup = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (symbols.length === 0) {
      setConnectionState("disconnected");
      cleanup();
      return;
    }

    const connect = () => {
      cleanup();

      const apiKey = process.env.NEXT_PUBLIC_CRYPTOCOMPARE_API_KEY || "";
      const wsUrl = apiKey
        ? `wss://streamer.cryptocompare.com/v2?api_key=${apiKey}`
        : "wss://streamer.cryptocompare.com/v2";

      console.log("[CryptoCompareStream] Connecting to WebSocket...");
      setConnectionState("connecting");
      setError(null);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[CryptoCompareStream] ✅ Connected");
        setConnectionState("connected");
        setError(null);
        reconnectAttemptsRef.current = 0;

        const subsAgg = symbols.map((s) => {
          const base = s.replace("USDT", "");
          return `5~CCCAGG~${base}~USDT`;
        });

        const subMsg = {
          action: "SubAdd",
          subs: subsAgg,
        };

        console.log("[CryptoCompareStream] Subscribing to:", subsAgg);
        ws.send(JSON.stringify(subMsg));

        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ action: "Ping" }));
            } catch (err) {
              console.warn("[CryptoCompareStream] Heartbeat failed:", err);
            }
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.TYPE === "5") {
            const symbol = (data.FROMSYMBOL + data.TOSYMBOL) as TradingPair;

            if (!symbol || symbol.includes("undefined")) return;

            setPrices((prev) => {
              const index = prev.findIndex((p) => p.symbol === symbol);
              if (index === -1) return prev;

              const updated = [...prev];
              const current = updated[index];

              updated[index] = {
                ...current,
                price: data.PRICE !== undefined ? data.PRICE : current.price,
                change24h:
                  data.CHANGE24HOUR !== undefined
                    ? data.CHANGE24HOUR
                    : current.change24h,
                changePercent24h:
                  data.CHANGEPCT24HOUR !== undefined
                    ? data.CHANGEPCT24HOUR
                    : current.changePercent24h,
                high24h:
                  data.HIGH24HOUR !== undefined
                    ? data.HIGH24HOUR
                    : current.high24h,
                low24h:
                  data.LOW24HOUR !== undefined
                    ? data.LOW24HOUR
                    : current.low24h,
                volume24h:
                  data.VOLUME24HOURTO !== undefined
                    ? data.VOLUME24HOURTO
                    : current.volume24h,
                lastUpdated: new Date(),
              };
              return updated;
            });
          } else if (data.TYPE === "999") {
            console.log("[CryptoCompareStream] Heartbeat received");
          } else if (data.MESSAGE === "STREAMERWELCOME") {
            console.log(
              "[CryptoCompareStream] Streamer welcome message received"
            );
          }
        } catch (err) {
          console.error("[CryptoCompareStream] Error parsing message:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("[CryptoCompareStream] WebSocket error:", event);
        setConnectionState("error");
        setError({
          message: "WebSocket connection error",
          timestamp: Date.now(),
        });
      };

      ws.onclose = (event) => {
        console.log(
          "[CryptoCompareStream] Disconnected",
          event.code,
          event.reason
        );
        setConnectionState("disconnected");

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectDelay * reconnectAttemptsRef.current;
          console.log(
            `[CryptoCompareStream] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError({
            message: "Failed to reconnect after multiple attempts",
            timestamp: Date.now(),
          });
        }
      };
    };

    connect();

    return () => {
      cleanup();
    };
  }, [subscriptionKey]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  return {
    prices,
    isConnected: connectionState === "connected",
    connectionState,
    error,
    reconnect,
  };
}
