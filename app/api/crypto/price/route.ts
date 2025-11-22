import { NextRequest, NextResponse } from 'next/server';
import { coinGeckoService } from '@/lib/services';
import type { ApiResponse, CryptoPrice, TradingPair } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') as TradingPair;
    const multiple = searchParams.get('symbols');

    if (!symbol && !multiple) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Symbol or symbols parameter is required',
        },
        { status: 400 }
      );
    }

    let data: CryptoPrice | CryptoPrice[];

    if (multiple) {
      // Fetch multiple symbols
      const symbols = multiple.split(',') as TradingPair[];
      data = await Promise.all(symbols.map(s => coinGeckoService.getCurrentPrice(s)));
    } else {
      // Fetch single symbol
      data = await coinGeckoService.getCurrentPrice(symbol);
    }

    return NextResponse.json<ApiResponse<typeof data>>({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in /api/crypto/price:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto price',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
