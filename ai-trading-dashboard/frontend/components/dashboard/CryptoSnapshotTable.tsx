'use client';

import Link from 'next/link';
import type { QuoteSnapshot } from '@/types/market';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function CryptoSnapshotTable({ quotes }: { quotes: QuoteSnapshot[] }) {
  const crypto = quotes.filter(
    (q) => q.symbol.includes('-USD') || ['BTC-USD', 'ETH-USD'].includes(q.symbol)
  );

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h2 className="text-h2 text-text-primary">Cryptocurrency</h2>
      <div className="mt-3 overflow-hidden rounded border border-border-muted">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-muted text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {(crypto.length ? crypto : quotes.slice(0, 5)).map((q) => (
              <tr key={q.symbol} className="border-b border-border-muted last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/chart/${encodeURIComponent(q.symbol)}`} className="font-mono text-text-primary hover:text-positive">
                    {q.symbol}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatPrice(q.last_price)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono tabular-nums ${
                    isPositive(q.change_pct) ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPercent(q.change_pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
