'use client';

import { QuoteSnapshot } from '@/types/market';
import { formatChange, formatPercent, formatPrice, isPositive } from '@/lib/format';

interface WatchlistTableProps {
  quotes: QuoteSnapshot[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  loading: boolean;
}

export function WatchlistTable({
  quotes,
  selectedSymbol,
  onSelectSymbol,
  loading,
}: WatchlistTableProps) {
  if (loading && quotes.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-muted">
        Memuat data...
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-text-muted">
        Watchlist kosong. Tambahkan simbol di sidebar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-panel text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-3 py-2 font-medium">Simbol</th>
            <th className="px-3 py-2 font-medium">Nama</th>
            <th className="px-3 py-2 text-right font-medium">Harga</th>
            <th className="px-3 py-2 text-right font-medium">Perubahan</th>
            <th className="px-3 py-2 text-right font-medium">%</th>
            <th className="px-3 py-2 text-right font-medium">Mkt Cap</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const positive = isPositive(q.change);
            const selected = q.symbol === selectedSymbol;
            return (
              <tr
                key={q.symbol}
                onClick={() => onSelectSymbol(q.symbol)}
                className={`cursor-pointer border-b border-border-muted last:border-0 ${
                  selected ? 'bg-panel-hover' : 'bg-canvas hover:bg-panel'
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs font-medium text-text-primary">
                  {q.symbol}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-xs text-text-secondary">
                  {q.name}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-text-primary">
                  {formatPrice(q.last_price)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono text-xs tabular-nums ${
                    positive ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatChange(q.change)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono text-xs tabular-nums ${
                    positive ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPercent(q.change_pct)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-text-secondary">
                  {q.market_cap != null
                    ? q.market_cap >= 1e12
                      ? `${(q.market_cap / 1e12).toFixed(2)}T`
                      : q.market_cap >= 1e9
                        ? `${(q.market_cap / 1e9).toFixed(2)}B`
                        : q.market_cap >= 1e6
                          ? `${(q.market_cap / 1e6).toFixed(1)}M`
                          : q.market_cap.toFixed(0)
                    : '—'}
                </td>
                <td className="px-3 py-2 text-xs text-text-muted">
                  {q.market_state || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
