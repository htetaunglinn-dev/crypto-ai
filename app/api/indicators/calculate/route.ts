import { NextRequest, NextResponse } from 'next/server';
import { binanceService } from '@/lib/services';
import { IndicatorCalculator } from '@/lib/indicators';
import { Indicator } from '@/lib/db/models';
import { connectToDatabase } from '@/lib/db/connection';
import type { ApiResponse, AllIndicators, TradingPair, TimeInterval } from '@/types';

const CACHE_DURATION = 60; // 1 minute cache for indicators

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') as TradingPair;
    const interval = (searchParams.get('interval') || '1h') as TimeInterval;

    if (!symbol) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }

    // Check cache first
    await connectToDatabase();
    const cached = await Indicator.findOne({ symbol }).sort({ timestamp: -1 });

    const now = Date.now();
    const cacheAge = cached ? now - cached.timestamp.getTime() : Infinity;

    if (cached && cacheAge < CACHE_DURATION * 1000) {
      const data: AllIndicators = {
        symbol: cached.symbol,
        timestamp: cached.timestamp.getTime(),
        rsi: cached.rsi,
        macd: cached.macd,
        ema: cached.ema,
        bollingerBands: cached.bollingerBands,
        volumeProfile: cached.volumeProfile,
      };

      return NextResponse.json<ApiResponse<AllIndicators>>({
        success: true,
        data,
        cached: true,
        timestamp: now,
      });
    }

    // Fetch historical data and calculate indicators
    const historicalData = await binanceService.getHistoricalData(symbol, interval, 200);

    if (!historicalData.data || historicalData.data.length < 200) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Insufficient data to calculate indicators',
        },
        { status: 500 }
      );
    }

    const indicators = IndicatorCalculator.calculateAll(symbol, historicalData.data);

    if (!indicators) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Failed to calculate indicators',
        },
        { status: 500 }
      );
    }

    // Save to cache
    await Indicator.create({
      ...indicators,
      timestamp: new Date(indicators.timestamp),
    });

    return NextResponse.json<ApiResponse<AllIndicators>>({
      success: true,
      data: indicators,
      cached: false,
      timestamp: now,
    });
  } catch (error) {
    console.error('Error in /api/indicators/calculate:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate indicators',
      },
      { status: 500 }
      );
  }
}

export const dynamic = 'force-dynamic';
