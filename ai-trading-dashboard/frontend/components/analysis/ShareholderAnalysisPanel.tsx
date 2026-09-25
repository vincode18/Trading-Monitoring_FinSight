'use client';

import useSWR from 'swr';
import { DonutChart, FUND_COLORS } from '@/components/analysis/fundamental/charts';
import { fmt, fmtBig, fmtPct } from '@/components/analysis/fundamental/format';
import { api } from '@/lib/api';

export function ShareholderAnalysisPanel({ symbol }: { symbol: string }) {
  const { data, error, isLoading } = useSWR(['shareholders', symbol], () => api.getShareholders(symbol));

  if (isLoading && !data) {
    return <p className="text-xs text-text-muted">Loading shareholder data...</p>;
  }
  if (error) {
    return <p className="text-xs text-negative">Shareholder data could not be loaded.</p>;
  }
  if (!data?.available) {
    return (
      <p className="text-xs text-text-muted">
        Ownership data is not available for {symbol}. Coverage is often limited outside US listings.
      </p>
    );
  }

  const slices = data.composition
    .filter((slice) => slice.percent != null && slice.percent > 0)
    .map((slice) => ({
      name: slice.label,
      value: slice.percent as number,
      color:
        slice.label === 'Insiders'
          ? FUND_COLORS.insider
          : slice.label === 'Institutions'
            ? FUND_COLORS.inst
            : FUND_COLORS.public,
    }));

  return (
    <div className="space-y-4">
      <p className="text-[11px] leading-relaxed text-text-secondary">
        Reported ownership and insider filings, shown as public disclosure records.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-panel p-4">
          <h3 className="text-xs font-medium text-text-primary">Ownership composition</h3>
          <div className="mt-3">
            <DonutChart slices={slices} />
          </div>
        </section>
        <section className="rounded-md border border-border bg-panel p-4">
          <h3 className="text-xs font-medium text-text-primary">Major holders</h3>
          <div className="mt-3 space-y-1">
            {data.major_holders.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-text-secondary">{row.label}</span>
                <span className="font-mono text-text-primary">
                  {row.count != null ? fmt(row.count, 0) : fmtPct(row.percent)}
                </span>
              </div>
            ))}
            {!data.major_holders.length && (
              <p className="text-xs text-text-muted">Holder breakdown is not available.</p>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-x-auto rounded-md border border-border bg-panel">
        <h3 className="px-3 pt-3 text-xs font-medium text-text-primary">Top institutional holders</h3>
        {data.institutional_holders.length ? (
          <table className="mt-2 w-full min-w-[640px] text-left text-xs">
            <thead className="text-[10px] uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Holder</th>
                <th className="px-3 py-2 font-medium">Shares</th>
                <th className="px-3 py-2 font-medium">% out</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Reported</th>
              </tr>
            </thead>
            <tbody>
              {data.institutional_holders.map((row) => (
                <tr key={`${row.name}-${row.reported}`} className="border-t border-border-muted">
                  <td className="px-3 py-2 text-text-primary">{row.name}</td>
                  <td className="px-3 py-2 font-mono">{fmtBig(row.shares)}</td>
                  <td className="px-3 py-2 font-mono">{fmtPct(row.percent)}</td>
                  <td className="px-3 py-2 font-mono">{fmtBig(row.value)}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{row.reported ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-3 py-3 text-xs text-text-muted">Institutional holder detail is not available.</p>
        )}
      </section>

      <section className="overflow-x-auto rounded-md border border-border bg-panel">
        <h3 className="px-3 pt-3 text-xs font-medium text-text-primary">Insider transactions</h3>
        <p className="px-3 pt-1 text-[10px] text-text-muted">Latest reported filings. A sale or purchase here is a disclosure, not a signal.</p>
        {data.insider_transactions.length ? (
          <table className="mt-2 w-full min-w-[720px] text-left text-xs">
            <thead className="text-[10px] uppercase text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Insider</th>
                <th className="px-3 py-2 font-medium">Position</th>
                <th className="px-3 py-2 font-medium">Filing</th>
                <th className="px-3 py-2 font-medium">Shares</th>
                <th className="px-3 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.insider_transactions.map((row, index) => (
                <tr key={`${row.insider}-${row.date}-${index}`} className="border-t border-border-muted">
                  <td className="px-3 py-2 font-mono text-text-secondary">{row.date ?? '—'}</td>
                  <td className="px-3 py-2 text-text-primary">{row.insider ?? '—'}</td>
                  <td className="px-3 py-2 text-text-secondary">{row.position ?? '—'}</td>
                  <td className="px-3 py-2 text-text-secondary">{row.transaction ?? '—'}</td>
                  <td className="px-3 py-2 font-mono">{fmtBig(row.shares)}</td>
                  <td className="px-3 py-2 font-mono">{fmtBig(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-3 py-3 text-xs text-text-muted">Insider transaction history is not available for this symbol.</p>
        )}
      </section>

      {data.disclaimer && <p className="text-[10px] leading-relaxed text-text-muted">{data.disclaimer}</p>}
    </div>
  );
}
