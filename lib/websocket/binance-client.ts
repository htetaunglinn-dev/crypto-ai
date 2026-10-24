import { ConnectionState, WebSocketError } from '@/types/crypto';

export interface BinanceWebSocketConfig {
  streams: string[];
  onMessage: (data: unknown) => void;
  onError: (error: WebSocketError) => void;
  onStateChange: (state: ConnectionState) => void;
}

/**
 * Free, keyless Binance public market streams. data-stream.binance.vision serves market data
 * only and is reachable from regions where stream.binance.com is blocked, so it goes first.
 */
const STREAM_HOSTS = [
  'wss://data-stream.binance.vision',
  'wss://stream.binance.com:9443',
];

const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private config: BinanceWebSocketConfig;
  private hostIndex = 0;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isDisconnecting = false;

  constructor(config: BinanceWebSocketConfig) {
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }
    if (this.config.streams.length === 0) return;

    this.isDisconnecting = false;
    this.updateState('connecting');

    try {
      const url = `${STREAM_HOSTS[this.hostIndex]}/stream?streams=${this.config.streams.join('/')}`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.updateState('connected');
        this.reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          this.config.onMessage(JSON.parse(event.data));
        } catch {
          this.config.onError({
            message: 'Failed to parse WebSocket message',
            code: 'PARSE_ERROR',
            timestamp: Date.now(),
          });
        }
      };

      // onclose always follows onerror, so reconnection is handled there
      ws.onerror = () => {};

      ws.onclose = (event) => {
        this.ws = null;
        if (this.isDisconnecting) {
          this.updateState('disconnected');
          return;
        }
        this.scheduleReconnect(event.code);
      };
    } catch (error) {
      this.config.onError({
        message: error instanceof Error ? error.message : 'Failed to create WebSocket',
        code: 'CREATE_ERROR',
        timestamp: Date.now(),
      });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(code?: number): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.updateState('error');
      this.config.onError({
        message: 'Live stream unavailable. Prices will refresh periodically instead.',
        code: code ? `CLOSE_${code}` : 'CONNECTION_ERROR',
        timestamp: Date.now(),
      });
      return;
    }

    // Alternate hosts so a blocked or failing host doesn't keep us offline
    this.hostIndex = (this.hostIndex + 1) % STREAM_HOSTS.length;
    const delay = Math.min(BASE_RECONNECT_DELAY * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY);
    this.reconnectAttempts += 1;
    this.updateState('connecting');

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.isDisconnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
    this.updateState('disconnected');
  }

  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 300);
  }

  updateStreams(streams: string[]): void {
    this.config.streams = streams;
    this.reconnect();
  }

  getState(): ConnectionState {
    return this.connectionState;
  }

  private updateState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.config.onStateChange(state);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.connectionState === 'connected';
  }
}
