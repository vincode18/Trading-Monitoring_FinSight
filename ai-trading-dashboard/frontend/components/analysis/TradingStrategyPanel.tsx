'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import type { StrategyState } from '@/types/market';

function stateNote(state: StrategyState): string {
  const code = state.code.toUpperCase();
  if (code.includes('GC') || code.includes('CROSS') || state.label.toLowerCase().includes('cross') || state.label.toLowerCase().includes('crosses')) {
    return state.active
      ? 'Cross detected on the latest candle'
      : 'No cross on the latest candle';
  }
  if (code.includes('DC') || state.label.toLowerCase().includes('downward') || state.label.toLowerCase().includes('below')) {
    return state.active
      ? 'Downward move detected on the latest candle'
      : 'Did not occur on the latest candle';
  }
  if (
    code.includes('OVER') ||
    code.includes('ZONE') ||
    state.label.toLowerCase().includes('above') ||
    state.label.toLowerCase().includes('below')
  ) {
    return state.active
      ? 'Level/zone is active now'
      : 'Price/indicator not in this zone';
  }
  return state.active
    ? 'Condition active on the latest candle'
    : 'Condition not met on the latest candle';
}

export function TradingStrategyPanel({ symbol }: { symbol: string }) {
  const [slug, setSlug] = useState('profitunity');
  const { data: catalog } = useSWR('strategy-catalog', () => api.listStrategies());
  const { data, isLoading, error } = useSWR(
    symbol ? ['strategy', symbol, slug] : null,
    () => api.getStrategy(symbol, slug)
  );

  return (
    <div className="space-y-3 rounded-md border border-border bg-panel p-4">
      <div className="space-y-2">
        <h3 className="text-h2 text-text-primary">Trading Strategy</h3>
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          aria-label="Select trading strategy"
          className="w-full max-w-2xl rounded border border-border bg-canvas px-3 py-2.5 text-sm text-text-primary"
        >
          {(catalog ?? [{ slug: 'profitunity', name: 'Profitunity / Bill Williams' }]).map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-text-muted">
          Figures and conditions are calculated from this symbol's historical prices.
        </p>
      </div>

      {isLoading && !data && <p className="text-xs text-text-muted">Calculating strategy...</p>}
      {error && (
        <p className="text-xs text-negative">
          {error instanceof Error ? error.message : 'Failed to load strategy'}
        </p>
      )}

      {data && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.readings.map((row) => (
              <div key={row.label} className="rounded border border-border-muted bg-canvas px-3 py-2">
                <div className="text-[10px] uppercase text-text-muted">{row.label}</div>
                <div className="font-mono text-sm text-text-primary">{row.value ?? '—'}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded border border-border-muted">
            <table className="w-full min-w-[640px] table-fixed text-left text-xs">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[34%]" />
                <col className="w-[32%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-canvas text-[10px] uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Code</th>
                  <th className="px-3 py-2 font-medium">Condition</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.states.map((state) => (
                  <tr
                    key={state.code}
                    className="border-t border-border-muted transition-colors hover:bg-positive/5"
                  >
                    <td className="px-3 py-2.5 font-mono text-text-secondary">{state.code}</td>
                    <td className="px-3 py-2.5 text-text-primary">{state.label}</td>
                    <td className="px-3 py-2.5 text-text-muted">{stateNote(state)}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${
                          state.active
                            ? 'bg-positive/15 text-positive'
                            : 'bg-border-muted text-text-muted'
                        }`}
                      >
                        {state.active ? 'Met' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-text-muted">{data.disclaimer}</p>
        </>
      )}
    </div>
  );
}
