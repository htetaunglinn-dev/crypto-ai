// DEPRECATED: This service is no longer used. We've migrated to CoinGecko API.
// Binance API was blocked (451 error) from Vercel servers due to geo-restrictions.
// All functionality has been migrated to CoinGecko service.
// This file is kept for reference only.

// Placeholder export to prevent import errors in case any legacy code still references it
export const binanceService = null;
export interface BinanceSymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}
