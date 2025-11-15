import { NextRequest, NextResponse } from 'next/server';
import { binanceService } from '@/lib/services';
import { CryptoPrice } from '@/lib/db/models';
import { connectToDatabase } from '@/lib/db/connection';
import type { ApiResponse, HistoricalData, TradingPair, TimeInterval } from '@/types';

const CACHE_DURATION = parseInt(process.env.CACHE_DURATION || '300', 10); // 5 minutes default

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') as TradingPair;
    const interval = (searchParams.get('interval') || '1h') as TimeInterval;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!symbol) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }

    const now = Date.now();
    let cached = null;

    // Try to get from cache first (only if MongoDB is configured)
    if (process.env.MONGODB_URI) {
      try {
        await connectToDatabase();
        cached = await CryptoPrice.findOne({ symbol, interval });

        const cacheAge = cached ? now - cached.updatedAt.getTime() : Infinity;

        // Return cached data if fresh enough
        if (cached && cacheAge < CACHE_DURATION * 1000) {
          const data: HistoricalData = {
            symbol: cached.symbol,
            interval: cached.interval,
            data: cached.data,
          };

          return NextResponse.json<ApiResponse<HistoricalData>>({
            success: true,
            data,
            cached: true,
            timestamp: now,
          });
        }
      } catch (dbError) {
        console.warn('MongoDB cache unavailable, fetching directly from Binance');
      }
    }

    // Fetch fresh data from Binance
    const data = await binanceService.getHistoricalData(symbol, interval, limit);

    // Update cache (only if MongoDB is configured)
    if (process.env.MONGODB_URI) {
      try {
        await CryptoPrice.findOneAndUpdate(
          { symbol, interval },
          { symbol, interval, data: data.data },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.warn('Failed to update cache, continuing without cache');
      }
    }

    return NextResponse.json<ApiResponse<HistoricalData>>({
      success: true,
      data,
      cached: false,
      timestamp: now,
    });
  } catch (error) {
    console.error('Error in /api/crypto/historical:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch historical data',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
