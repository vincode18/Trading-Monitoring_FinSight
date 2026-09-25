'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function IndexHeroCard({ symbol, label }: { symbol: string; label: string }) {
  const { data } = useSWR(['index-hero', symbol], () => api.getQuote(symbol), {
    refreshInterval: 45_000,
  });

  return (
    <div className="flex h-full min-h-[140px] flex-col rounded-md border border-border bg-panel px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
        Main Index
      </div>
      <div className="mt-1 text-sm font-semibold text-text-primary">{label}</div>
      <div className="mt-auto pt-3">
        <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">
          {formatPrice(data?.last_price ?? null)}
        </div>
        <div
          className={`mt-1 font-mono text-xs ${
            isPositive(data?.change_pct ?? null) ? 'text-positive' : 'text-negative'
          }`}
        >
          {formatPercent(data?.change_pct ?? null)}
        </div>
      </div>
    </div>
  );
}
