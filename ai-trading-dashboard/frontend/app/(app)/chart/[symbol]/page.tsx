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
import { formatPrice } from '@/lib/format';

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
    if (!paramSymbol && symbol) {
      router.replace(`/chart/${encodeURIComponent(symbol)}`);
    }
    if (paramSymbol) setSelectedSymbol(paramSymbol);
  }, [paramSymbol, symbol, router, setSelectedSymbol]);

  const { data: quotes } = useSWR(
    symbol ? ['chart-quote', symbol] : null,
    () => api.getWatchlistQuotes([symbol as string]),
    { refreshInterval: 30_000 }
  );
  const quote = quotes?.[0] ?? null;

  const { data: chartData, isLoading } = useSWR(
    symbol ? ['chart', symbol, period, interval] : null,
    () => api.getChart(symbol as string, period, interval),
    { refreshInterval: 30_000 }
  );

  const lastInd = chartData?.indicators?.[chartData.indicators.length - 1];

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Chart</h1>
          <select
            className="mt-2 rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs text-text-primary"
            value={symbol ?? ''}
            onChange={(e) => router.push(`/chart/${encodeURIComponent(e.target.value)}`)}
          >
            {watchlist.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {lastInd && (
          <div className="flex gap-4 rounded-md border border-border bg-panel px-4 py-2 text-xs">
            <div>
              <span className="text-text-muted">MA50 </span>
              <span className="font-mono text-text-primary">{formatPrice(lastInd.ma50)}</span>
            </div>
            <div>
              <span className="text-text-muted">MA200 </span>
              <span className="font-mono text-text-primary">
                {formatPrice(lastInd.ma200 ?? null)}
              </span>
            </div>
          </div>
        )}
      </div>

      {symbol && <SymbolHeader quote={quote} loading={!quote} />}

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
          Memuat grafik...
        </div>
      )}
      {chartData && (
        <>
          <CandlestickChart data={chartData} showBollinger={showBollinger} showMa={showMa} />
          <SignalSummary summary={chartData.signal_summary} />
        </>
      )}

      <p className="text-[10px] text-text-muted">
        Charting by TradingView Lightweight Charts. Bukan nasihat keuangan.
      </p>
    </div>
  );
}
