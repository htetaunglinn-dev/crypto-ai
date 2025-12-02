import { NextRequest, NextResponse } from "next/server";
import { cryptoCompareService } from "@/lib/services";
import { CryptoPrice } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connection";
import type {
  ApiResponse,
  HistoricalData,
  TradingPair,
  TimeInterval,
} from "@/types";

const CACHE_DURATION = parseInt(process.env.CACHE_DURATION || "300", 10);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") as TradingPair;
    const interval = (searchParams.get("interval") || "1h") as TimeInterval;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    if (!symbol) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Symbol parameter is required",
        },
        { status: 400 }
      );
    }

    const now = Date.now();
    let cached = null;

    if (process.env.MONGODB_URI) {
      try {
        const cachePromise = (async () => {
          try {
            await connectToDatabase();
            return await CryptoPrice.findOne({ symbol, interval });
          } catch (err) {
            console.warn("MongoDB connection failed, skipping cache:", err);
            return null;
          }
        })();

        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 2000)
        );

        cached = await Promise.race([cachePromise, timeoutPromise]);

        if (cached) {
          const cacheAge = now - cached.updatedAt.getTime();

          if (cacheAge < CACHE_DURATION * 1000) {
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
        }
      } catch (dbError) {
        console.warn(
          "MongoDB cache unavailable, fetching directly from CryptoCompare:",
          dbError
        );
      }
    }

    const data = await cryptoCompareService.getHistoricalData(
      symbol,
      interval,
      limit
    );

    if (process.env.MONGODB_URI) {
      const updateCache = async () => {
        try {
          await connectToDatabase();

          const updatePromise = CryptoPrice.findOneAndUpdate(
            { symbol, interval },
            { symbol, interval, data: data.data },
            { upsert: true, new: true }
          );

          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 2000)
          );

          await Promise.race([updatePromise, timeoutPromise]);
        } catch (dbError) {
          console.warn("Failed to update cache:", dbError);
        }
      };

      updateCache().catch((err) => {
        console.warn("Cache update error (non-critical):", err);
      });
    }

    return NextResponse.json<ApiResponse<HistoricalData>>({
      success: true,
      data,
      cached: false,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error in /api/crypto/historical:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch historical data",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
