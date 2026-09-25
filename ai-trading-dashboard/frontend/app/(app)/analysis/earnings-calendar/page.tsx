'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { useMarket } from '@/lib/market-context';
import type { MarketId } from '@/lib/marketConfig';
import { EarningsListView } from '@/components/analysis/EarningsListView';
import { EarningsCalendarGridView } from '@/components/analysis/EarningsCalendarGridView';

type ViewMode = 'list' | 'calendar';
type QuickRange = 'yesterday' | 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'custom';

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setDate(x.getDate() + diff);
  return x;
}

function rangeFor(quick: QuickRange, customStart: string, customEnd: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (quick === 'custom') {
    return {
      start: customStart || ymd(today),
      end: customEnd || ymd(new Date(today.getTime() + 7 * 86400000)),
    };
  }
  if (quick === 'yesterday') {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { start: ymd(y), end: ymd(y) };
  }
  if (quick === 'today') return { start: ymd(today), end: ymd(today) };
  if (quick === 'tomorrow') {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return { start: ymd(t), end: ymd(t) };
  }
  if (quick === 'next_week') {
    const s = startOfWeek(today);
    s.setDate(s.getDate() + 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return { start: ymd(s), end: ymd(e) };
  }
  // this_week
  const s = startOfWeek(today);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return { start: ymd(s), end: ymd(e) };
}

const QUICK: { id: QuickRange; label: string }[] = [
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
  { id: 'next_week', label: 'Next Week' },
];

const MARKETS: { id: MarketId; label: string }[] = [
  { id: 'us', label: 'US' },
  { id: 'indonesia', label: 'Indonesia' },
];

export default function EarningsCalendarPage() {
  const { watchlist } = useWatchlist();
  const { selectedMarket } = useMarket();
  const [market, setMarket] = useState<MarketId>(
    selectedMarket === 'crypto' ? 'us' : selectedMarket
  );
  const [view, setView] = useState<ViewMode>('list');
  const [quick, setQuick] = useState<QuickRange>('this_week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');

  const { start, end } = useMemo(
    () => rangeFor(quick, customStart, customEnd),
    [quick, customStart, customEnd]
  );

  const { data, isLoading, error } = useSWR(
    ['earnings-detail', market, start, end],
    () =>
      api.getMarketEarningsCalendar({
        market,
        start,
        end,
        limit: 100,
        onlyUnreported: false,
        watchlist,
      }),
    { refreshInterval: 300_000 }
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (e) =>
        e.symbol.toLowerCase().includes(q) ||
        (e.company_name || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Earnings Calendar</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Earnings calendar — stay ahead of market moves.
          </p>
        </div>
        <div className="flex gap-1 rounded border border-border p-0.5">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`rounded px-3 py-1.5 text-xs ${
              view === 'list'
                ? 'bg-panel-hover font-medium text-positive'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            List View
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`rounded px-3 py-1.5 text-xs ${
              view === 'calendar'
                ? 'bg-panel-hover font-medium text-positive'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Calendar View
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MARKETS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMarket(m.id)}
            className={`rounded px-3 py-1.5 text-xs ${
              market === m.id
                ? 'bg-positive font-medium text-canvas'
                : 'border border-border bg-panel text-text-secondary hover:text-text-primary'
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-border" />
        {QUICK.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setQuick(q.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              quick === q.id
                ? 'border-positive/50 bg-positive/10 text-positive'
                : 'border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setQuick('custom')}
          className={`rounded-full border px-3 py-1 text-xs ${
            quick === 'custom'
              ? 'border-positive/50 bg-positive/10 text-positive'
              : 'border-border text-text-secondary hover:text-text-primary'
          }`}
        >
          Custom
        </button>
      </div>

      {quick === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] text-text-muted">
            From
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="ml-2 rounded border border-border bg-panel px-2 py-1 text-xs text-text-primary"
            />
          </label>
          <label className="text-[10px] text-text-muted">
            To
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="ml-2 rounded border border-border bg-panel px-2 py-1 text-xs text-text-primary"
            />
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol or company..."
          className="w-full max-w-sm rounded border border-border bg-panel px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-positive focus:outline-none"
        />
        <span className="text-[10px] text-text-muted">
          {filtered.length} hasil · {start} → {end}
        </span>
      </div>

      {error && (
        <p className="rounded border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
          Failed to load earnings calendar.
        </p>
      )}
      {isLoading && !data && (
        <p className="py-12 text-center text-xs text-text-muted">Loading earnings...</p>
      )}

      {!isLoading && view === 'list' && <EarningsListView items={filtered} />}
      {!isLoading && view === 'calendar' && (
        <EarningsCalendarGridView items={filtered} rangeStart={start} rangeEnd={end} />
      )}

      <p className="text-[10px] text-text-muted">
        Market data from third-party providers — not financial advice. Indonesia uses a
        per-symbol path (IDX is not covered by market-wide calendars yet).
      </p>
    </div>
  );
}
