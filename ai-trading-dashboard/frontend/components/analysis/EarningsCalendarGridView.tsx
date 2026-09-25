'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { EarningsCalendarItem } from '@/types/market';

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initials(name: string | null | undefined, symbol: string) {
  const src = (name || symbol).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function EarningsCalendarGridView({
  items,
  rangeStart,
  rangeEnd,
}: {
  items: EarningsCalendarItem[];
  rangeStart: string;
  rangeEnd: string;
}) {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<EarningsCalendarItem | null>(null);

  const days = useMemo(() => {
    const start = addDays(startOfDay(new Date(rangeStart)), offset);
    const endLimit = startOfDay(new Date(rangeEnd));
    const cols: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      if (d > endLimit && offset === 0 && i > 0) break;
      cols.push(d);
    }
    return cols.length ? cols : [start];
  }, [rangeStart, rangeEnd, offset]);

  const byDay = useMemo(() => {
    const map = new Map<string, EarningsCalendarItem[]>();
    for (const item of items) {
      const k = dayKey(item.earnings_date);
      const list = map.get(k) ?? [];
      list.push(item);
      map.set(k, list);
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 7)}
          className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-panel-hover"
        >
          ‹ Prev
        </button>
        <span className="text-[10px] text-text-muted">
          {days[0]?.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} –{' '}
          {days[days.length - 1]?.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => o + 7)}
          className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-panel-hover"
        >
          Next ›
        </button>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((d) => {
          const key = dayKey(d.toISOString());
          const list = byDay.get(key) ?? [];
          const pre = list.filter((x) => x.timing === 'Pre-Market');
          const after = list.filter((x) => x.timing === 'After-Market');
          const other = list.filter((x) => x.timing !== 'Pre-Market' && x.timing !== 'After-Market');

          return (
            <div key={key} className="min-h-[220px] rounded-md border border-border bg-panel p-2">
              <div className="border-b border-border-muted pb-2">
                <div className="text-[10px] font-medium text-text-primary">
                  {d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="text-[10px] text-text-muted">{list.length} Earnings</div>
              </div>

              {([
                ['Pre-Market', pre],
                ['After-Market', after],
                ['Other', other],
              ] as const).map(([label, group]) =>
                group.length ? (
                  <div key={label} className="mt-2">
                    <div className="mb-1 text-[9px] uppercase tracking-wide text-text-muted">{label}</div>
                    <div className="flex flex-wrap gap-1">
                      {group.map((e) => (
                        <button
                          key={`${e.symbol}-${e.earnings_date}`}
                          type="button"
                          title={`${e.symbol} · ${e.company_name || ''}`}
                          onClick={() => setSelected(e)}
                          className="flex h-8 w-8 items-center justify-center rounded-md bg-border-muted text-[9px] font-semibold text-positive hover:ring-1 hover:ring-positive/50"
                        >
                          {initials(e.company_name, e.symbol)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
              {!list.length && (
                <p className="mt-6 text-center text-[10px] text-text-muted">—</p>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-md border border-border bg-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-sm text-text-primary">{selected.symbol}</div>
              <div className="text-xs text-text-secondary">{selected.company_name || '—'}</div>
              <div className="mt-1 text-[10px] text-text-muted">
                {new Date(selected.earnings_date).toLocaleString('en-US')}
                {selected.timing ? ` · ${selected.timing}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Close
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
            <span>Est EPS: {selected.eps_estimate ?? '—'}</span>
            <span>Actual: {selected.reported_eps ?? '—'}</span>
            <span>Surprise %: {selected.surprise_pct ?? '—'}</span>
          </div>
          <Link
            href={`/analysis/${encodeURIComponent(selected.symbol)}`}
            className="mt-3 inline-block text-xs text-positive hover:underline"
          >
            Open Analysis →
          </Link>
        </div>
      )}
    </div>
  );
}
