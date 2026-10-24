'use client';

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import type { OHLCV } from '@/types';
import { cn, formatCurrency, formatLargeNumber } from '@/lib/utils';

interface CandlestickChartProps {
  data: OHLCV[];
  symbol: string;
  className?: string;
}

const UP = '#1fc786';
const DOWN = '#f4475d';

function toCandle(d: OHLCV) {
  return { time: Math.floor(d.timestamp / 1000) as UTCTimestamp, open: d.open, high: d.high, low: d.low, close: d.close };
}

function toVolume(d: OHLCV) {
  return {
    time: Math.floor(d.timestamp / 1000) as UTCTimestamp,
    value: d.volume,
    color: d.close >= d.open ? 'rgba(31,199,134,0.35)' : 'rgba(244,71,93,0.35)',
  };
}

export function CandlestickChart({ data, symbol, className }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const renderedRef = useRef<{ lastTs: number; length: number } | null>(null);
  const dataRef = useRef(data);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<OHLCV | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Create the chart once per symbol
  useEffect(() => {
    let disposed = false;

    import('lightweight-charts').then(({ createChart, ColorType, CandlestickSeries, HistogramSeries, CrosshairMode }) => {
      if (disposed || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#8790a3',
          fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
          fontSize: 11,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: 'rgba(135,148,255,0.4)', labelBackgroundColor: '#262d3a' },
          horzLine: { color: 'rgba(135,148,255,0.4)', labelBackgroundColor: '#262d3a' },
        },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#1f2633', rightOffset: 4 },
        rightPriceScale: { borderColor: '#1f2633', scaleMargins: { top: 0.08, bottom: 0.22 } },
      });

      const candles = chart.addSeries(CandlestickSeries, {
        upColor: UP,
        downColor: DOWN,
        borderUpColor: UP,
        borderDownColor: DOWN,
        wickUpColor: UP,
        wickDownColor: DOWN,
        priceLineStyle: 2,
      });

      const volume = chart.addSeries(HistogramSeries, {
        priceScaleId: 'volume',
        priceFormat: { type: 'volume' },
        lastValueVisible: false,
        priceLineVisible: false,
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      chart.subscribeCrosshairMove((param) => {
        if (!param.time) {
          setHover(null);
          return;
        }
        const ts = (param.time as number) * 1000;
        setHover(dataRef.current.find((d) => d.timestamp === ts) ?? null);
      });

      chartRef.current = chart;
      candleRef.current = candles;
      volumeRef.current = volume;
      renderedRef.current = null;
      setReady(true);
    });

    return () => {
      disposed = true;
      chartRef.current?.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      setReady(false);
    };
  }, [symbol]);

  // Push data: a live tick updates the last bar in place, anything else replaces the set
  useEffect(() => {
    const candles = candleRef.current;
    const volume = volumeRef.current;
    if (!ready || !candles || !volume) return;
    if (data.length === 0) {
      renderedRef.current = null;
      return;
    }

    const prev = renderedRef.current;
    const last = data[data.length - 1];
    // Same forming candle, or exactly one new candle after the last one drawn
    const isIncremental = !!prev && Math.abs(data.length - prev.length) <= 1 && (
      last.timestamp === prev.lastTs ||
      (data.length > 1 && data[data.length - 2].timestamp === prev.lastTs)
    );

    const redraw = () => {
      candles.setData(data.map(toCandle));
      volume.setData(data.map(toVolume));
    };

    try {
      if (isIncremental) {
        candles.update(toCandle(last));
        volume.update(toVolume(last));
      } else {
        redraw();
        if (!prev) {
          // Open on the most recent bars; older history stays a scroll away
          chartRef.current?.timeScale().setVisibleLogicalRange({
            from: Math.max(0, data.length - 120),
            to: data.length + 4,
          });
        }
      }
    } catch {
      redraw();
    }
    renderedRef.current = { lastTs: last.timestamp, length: data.length };
  }, [data, ready]);

  const legend = hover ?? data[data.length - 1];
  const legendUp = legend ? legend.close >= legend.open : true;

  return (
    <div className={cn('relative h-[340px] w-full sm:h-[420px]', className)}>
      {legend && (
        <div className="pointer-events-none absolute left-1 top-0 z-10 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] num">
          {(['open', 'high', 'low', 'close'] as const).map((k) => (
            <span key={k} className="text-gray-500">
              {k[0].toUpperCase()}{' '}
              <span className={legendUp ? 'text-up' : 'text-down'}>{formatCurrency(legend[k])}</span>
            </span>
          ))}
          <span className="text-gray-500">
            Vol <span className="text-gray-300">{formatLargeNumber(legend.volume).replace('$', '')}</span>
          </span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
