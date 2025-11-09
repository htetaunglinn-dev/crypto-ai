import { NextRequest, NextResponse } from 'next/server';
import { Analysis } from '@/lib/db/models';
import { connectToDatabase } from '@/lib/db/connection';
import type { ApiResponse, ClaudeAnalysis, TradingPair } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') as TradingPair;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!symbol) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Symbol parameter is required',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const analyses = await Analysis.find({ symbol })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const data: ClaudeAnalysis[] = analyses.map((analysis) => ({
      symbol: analysis.symbol,
      timestamp: analysis.timestamp.getTime(),
      signal: analysis.signal,
      confidence: analysis.confidence,
      currentPrice: analysis.currentPrice,
      marketAnalysis: analysis.marketAnalysis,
      patterns: analysis.patterns,
      riskAssessment: analysis.riskAssessment,
      suggestedEntry: analysis.suggestedEntry,
      suggestedExit: analysis.suggestedExit,
      stopLoss: analysis.stopLoss,
      timeframe: analysis.timeframe,
      expiresAt: analysis.expiresAt.getTime(),
    }));

    return NextResponse.json<ApiResponse<ClaudeAnalysis[]>>({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in /api/analysis/history:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analysis history',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
