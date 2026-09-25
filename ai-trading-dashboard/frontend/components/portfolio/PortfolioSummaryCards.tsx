'use client';

import type { PortfolioSummary } from '@/types/market';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const positive = isPositive(summary.total_unrealized_pnl);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Total Value</div>
        <div className="mt-1 font-mono text-lg font-semibold text-text-primary">
          {formatPrice(summary.total_value)}
        </div>
      </div>
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Total Cost</div>
        <div className="mt-1 font-mono text-lg font-semibold text-text-primary">
          {formatPrice(summary.total_cost)}
        </div>
      </div>
      <div className="rounded border border-border bg-panel p-3">
        <div className="text-xs text-text-muted">Unrealized P&amp;L</div>
        <div
          className={`mt-1 font-mono text-lg font-semibold ${
            positive ? 'text-positive' : 'text-negative'
          }`}
        >
          {formatPrice(summary.total_unrealized_pnl)} (
          {formatPercent(summary.total_unrealized_pnl_pct)})
        </div>
      </div>
    </div>
  );
}
