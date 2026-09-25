'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fmt, fmtPct } from '@/components/analysis/fundamental/format';
import { api } from '@/lib/api';
import type { FundamentalCriteria } from '@/types/market';

const DEFAULTS: FundamentalCriteria = {
  pbv_max: 1,
  der_max: 1,
  roe_min: 10,
  evebitda_max: 10,
};

const FIELDS: Array<{ key: keyof FundamentalCriteria; label: string; hint: string }> = [
  { key: 'pbv_max', label: 'PBV maximum', hint: 'Price / book at or below' },
  { key: 'der_max', label: 'Debt / equity maximum', hint: 'Debt / equity at or below' },
  { key: 'roe_min', label: 'ROE minimum (%)', hint: 'Return on equity at or above' },
  { key: 'evebitda_max', label: 'EV/EBITDA maximum', hint: 'Enterprise value / EBITDA at or below' },
];

function toDraft(criteria: FundamentalCriteria) {
  return {
    pbv_max: criteria.pbv_max == null ? '' : String(criteria.pbv_max),
    der_max: criteria.der_max == null ? '' : String(criteria.der_max),
    roe_min: criteria.roe_min == null ? '' : String(criteria.roe_min),
    evebitda_max: criteria.evebitda_max == null ? '' : String(criteria.evebitda_max),
  };
}

function parseDraft(draft: Record<keyof FundamentalCriteria, string>): FundamentalCriteria {
  const next = {} as FundamentalCriteria;
  (Object.keys(draft) as Array<keyof FundamentalCriteria>).forEach((key) => {
    const raw = draft[key].trim();
    if (!raw) {
      next[key] = null;
      return;
    }
    const value = Number(raw);
    next[key] = Number.isFinite(value) ? value : null;
  });
  return next;
}

function formatActual(value: number | null, unit: string) {
  if (value == null) return '—';
  return unit === 'percent' ? fmtPct(value) : fmt(value);
}

export function FundamentalFitCheck({ symbol }: { symbol: string }) {
  const [draft, setDraft] = useState(toDraft(DEFAULTS));
  const [criteria, setCriteria] = useState(DEFAULTS);
  const { data, error, isLoading } = useSWR(['fundamental-fit', symbol, criteria], () =>
    api.checkFundamentalFit(symbol, criteria)
  );

  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-text-secondary">
        A personal value screen for this symbol: cheap versus book, low debt, high return on equity, and a low EV/EBITDA.
        The starting limits are PBV below 1, debt/equity below 1, ROE above 10%, and EV/EBITDA below 10. Change them to match your own screen.
        The result follows your limits. It is not a FinSight recommendation.
      </p>

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setCriteria(parseDraft(draft));
        }}
      >
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-[10px] uppercase tracking-wide text-text-muted">
            {field.label}
            <input
              value={draft[field.key]}
              onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
              inputMode="decimal"
              className="mt-1 w-full rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs normal-case tracking-normal text-text-primary"
              aria-label={field.hint}
            />
          </label>
        ))}
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded bg-positive px-3 py-1.5 text-xs font-medium text-canvas">
            Apply limits
          </button>
        </div>
      </form>

      {isLoading && !data && <p className="text-xs text-text-muted">Checking annual ratios...</p>}
      {error && <p className="text-xs text-negative">The fit check could not be loaded.</p>}

      {data && !data.equity && (
        <p className="text-xs text-text-muted">Fit check applies to equities.</p>
      )}

      {data && data.equity && (
        <div className="space-y-2">
          <p className="text-xs text-text-primary">
            {data.results.length === 0
              ? 'Add at least one limit to run the check.'
              : data.checked_count
                ? `${data.passed_count} of ${data.checked_count} limits met on the latest annual figures.`
                : 'None of the selected ratios are available for this symbol.'}
          </p>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-panel text-[10px] uppercase text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Ratio</th>
                  <th className="px-3 py-2 font-medium">Actual</th>
                  <th className="px-3 py-2 font-medium">Your limit</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((row) => (
                  <tr key={row.key} className="border-t border-border-muted">
                    <td className="px-3 py-2 text-text-primary">{row.label}</td>
                    <td className="px-3 py-2 font-mono">{formatActual(row.actual, row.unit)}</td>
                    <td className="px-3 py-2 font-mono text-text-secondary">
                      {row.comparator} {formatActual(row.threshold, row.unit)}
                    </td>
                    <td className="px-3 py-2">
                      {row.passed == null && <span className="text-text-muted">Not available</span>}
                      {row.passed === true && <span className="text-positive">Met</span>}
                      {row.passed === false && <span className="text-negative">Outside your limit</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.disclaimer && <p className="text-[10px] leading-relaxed text-text-muted">{data.disclaimer}</p>}
        </div>
      )}
    </div>
  );
}
