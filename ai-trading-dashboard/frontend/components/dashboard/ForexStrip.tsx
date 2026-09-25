'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { MARKET_LABELS } from '@/lib/marketConfig';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function ForexStrip({ pairs }: { pairs: string[] }) {
  const { data } = useSWR(
    pairs.length ? ['forex', pairs.join(',')] : null,
    () => api.getWatchlistQuotes(pairs),
    { refreshInterval: 60_000 }
  );

  if (!pairs.length) {
    return (
      <div className="flex h-full min-h-[140px] flex-col justify-center rounded-md border border-border bg-panel px-4 py-3">
        <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Forex</div>
        <p className="mt-2 text-xs text-text-muted">Not relevant for this tab.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[140px] flex-col rounded-md border border-border bg-panel px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Forex</div>
      <div className="mt-2 flex flex-1 flex-col justify-center space-y-2.5">
        {(data ?? []).map((q) => (
          <div key={q.symbol} className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-secondary">
              {MARKET_LABELS[q.symbol] ?? q.symbol}
            </span>
            <div className="text-right">
              <div className="font-mono text-sm text-text-primary">{formatPrice(q.last_price)}</div>
              <div
                className={`font-mono text-[10px] ${
                  isPositive(q.change_pct) ? 'text-positive' : 'text-negative'
                }`}
              >
                {formatPercent(q.change_pct)}
              </div>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-xs text-text-muted">Loading FX rates...</p>}
      </div>
    </div>
  );
}
