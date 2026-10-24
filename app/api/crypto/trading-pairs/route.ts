import { NextResponse } from 'next/server';
import { marketDataService, type MarketPair } from '@/lib/services/market';

// Pairs are ranked by live 24h volume, so refresh the list every few minutes
let cachedPairs: MarketPair[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (cachedPairs && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json({
        pairs: cachedPairs,
        cached: true,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      });
    }

    const pairs = await marketDataService.getAvailablePairs();

    cachedPairs = pairs;
    cacheTimestamp = now;

    return NextResponse.json({
      pairs,
      cached: false,
      cachedAt: new Date(cacheTimestamp).toISOString(),
    });
  } catch (error) {
    console.error('Error in trading-pairs API route:', error);
    if (cachedPairs) {
      return NextResponse.json({
        pairs: cachedPairs,
        cached: true,
        stale: true,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      });
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch trading pairs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
