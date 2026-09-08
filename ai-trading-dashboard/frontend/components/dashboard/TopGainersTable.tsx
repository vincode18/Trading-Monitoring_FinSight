'use client';

import Link from 'next/link';
import type { QuoteSnapshot } from '@/types/market';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function TopGainersTable({ quotes, loading }: { quotes: QuoteSnapshot[]; loading: boolean }) {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h2 className="text-h2 text-text-primary">Top Gainers</h2>
      <div className="mt-3 space-y-1">
        {loading && !quotes.length && (
          <p className="py-6 text-center text-xs text-text-muted">Memuat...</p>
        )}
        {quotes.map((q) => (
          <Link
            key={q.symbol}
            href={`/chart/${encodeURIComponent(q.symbol)}`}
            className="flex items-center justify-between rounded px-2 py-2 hover:bg-panel-hover"
          >
            <div>
              <div className="font-mono text-xs text-text-primary">{q.symbol}</div>
              <div className="max-w-[140px] truncate text-[10px] text-text-muted">{q.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-text-primary">{formatPrice(q.last_price)}</div>
              <div
                className={`font-mono text-[10px] ${
                  isPositive(q.change_pct) ? 'text-positive' : 'text-negative'
                }`}
              >
                {formatPercent(q.change_pct)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
