'use client';

import { useMarket } from '@/lib/market-context';
import { MARKET_LABELS } from '@/lib/marketConfig';
import { formatPercent, isPositive } from '@/lib/format';

export function TickerBar() {
  const { tickerQuotes, poolLoading } = useMarket();
  const items = tickerQuotes;
  const doubled = items.length ? [...items, ...items] : [];
  const durationSec = Math.max(28, items.length * 3.2);

  return (
    <div className="relative h-10 overflow-hidden border-b border-border bg-panel">
      {poolLoading && !items.length && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 animate-pulse-soft text-xs text-text-muted">
          Memuat ticker...
        </span>
      )}
      {items.length > 0 && (
        <div
          className="ticker-track flex h-full w-max items-center gap-8 px-4"
          style={{ animationDuration: `${durationSec}s` }}
        >
          {doubled.map((q, i) => {
            const up = isPositive(q.change_pct);
            return (
              <div key={`${q.symbol}-${i}`} className="flex shrink-0 items-center gap-2 text-xs">
                <span className="font-medium text-text-secondary">
                  {MARKET_LABELS[q.symbol] ?? q.symbol}
                </span>
                <span className="font-mono tabular-nums text-text-primary">
                  {q.last_price?.toLocaleString('en-US', { maximumFractionDigits: 2 }) ?? '—'}
                </span>
                <span
                  className={`font-mono tabular-nums ${up ? 'text-positive' : 'text-negative'}`}
                >
                  {formatPercent(q.change_pct)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
