'use client';

import type { Holding } from '@/types/market';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';
import { api } from '@/lib/api';

export function HoldingsTable({
  holdings,
  onChanged,
}: {
  holdings: Holding[];
  onChanged: () => void;
}) {
  async function remove(id: string) {
    await api.deleteHolding(id);
    onChanged();
  }

  if (!holdings.length) {
    return (
      <p className="py-8 text-center text-xs text-text-muted">
        No holdings yet. Add a manual position to start tracking.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-panel text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Symbol</th>
            <th className="px-3 py-2 font-medium">Qty</th>
            <th className="px-3 py-2 font-medium">Avg Buy</th>
            <th className="px-3 py-2 font-medium">Last</th>
            <th className="px-3 py-2 font-medium">Market Value</th>
            <th className="px-3 py-2 font-medium">P&amp;L</th>
            <th className="px-3 py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const up = isPositive(h.unrealized_pnl);
            return (
              <tr key={h.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-mono font-semibold text-text-primary">
                  {h.symbol}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-text-secondary">
                  {h.quantity}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-text-secondary">
                  {formatPrice(h.avg_buy_price)}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-text-secondary">
                  {formatPrice(h.current_price)}
                </td>
                <td className="px-3 py-2 font-mono tabular-nums text-text-secondary">
                  {formatPrice(h.market_value)}
                </td>
                <td
                  className={`px-3 py-2 font-mono tabular-nums ${
                    up ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPrice(h.unrealized_pnl)} ({formatPercent(h.unrealized_pnl_pct)})
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => remove(h.id)}
                    className="text-xs text-negative hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
