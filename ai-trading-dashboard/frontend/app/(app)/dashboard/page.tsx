'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { MarketOverviewChart } from '@/components/dashboard/MarketOverviewChart';
import { TopGainersTable } from '@/components/dashboard/TopGainersTable';
import { MetricsStrip } from '@/components/dashboard/MetricsStrip';
import { CryptoSnapshotTable } from '@/components/dashboard/CryptoSnapshotTable';
import { NewsCard } from '@/components/news/NewsCard';
import { formatPercent, isPositive } from '@/lib/format';

export default function DashboardPage() {
  const { watchlist, selectedSymbol } = useWatchlist();

  const { data: quotes, isLoading } = useSWR(
    watchlist.length ? ['dash-quotes', watchlist] : null,
    () => api.getWatchlistQuotes(watchlist),
    { refreshInterval: 30_000 }
  );

  const { data: gainers } = useSWR(
    watchlist.length ? ['top-gainers', watchlist] : null,
    () => api.getTopGainers(watchlist, 5),
    { refreshInterval: 30_000 }
  );

  const { data: summary } = useSWR('market-summary', () => api.getMarketSummary(), {
    refreshInterval: 60_000,
  });
  const { data: fearGreed } = useSWR('fear-greed', () => api.getFearGreed());

  const newsSymbol = selectedSymbol || watchlist[0] || 'AAPL';
  const { data: news } = useSWR(['dash-news', newsSymbol], () => api.getNews(newsSymbol));

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Ringkasan pasar sebelum masuk ke detail simbol.
          </p>
        </div>
        <Link
          href={selectedSymbol ? `/chart/${encodeURIComponent(selectedSymbol)}` : '/watchlist'}
          className="rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas"
        >
          Open Chart
        </Link>
      </div>

      <MetricsStrip summary={summary} fearGreed={fearGreed} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MarketOverviewChart />
        </div>
        <TopGainersTable quotes={gainers ?? []} loading={!gainers && isLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CryptoSnapshotTable quotes={quotes ?? []} />
        <div className="rounded-md border border-border bg-panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-h2 text-text-primary">Recent News</h2>
            <Link href="/news" className="text-xs text-positive hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {(news ?? []).slice(0, 3).map((item, i) => (
              <NewsCard key={i} item={item} />
            ))}
            {!news?.length && (
              <p className="py-8 text-center text-xs text-text-muted">Belum ada berita.</p>
            )}
          </div>
        </div>
      </div>

      {quotes && quotes.length > 0 && (
        <div className="rounded-md border border-border bg-panel p-4">
          <h2 className="text-h2 text-text-primary">Your Watchlist Snapshot</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quotes.slice(0, 8).map((q) => (
              <Link
                key={q.symbol}
                href={`/analysis/${encodeURIComponent(q.symbol)}`}
                className="rounded border border-border-muted bg-canvas px-3 py-2 hover:border-positive/40"
              >
                <div className="font-mono text-xs text-text-primary">{q.symbol}</div>
                <div
                  className={`font-mono text-[10px] ${
                    isPositive(q.change_pct) ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPercent(q.change_pct)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-text-muted">
        Disclaimer: Dashboard ini alat bantu riset, bukan nasihat keuangan.
      </p>
    </div>
  );
}
