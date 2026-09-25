'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import type { MarketId } from '@/lib/marketConfig';

function companyInitials(name: string | null | undefined, symbol: string) {
  const src = (name || symbol).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function EarningsCalendar({ market }: { market: MarketId }) {
  const { watchlist } = useWatchlist();
  const hidden = market === 'crypto';

  const { data, isLoading } = useSWR(
    hidden ? null : ['earnings-card', market, watchlist.join(',')],
    () =>
      api.getMarketEarningsCalendar({
        market,
        daysAhead: 7,
        limit: 5,
        onlyUnreported: true,
        watchlist,
      }),
    { refreshInterval: 300_000 }
  );

  if (hidden) {
    return (
      <div className="rounded-md border border-border bg-panel p-4">
        <h2 className="text-h2 text-text-primary">Earnings Calendar</h2>
        <p className="mt-3 text-xs text-text-muted">
          Earnings are not relevant for the Crypto tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-border bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-h2 text-text-primary">Earnings Calendar</h2>
          <p className="mt-1 text-[10px] text-text-muted">Next 7 days · not yet reported</p>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {isLoading && !data && (
          <p className="py-6 text-center text-xs text-text-muted">Loading...</p>
        )}
        {!isLoading && !data?.length && (
          <p className="py-6 text-center text-xs text-text-muted">
            No earnings scheduled in the next 7 days.
          </p>
        )}
        {(data ?? []).map((e) => (
          <Link
            key={`${e.symbol}-${e.earnings_date}`}
            href={`/analysis/${encodeURIComponent(e.symbol)}`}
            className="flex items-center gap-3 rounded border border-border-muted px-3 py-2 hover:border-positive/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-border-muted text-[10px] font-semibold text-positive">
              {companyInitials(e.company_name, e.symbol)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-primary">{e.symbol}</span>
                {e.is_watchlist && (
                  <span className="rounded-sm bg-positive/15 px-1 py-0.5 text-[9px] uppercase text-positive">
                    WL
                  </span>
                )}
              </div>
              <div className="truncate text-[10px] text-text-muted">
                {e.company_name || e.event_name || '—'}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] text-text-secondary">{formatShortDate(e.earnings_date)}</div>
              {e.timing && (
                <div className="mt-0.5 text-[9px] uppercase tracking-wide text-text-muted">
                  {e.timing}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/analysis/earnings-calendar"
        className="mt-4 block rounded border border-border bg-canvas px-3 py-2 text-center text-xs font-medium text-text-secondary transition-colors hover:border-positive/40 hover:text-positive"
      >
        More Details
      </Link>
    </div>
  );
}
