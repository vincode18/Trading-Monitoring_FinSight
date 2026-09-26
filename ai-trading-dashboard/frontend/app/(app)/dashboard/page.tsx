'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { useMarket } from '@/lib/market-context';
import { MarketTabs } from '@/components/dashboard/MarketTabs';
import { IndexHeroCard } from '@/components/dashboard/IndexHeroCard';
import { ForexStrip } from '@/components/dashboard/ForexStrip';
import { SentimentGauge } from '@/components/dashboard/SentimentGauge';
import { MetricsStrip } from '@/components/dashboard/MetricsStrip';
import { MarketOverviewChart } from '@/components/dashboard/MarketOverviewChart';
import { SectorHeatmap } from '@/components/dashboard/SectorHeatmap';
import { MoversPanel } from '@/components/dashboard/MoversPanel';
import { CryptoSnapshotTable } from '@/components/dashboard/CryptoSnapshotTable';
import { MACrossAlerts } from '@/components/dashboard/MACrossAlerts';
import { EarningsCalendar } from '@/components/dashboard/EarningsCalendar';
import { NewsCard } from '@/components/news/NewsCard';
import { formatPercent, isPositive } from '@/lib/format';

export default function DashboardPage() {
  const { watchlist } = useWatchlist();
  const { selectedMarket, config } = useMarket();

  // v1.1 §5: movers WAJIB dari pool market saja — bukan gabungan watchlist
  const moverSymbols = [...config.moverPoolSymbols];

  const { data: quotes, isLoading } = useSWR(
    watchlist.length ? ['dash-quotes', watchlist] : null,
    () => api.getWatchlistQuotes(watchlist),
    { refreshInterval: 30_000 }
  );

  const { data: summary } = useSWR(
    selectedMarket === 'crypto' ? 'market-summary' : null,
    () => api.getMarketSummary(),
    { refreshInterval: 60_000 }
  );
  const { data: fearGreed } = useSWR(
    selectedMarket === 'crypto' ? 'fear-greed' : null,
    () => api.getFearGreed()
  );
  const { data: indexQuote } = useSWR(
    ['dash-index', config.mainIndex.symbol],
    () => api.getQuote(config.mainIndex.symbol),
    { refreshInterval: 45_000 }
  );

  const { data: news } = useSWR(
    ['dash-news-market', selectedMarket],
    () => api.getMarketNews(selectedMarket, 6),
    { refreshInterval: 60_000 }
  );

  return (
    <div className="w-full space-y-5 px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Market summary before you drill into symbol detail.
          </p>
        </div>
        <Link
          href="/watchlist"
          className="rounded-md bg-positive px-3 py-2 text-xs font-semibold text-canvas"
        >
          Open Chart
        </Link>
      </div>

      <MarketTabs />

      {/* v1.1 §3: equal-height stretch */}
      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 sm:col-span-4">
          <IndexHeroCard symbol={config.mainIndex.symbol} label={config.mainIndex.label} />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <ForexStrip pairs={[...config.forexPairs]} />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <SentimentGauge symbol={config.mainIndex.symbol} />
        </div>
      </div>

      <MetricsStrip
        market={selectedMarket}
        summary={summary}
        fearGreed={fearGreed}
        indexQuote={indexQuote}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7">
          <MarketOverviewChart
            symbol={config.mainIndex.symbol}
            label={config.mainIndex.label}
          />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <SectorHeatmap market={selectedMarket} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <MoversPanel symbols={moverSymbols} market={selectedMarket} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <div className="rounded-md border border-border bg-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-h2 text-text-primary">Recent News</h2>
              <span className="text-[10px] uppercase tracking-wide text-text-muted">
                {config.label}
              </span>
            </div>
            <div className="space-y-2">
              {(news ?? []).slice(0, 4).map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
              {!news?.length && (
                <p className="py-8 text-center text-xs text-text-muted">No news yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <MACrossAlerts symbols={moverSymbols} market={selectedMarket} />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <EarningsCalendar market={selectedMarket} />
        </div>
      </div>

      {selectedMarket === 'crypto' && <CryptoSnapshotTable quotes={quotes ?? []} />}

      {quotes && quotes.length > 0 && (
        <div className="rounded-md border border-border bg-panel p-4">
          <h2 className="text-h2 text-text-primary">Your Watchlist Snapshot</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quotes.slice(0, 12).map((q) => (
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

      {isLoading && !quotes && (
        <p className="text-center text-xs text-text-muted">Loading watchlist...</p>
      )}

      <p className="max-w-3xl text-[10px] leading-relaxed text-text-muted">
        Disclaimer: The FinSight dashboard is a market research tool, not licensed financial
        advice. Market Sentiment Score, movers, and MA Cross show internal facts/calculations —
        not buy or sell recommendations.
      </p>
    </div>
  );
}
