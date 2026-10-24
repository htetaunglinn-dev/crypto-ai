import { NextResponse } from 'next/server';
import { marketDataService, type GlobalMarket } from '@/lib/services/market';

let cached: { data: GlobalMarket; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const data = await marketDataService.getGlobalMarket();
    cached = { data, timestamp: Date.now() };

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error) {
    console.error('Error in /api/market/global:', error);
    if (cached) {
      return NextResponse.json({ success: true, data: cached.data, cached: true, stale: true });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch global market data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
