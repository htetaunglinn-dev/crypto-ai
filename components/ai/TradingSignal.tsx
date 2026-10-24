'use client';

import { formatSignal, getSignalTextColor } from '@/lib/utils';
import type { TradingSignal as TradingSignalType } from '@/types';

interface TradingSignalProps {
  signal: TradingSignalType;
  confidence: number;
}

const DESCRIPTIONS: Record<string, string> = {
  strong_buy: 'Strong buying opportunity with multiple bullish confirmations',
  buy: 'Bullish bias with some positive signals',
  hold: 'Mixed signals. Wait for clearer confirmation',
  sell: 'Bearish bias with some negative signals',
  strong_sell: 'Strong selling signal with multiple bearish confirmations',
};

const GLOW: Record<string, string> = {
  strong_buy: 'from-up/20',
  buy: 'from-up/12',
  hold: 'from-yellow-500/12',
  sell: 'from-down/12',
  strong_sell: 'from-down/20',
};

export function TradingSignal({ signal, confidence }: TradingSignalProps) {
  const r = 26;
  const c = 2 * Math.PI * r;

  return (
    <div className={`flex items-center gap-4 rounded-xl border border-line bg-gradient-to-br ${GLOW[signal] ?? 'from-gray-500/10'} to-transparent p-4`}>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-gray-500">Signal</div>
        <div className={`text-2xl font-semibold tracking-tight ${getSignalTextColor(signal)}`}>
          {formatSignal(signal)}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">{DESCRIPTIONS[signal]}</p>
      </div>

      <div className="relative h-16 w-16 shrink-0" title={`Confidence ${confidence}%`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} strokeWidth="6" fill="none" className="stroke-surface-3" />
          <circle
            cx="32"
            cy="32"
            r={r}
            strokeWidth="6"
            fill="none"
            stroke="currentColor"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - confidence / 100)}
            strokeLinecap="round"
            className={`transition-all duration-700 ${getSignalTextColor(signal)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-sm font-semibold text-white">{confidence}%</span>
          <span className="text-[9px] text-gray-500">conf.</span>
        </div>
      </div>
    </div>
  );
}
