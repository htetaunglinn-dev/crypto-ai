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

    // Try to get from cache first
    await connectToDatabase();
    const cached = await CryptoPrice.findOne({ symbol, interval });

    const now = Date.now();
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

    // Fetch fresh data from Binance
    const data = await binanceService.getHistoricalData(symbol, interval, limit);

    // Update cache
    await CryptoPrice.findOneAndUpdate(
      { symbol, interval },
      { symbol, interval, data: data.data },
      { upsert: true, new: true }
    );

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
