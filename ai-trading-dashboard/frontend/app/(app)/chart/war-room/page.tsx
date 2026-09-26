'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { MiniCandlestickChart } from '@/components/chart/MiniCandlestickChart';
import { TimeframeToolbar } from '@/components/chart/TimeframeToolbar';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

const STORAGE_KEY = 'finsight-warroom-symbols';
const MAX_SYMBOLS = 6;

function WarRoomCell({
  symbol,
  period,
  interval,
}: {
  symbol: string;
  period: string;
  interval: string;
}) {
  const { data: chartData, isLoading } = useSWR(
    ['war-room-chart', symbol, period, interval],
    () => api.getChart(symbol, period, interval),
    { refreshInterval: 30_000 }
  );
  const { data: quote } = useSWR(
    ['war-room-quote', symbol],
    () => api.getQuote(symbol),
    { refreshInterval: 30_000 }
  );

  return (
    <Link
      href={`/chart/${encodeURIComponent(symbol)}`}
      className="block min-w-0 overflow-hidden rounded-md border border-border bg-panel p-2 transition-colors hover:border-positive/40"
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-text-primary">{symbol}</span>
        {quote && (
          <span
            className={`font-mono text-[11px] tabular-nums ${
              isPositive(quote.change_pct) ? 'text-positive' : 'text-negative'
            }`}
          >
            {formatPrice(quote.last_price)} ({formatPercent(quote.change_pct)})
          </span>
        )}
      </div>
      {isLoading && !chartData && (
        <div className="flex h-[180px] items-center justify-center text-xs text-text-muted">
          Loading...
        </div>
      )}
      {chartData && <MiniCandlestickChart data={chartData} />}
    </Link>
  );
}

export default function WarRoomPage() {
  const { watchlist } = useWatchlist();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [period, setPeriod] = useState('6mo');
  const [interval, setInterval] = useState('1d');
  const [showBollinger, setShowBollinger] = useState(false);
  const [showMa, setShowMa] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length) {
          setSymbols(parsed.slice(0, MAX_SYMBOLS));
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setSymbols(watchlist.slice(0, Math.min(4, MAX_SYMBOLS)));
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    } catch {
      /* ignore */
    }
  }, [symbols]);

  function addSymbol(symbol: string) {
    const s = symbol.trim().toUpperCase();
    if (!s || symbols.includes(s) || symbols.length >= MAX_SYMBOLS) return;
    setSymbols((prev) => [...prev, s]);
    setQuery('');
  }

  function removeSymbol(symbol: string) {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  }

  return (
    <div className="w-full space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">War Room</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Monitor up to {MAX_SYMBOLS} symbols at once — click a panel for the full chart.
          </p>
        </div>
        <Link
          href="/chart"
          className="rounded border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-positive/40 hover:text-positive"
        >
          ← Single Chart
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => removeSymbol(s)}
            className="rounded border border-border bg-panel px-2 py-1 font-mono text-[11px] text-text-primary hover:border-negative/40"
            title="Remove from War Room"
          >
            {s} ×
          </button>
        ))}
        {symbols.length < MAX_SYMBOLS && (
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              addSymbol(query);
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              list="warroom-watchlist"
              placeholder="Add symbol..."
              className="rounded border border-border bg-panel px-2 py-1 font-mono text-xs"
            />
            <datalist id="warroom-watchlist">
              {watchlist.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button
              type="submit"
              className="rounded bg-positive px-2 py-1 text-xs font-semibold text-canvas"
            >
              Add
            </button>
          </form>
        )}
        <span className="text-[10px] text-text-muted">
          {symbols.length}/{MAX_SYMBOLS}
        </span>
      </div>

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

      {!symbols.length && (
        <p className="py-12 text-center text-xs text-text-muted">
          Add symbols from your watchlist to start War Room.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {symbols.map((s) => (
          <WarRoomCell key={s} symbol={s} period={period} interval={interval} />
        ))}
      </div>
    </div>
  );
}
