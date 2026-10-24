'use client';

import type { AllIndicators } from '@/types';

interface IndicatorSummaryProps {
  indicators: AllIndicators;
  price: number;
}

type Tone = 'up' | 'down' | 'neutral';

const toneClass: Record<Tone, string> = {
  up: 'pill pill-up',
  down: 'pill pill-down',
  neutral: 'pill pill-neutral',
};

/** One-line read of the four indicators, so the gist is visible without reading every card. */
export function IndicatorSummary({ indicators, price }: IndicatorSummaryProps) {
  const { rsi, macd, ema, bollingerBands: bb } = indicators;

  const items: { label: string; tone: Tone }[] = [
    {
      label: `RSI ${rsi.value.toFixed(0)}${rsi.signal === 'overbought' ? ' · overbought' : rsi.signal === 'oversold' ? ' · oversold' : ''}`,
      tone: rsi.signal === 'oversold' ? 'up' : rsi.signal === 'overbought' ? 'down' : 'neutral',
    },
    {
      label: `MACD ${macd.histogram >= 0 ? 'bullish' : 'bearish'}`,
      tone: macd.histogram >= 0 ? 'up' : 'down',
    },
    {
      label: price >= ema.ema200 ? 'Above EMA 200' : 'Below EMA 200',
      tone: price >= ema.ema200 ? 'up' : 'down',
    },
    {
      label: price > bb.upper ? 'Above upper band' : price < bb.lower ? 'Below lower band' : 'Inside bands',
      tone: price > bb.upper ? 'down' : price < bb.lower ? 'up' : 'neutral',
    },
  ];

  const score = items.reduce((s, i) => s + (i.tone === 'up' ? 1 : i.tone === 'down' ? -1 : 0), 0);
  const overall: { label: string; tone: Tone } =
    score >= 2 ? { label: 'Leaning bullish', tone: 'up' } : score <= -2 ? { label: 'Leaning bearish', tone: 'down' } : { label: 'Mixed', tone: 'neutral' };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`${toneClass[overall.tone]} ring-1 ring-inset ring-white/10`}>{overall.label}</span>
      {items.map((item) => (
        <span key={item.label} className={toneClass[item.tone]}>
          {item.label}
        </span>
      ))}
    </div>
  );
}
