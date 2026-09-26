'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useMarket } from '@/lib/market-context';
import { SCREENER_POOLS, defaultScreenerPool, screenerPool, type ScreenerPoolId } from '@/lib/screenerPools';
import type { ScreenResult, StrategyCatalogItem } from '@/types/market';

const TECHNICAL_FALLBACK: StrategyCatalogItem[] = [
  { slug: 'profitunity', name: 'Alligator / Profitunity' },
  { slug: 'ichimoku', name: 'Ichimoku' },
  { slug: 'minervini', name: 'Minervini Trend Template' },
  { slug: 'guppy', name: 'Guppy MMA' },
  { slug: 'turtle', name: 'Turtle System' },
  { slug: 'supertrend', name: 'SuperTrend' },
  { slug: 'heiken-ashi', name: 'Heikin Ashi Trend' },
];

const FUNDAMENTAL_FALLBACK: StrategyCatalogItem[] = [
  { slug: 'minervini-fundamentals', name: 'Minervini Fundamentals' },
  { slug: 'graham-number', name: 'Graham Number Value' },
  { slug: 'dividend-yield', name: 'Dividend Yield' },
  { slug: 'analyst-consensus', name: 'Analyst Consensus' },
];

export function StrategyScreener({ kind }: { kind: 'technical' | 'fundamental' }) {
  const { selectedMarket } = useMarket();
  const fallback = kind === 'technical' ? TECHNICAL_FALLBACK : FUNDAMENTAL_FALLBACK;
  const [slug, setSlug] = useState(fallback[0].slug);
  const [poolId, setPoolId] = useState<ScreenerPoolId>(() => defaultScreenerPool(selectedMarket));
  const [page, setPage] = useState(1);
  const [yieldLimit, setYieldLimit] = useState('2');
  const pageSize = 10;
  const pool = screenerPool(poolId);
  const symbols = pool.symbols;
  const dividend = Number(yieldLimit);
  const minYield = Number.isFinite(dividend) ? dividend : 2;

  const { data: catalog } = useSWR(kind === 'technical' ? 'screen-strategies' : 'fundamental-screen-strategies', () =>
    kind === 'technical' ? api.listScreenStrategies() : api.listFundamentalScreens()
  );
  const options = catalog?.length ? catalog : fallback;
  const activeSlug = options.some((item) => item.slug === slug) ? slug : options[0].slug;

  const canRun = kind === 'technical' || pool.equity;
  const serverPaged = pool.id === 'all';

  const { data, error, isLoading } = useSWR(
    canRun ? ['strategy-screen', kind, activeSlug, pool.id, serverPaged ? page : 'all-rows', minYield] : null,
    () =>
      kind === 'technical'
        ? api.screenStrategy(
            activeSlug,
            symbols,
            serverPaged ? { pool: 'all', page, pageSize } : undefined
          )
        : api.screenFundamental(
            activeSlug,
            symbols,
            minYield,
            serverPaged ? { pool: 'all', page, pageSize } : undefined
          )
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-[10px] uppercase tracking-wide text-text-muted">
          Strategy
          <select
            value={activeSlug}
            onChange={(event) => {
              setSlug(event.target.value);
              setPage(1);
            }}
            className="mt-1 block w-64 rounded border border-border bg-panel px-2 py-1.5 text-xs normal-case tracking-normal text-text-primary"
          >
            {options.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] uppercase tracking-wide text-text-muted">
          Pool
          <select
            value={pool.id}
            onChange={(event) => {
              setPoolId(event.target.value as ScreenerPoolId);
              setPage(1);
            }}
            className="mt-1 block w-52 rounded border border-border bg-panel px-2 py-1.5 text-xs normal-case tracking-normal text-text-primary"
          >
            {SCREENER_POOLS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {kind === 'fundamental' && activeSlug === 'dividend-yield' && (
          <label className="block text-[10px] uppercase tracking-wide text-text-muted">
            Minimum yield %
            <input
              value={yieldLimit}
              onChange={(event) => {
                setYieldLimit(event.target.value);
                setPage(1);
              }}
              inputMode="decimal"
              className="mt-1 block w-28 rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs normal-case tracking-normal text-text-primary"
            />
          </label>
        )}
        <p className="pb-1 text-[11px] text-text-secondary">{symbols.length} symbols</p>
      </div>

      {!canRun && (
        <p className="text-xs text-text-muted">
          Fundamental screens apply to equity pools: US, Indonesia, Asia, and Europe.
        </p>
      )}

      {canRun && isLoading && !data && (
        <p className="text-xs text-text-muted">
          Screening {symbols.length} symbols.
          {serverPaged ? ' A first pass across every pool can take several minutes.' : ' The first pass for a pool can take a minute.'}
        </p>
      )}
      {error && <p className="text-xs text-negative">The screen could not be completed.</p>}

      {data && (
        <ScreenerResults
          data={data}
          page={page}
          pageSize={pageSize}
          serverPaged={serverPaged}
          onPage={setPage}
          detailHref={(symbol) => {
            const yieldQuery =
              kind === 'fundamental' && activeSlug === 'dividend-yield'
                ? `?yield=${encodeURIComponent(String(minYield))}`
                : '';
            return `/analysis/strategy-detail/${encodeURIComponent(activeSlug)}/${encodeURIComponent(symbol)}${yieldQuery}`;
          }}
        />
      )}
    </div>
  );
}

function pageWindow(current: number, pages: number) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const start = Math.max(1, Math.min(current - 2, pages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

function ScreenerResults({
  data,
  page,
  pageSize,
  serverPaged,
  onPage,
  detailHref,
}: {
  data: ScreenResult;
  page: number;
  pageSize: number;
  serverPaged: boolean;
  onPage: (page: number) => void;
  detailHref: (symbol: string) => string;
}) {
  const total = data.matched;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const rows = serverPaged ? data.results : data.results.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-secondary">
        Page {current} of {pages} · {total} {total === 1 ? 'match' : 'matches'}
        {data.scanned ? ` from ${data.scanned} scanned` : ''}
      </p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-panel text-[10px] uppercase text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 font-medium">Match</th>
              <th className="px-3 py-2 font-medium">Conditions</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const met = row.conditions.filter((item) => item.met).length;
              return (
                <tr key={row.symbol} className="border-t border-border-muted">
                  <td className="px-3 py-2 font-mono text-text-primary">{row.symbol}</td>
                  <td className="px-3 py-2 font-mono">{Math.round(row.match_score * 100)}%</td>
                  <td className="px-3 py-2 text-text-secondary">
                    {met}/{row.conditions.length} met
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={detailHref(row.symbol)} className="text-positive">
                      See details
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-text-muted">
                  No symbols in this pool currently meet the bullish rule.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={current <= 1}
            onClick={() => onPage(current - 1)}
            className="rounded border border-border px-2 py-1 text-[11px] text-text-secondary disabled:opacity-40"
          >
            Previous
          </button>
          {pageWindow(current, pages).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onPage(number)}
              className={`rounded border px-2 py-1 text-[11px] ${
                number === current
                  ? 'border-positive/50 bg-positive/10 text-positive'
                  : 'border-border text-text-secondary'
              }`}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            disabled={current >= pages}
            onClick={() => onPage(current + 1)}
            className="rounded border border-border px-2 py-1 text-[11px] text-text-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
      <p className="text-[10px] leading-relaxed text-text-muted">{data.disclaimer}</p>
    </div>
  );
}
