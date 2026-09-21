'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

function cellColor(pct: number | null) {
  if (pct == null) return 'bg-border-muted text-text-muted';
  if (pct > 1.5) return 'bg-positive/30 text-positive';
  if (pct > 0) return 'bg-positive/15 text-positive';
  if (pct < -1.5) return 'bg-negative/30 text-negative';
  if (pct < 0) return 'bg-negative/15 text-negative';
  return 'bg-border-muted text-text-secondary';
}

export function SectorHeatmap({ market }: { market: string }) {
  const { data, error } = useSWR(['sectors', market], () => api.getSectors(market), {
    refreshInterval: 60_000,
  });

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h2 className="text-h2 text-text-primary">Sector Performance</h2>
      <p className="mt-1 text-[10px] text-text-muted">
        Rata-rata % perubahan basket per sektor (dense 4-kolom).
      </p>
      {error && (
        <p className="mt-6 text-center text-xs text-text-muted">Gagal memuat sektor.</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {(data?.sectors ?? []).map((s) => (
          <div
            key={s.name}
            className={`rounded-md px-2 py-2.5 text-center ${cellColor(s.avg_change_pct)}`}
          >
            <div className="text-[11px] font-semibold leading-tight">{s.name}</div>
            <div className="mt-1 font-mono text-[11px] tabular-nums">
              {s.avg_change_pct != null
                ? `${s.avg_change_pct >= 0 ? '+' : ''}${s.avg_change_pct.toFixed(2)}%`
                : '—'}
            </div>
          </div>
        ))}
        {!data && !error && (
          <p className="col-span-full py-6 text-center text-xs text-text-muted">Memuat heatmap...</p>
        )}
      </div>
    </div>
  );
}
