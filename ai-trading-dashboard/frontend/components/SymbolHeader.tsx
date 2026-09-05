'use client';

import { QuoteSnapshot } from '@/types/market';
import { formatChange, formatPercent, formatPrice, isPositive } from '@/lib/format';

interface SymbolHeaderProps {
  quote: QuoteSnapshot | null;
  loading: boolean;
}

export function SymbolHeader({ quote, loading }: SymbolHeaderProps) {
  if (loading || !quote) {
    return (
      <div className="flex items-baseline gap-3 px-1 py-2">
        <div className="h-7 w-32 animate-pulse rounded-sm bg-panel" />
      </div>
    );
  }

  const positive = isPositive(quote.change);

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-1 py-2">
      <h2 className="font-mono text-xl font-semibold text-text-primary">{quote.symbol}</h2>
      <span className="truncate text-sm text-text-secondary">{quote.name}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
        {formatPrice(quote.last_price)}
      </span>
      <span
        className={`font-mono text-sm font-medium tabular-nums ${
          positive ? 'text-positive' : 'text-negative'
        }`}
      >
        {formatChange(quote.change)} ({formatPercent(quote.change_pct)})
      </span>
      {quote.market_state && (
        <span className="rounded-sm border border-border px-2 py-0.5 text-xs text-text-muted">
          {quote.market_state}
        </span>
      )}
    </div>
  );
}
