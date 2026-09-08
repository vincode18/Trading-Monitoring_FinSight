'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { formatPercent, isPositive } from '@/lib/format';

const LABELS: Record<string, string> = {
  '^GSPC': 'S&P 500',
  '^DJI': 'DOW 30',
  '^IXIC': 'NASDAQ',
  'BTC-USD': 'BTCUSD',
};

export function TickerBar() {
  const { data } = useSWR('market-overview', () => api.getOverview(), {
    refreshInterval: 45_000,
  });

  return (
    <div className="flex h-10 items-center gap-6 overflow-x-auto border-b border-border bg-panel px-4">
      {(data ?? []).map((q) => {
        const up = isPositive(q.change_pct);
        return (
          <div key={q.symbol} className="flex shrink-0 items-center gap-2 text-xs">
            <span className="font-medium text-text-secondary">
              {LABELS[q.symbol] ?? q.symbol}
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
      {!data && (
        <span className="animate-pulse-soft text-xs text-text-muted">Memuat ticker...</span>
      )}
    </div>
  );
}
