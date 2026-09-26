'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { SymbolHeader } from '@/components/SymbolHeader';
import { CandlestickChart } from '@/components/CandlestickChart';
import { SignalSummary } from '@/components/SignalSummary';
import { TimeframeToolbar } from '@/components/chart/TimeframeToolbar';
import { GlobalSearchTrigger } from '@/components/GlobalSearch/GlobalSearchTrigger';
import Link from 'next/link';

export default function ChartPage() {
  const params = useParams();
  const router = useRouter();
  const paramSymbol = typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : null;
  const { watchlist, selectedSymbol, setSelectedSymbol } = useWatchlist();

  const symbol = paramSymbol || selectedSymbol || watchlist[0] || null;
  const [period, setPeriod] = useState('6mo');
  const [interval, setInterval] = useState('1d');
  const [showBollinger, setShowBollinger] = useState(false);
  const [showMa, setShowMa] = useState(true);

  useEffect(() => {
    if (paramSymbol?.toLowerCase() === 'war-room') {
      router.replace('/chart/war-room');
      return;
    }
    if (!paramSymbol && symbol) {
      router.replace(`/chart/${encodeURIComponent(symbol)}`);
    }
    if (paramSymbol) setSelectedSymbol(paramSymbol);
  }, [paramSymbol, symbol, router, setSelectedSymbol]);

  if (paramSymbol?.toLowerCase() === 'war-room') {
    return null;
  }

  const { data: quotes } = useSWR(
    symbol ? ['chart-quote', symbol] : null,
    () => api.getWatchlistQuotes([symbol as string]),
    { refreshInterval: 30_000 }
  );
  const quote = quotes?.[0] ?? null;

  const { data: chartData, error, isLoading } = useSWR(
    symbol ? ['chart', symbol, period, interval] : null,
    () => api.getChart(symbol as string, period, interval),
    { refreshInterval: 30_000 }
  );
  return (
    <div className="w-full space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 text-text-primary">Chart</h1>
        <Link
          href="/chart/war-room"
          className="rounded border border-border bg-panel px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-positive/40 hover:text-positive"
        >
          ⊞ War Room
        </Link>
      </div>

      <GlobalSearchTrigger variant="wide" />

      {symbol && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SymbolHeader quote={quote} loading={!quote} />
          <Link
            href={`/analysis/overview?symbol=${encodeURIComponent(symbol)}`}
            className="rounded border border-border bg-panel px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-positive/40 hover:text-positive"
          >
            Analysis Detail →
          </Link>
        </div>
      )}

      <TimeframeToolbar
        period={period}
        onPeriodChange={(p, i) => {
          setPeriod(p);
          setInterval(i);
        }}
        showBollinger={showBollinger}
        showMa={showMa}
        onToggleBollinger={() => setShowBollinger((v) => !v)}
        onToggleMa={() => setShowMa((v) => !v)}
      />

      {isLoading && !chartData && (
        <div className="flex h-64 items-center justify-center text-sm text-text-muted">
          Loading chart...
        </div>
      )}
      {error && !chartData && (
        <p className="rounded border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
          Failed to load chart data for this period.
        </p>
      )}
      {chartData && (
        <>
          <CandlestickChart data={chartData} showBollinger={showBollinger} showMa={showMa} />
          <SignalSummary summary={chartData.signal_summary} />
        </>
      )}

      <p className="text-[10px] text-text-muted">
        Charting by TradingView Lightweight Charts.
      </p>
    </div>
  );
}
