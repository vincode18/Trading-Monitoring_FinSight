'use client';

import Link from 'next/link';
import type { EarningsCalendarItem } from '@/types/market';

function initials(name: string | null | undefined, symbol: string) {
  const src = (name || symbol).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function fmtCap(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function surpriseOf(e: EarningsCalendarItem) {
  if (e.reported_eps == null || e.eps_estimate == null) return null;
  return e.reported_eps - e.eps_estimate;
}

export function EarningsListView({ items }: { items: EarningsCalendarItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-full text-left text-xs">
        <thead className="border-b border-border bg-panel text-[10px] uppercase tracking-wide text-text-muted">
          <tr>
            <th className="px-3 py-2.5 font-medium">Company</th>
            <th className="px-3 py-2.5 font-medium">Date</th>
            <th className="px-3 py-2.5 font-medium">Time</th>
            <th className="px-3 py-2.5 font-medium">Market Cap</th>
            <th className="px-3 py-2.5 font-medium">Expected EPS</th>
            <th className="px-3 py-2.5 font-medium">Actual EPS</th>
            <th className="px-3 py-2.5 font-medium">Surprise</th>
            <th className="px-3 py-2.5 font-medium">Surprise %</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => {
            const surprise = surpriseOf(e);
            const surprisePct =
              e.surprise_pct ??
              (surprise != null && e.eps_estimate
                ? (surprise / Math.abs(e.eps_estimate)) * 100
                : null);
            return (
              <tr
                key={`${e.symbol}-${e.earnings_date}`}
                className="border-b border-border-muted last:border-0 hover:bg-panel-hover"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/analysis/${encodeURIComponent(e.symbol)}`}
                    className="flex items-center gap-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-border-muted text-[10px] font-semibold text-positive">
                      {initials(e.company_name, e.symbol)}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-text-primary">{e.symbol}</span>
                      <span className="block truncate text-[10px] text-text-muted">
                        {e.company_name || '—'}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 font-mono text-text-secondary">{fmtDate(e.earnings_date)}</td>
                <td className="px-3 py-2.5">
                  {e.timing ? (
                    <span className="rounded-sm bg-border-muted px-1.5 py-0.5 text-[10px] text-text-secondary">
                      {e.timing}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2.5 font-mono text-text-secondary">{fmtCap(e.market_cap)}</td>
                <td className="px-3 py-2.5 font-mono text-text-secondary">{fmtNum(e.eps_estimate)}</td>
                <td className="px-3 py-2.5 font-mono text-text-secondary">{fmtNum(e.reported_eps)}</td>
                <td
                  className={`px-3 py-2.5 font-mono ${
                    surprise == null
                      ? 'text-text-muted'
                      : surprise >= 0
                        ? 'text-positive'
                        : 'text-negative'
                  }`}
                >
                  {fmtNum(surprise)}
                </td>
                <td
                  className={`px-3 py-2.5 font-mono ${
                    surprisePct == null
                      ? 'text-text-muted'
                      : surprisePct >= 0
                        ? 'text-positive'
                        : 'text-negative'
                  }`}
                >
                  {surprisePct == null ? '—' : `${surprisePct >= 0 ? '+' : ''}${surprisePct.toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
          {!items.length && (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-text-muted">
                No earnings data for this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
