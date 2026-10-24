'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CoinLogoProps {
  src?: string;
  symbol: string;
  size?: number;
  className?: string;
}

// Deterministic hue per ticker so fallback avatars stay recognisable
function hueFor(symbol: string) {
  let h = 0;
  for (const ch of symbol) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export function CoinLogo({ src, symbol, size = 28, className }: CoinLogoProps) {
  const [failed, setFailed] = useState(false);
  const base = symbol.replace(/USDT$/, '');

  if (!src || failed) {
    const hue = hueFor(base);
    return (
      <span
        aria-hidden
        className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', className)}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(9, size * 0.36),
          background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))`,
        }}
      >
        {base.slice(0, 3)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote CoinGecko logos, no optimisation needed
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-full bg-surface-3', className)}
    />
  );
}
