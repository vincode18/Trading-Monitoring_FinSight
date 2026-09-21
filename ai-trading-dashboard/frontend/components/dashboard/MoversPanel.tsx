'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

type Tab = 'gainers' | 'losers' | 'volume';

export function MoversPanel({ symbols, market }: { symbols: string[]; market: string }) {
  const [tab, setTab] = useState<Tab>('gainers');

  const { data: gainers, isLoading: gLoad } = useSWR(
    symbols.length && tab === 'gainers' ? ['movers-g', market, symbols.join(',')] : null,
    () => api.getTopGainers(symbols, 5, 'desc'),
    { refreshInterval: 30_000 }
  );
  const { data: losers, isLoading: lLoad } = useSWR(
    symbols.length && tab === 'losers' ? ['movers-l', market, symbols.join(',')] : null,
    () => api.getTopGainers(symbols, 5, 'asc'),
    { refreshInterval: 30_000 }
  );
  const { data: volume, isLoading: vLoad } = useSWR(
    symbols.length && tab === 'volume' ? ['movers-v', market, symbols.join(',')] : null,
    () => api.getVolumeMovers(symbols, 8),
    { refreshInterval: 60_000 }
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: 'gainers', label: 'Gainers' },
    { id: 'losers', label: 'Losers' },
    { id: 'volume', label: 'Volume' },
  ];

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h2 text-text-primary">Market Movers</h2>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded px-2 py-1 text-[10px] font-semibold ${
                tab === t.id
                  ? 'bg-positive text-canvas'
                  : 'bg-canvas text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'volume' && (
        <div className="space-y-1">
          {(tab === 'gainers' ? gLoad : lLoad) && !(tab === 'gainers' ? gainers : losers)?.length && (
            <p className="py-6 text-center text-xs text-text-muted">Memuat...</p>
          )}
          {(tab === 'gainers' ? gainers : losers)?.map((q) => (
            <Link
              key={q.symbol}
              href={`/chart/${encodeURIComponent(q.symbol)}`}
              className="flex items-center justify-between rounded px-2 py-2 hover:bg-panel-hover"
            >
              <div>
                <div className="font-mono text-xs text-text-primary">{q.symbol}</div>
                <div className="max-w-[140px] truncate text-[10px] text-text-muted">{q.name}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-text-primary">{formatPrice(q.last_price)}</div>
                <div
                  className={`font-mono text-[10px] ${
                    isPositive(q.change_pct) ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPercent(q.change_pct)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'volume' && (
        <div className="space-y-1">
          {vLoad && !volume?.length && (
            <p className="py-6 text-center text-xs text-text-muted">Memuat...</p>
          )}
          {!vLoad && !volume?.length && (
            <p className="py-6 text-center text-xs text-text-muted">
              Tidak ada simbol dengan rasio volume ≥ 1.5×.
            </p>
          )}
          {volume?.map((v) => (
            <Link
              key={v.symbol}
              href={`/chart/${encodeURIComponent(v.symbol)}`}
              className="flex items-center justify-between rounded px-2 py-2 hover:bg-panel-hover"
            >
              <div className="font-mono text-xs text-text-primary">{v.symbol}</div>
              <div className="text-right">
                <div className="font-mono text-xs text-positive">{v.volume_ratio.toFixed(2)}×</div>
                <div
                  className={`font-mono text-[10px] ${
                    isPositive(v.change_pct) ? 'text-positive' : 'text-negative'
                  }`}
                >
                  {formatPercent(v.change_pct)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
