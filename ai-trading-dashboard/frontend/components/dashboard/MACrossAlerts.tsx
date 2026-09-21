'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { api } from '@/lib/api';

export function MACrossAlerts({ symbols, market }: { symbols: string[]; market?: string }) {
  const { data, isLoading } = useSWR(
    symbols.length ? ['ma-cross', market ?? 'all', symbols.join(',')] : null,
    () => api.getMACrossAlerts(symbols),
    { refreshInterval: 120_000 }
  );

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h2 className="text-h2 text-text-primary">MA Cross Alerts</h2>
      <p className="mt-1 text-[10px] text-text-muted">
        Fakta persilangan MA20/MA50 — bukan rekomendasi beli/jual.
      </p>
      <div className="mt-3 space-y-2">
        {isLoading && !data && (
          <p className="py-6 text-center text-xs text-text-muted">Memuat...</p>
        )}
        {!isLoading && !data?.length && (
          <p className="py-6 text-center text-xs text-text-muted">
            Tidak ada Golden/Death Cross baru pada universe tab ini.
          </p>
        )}
        {data?.map((a) => (
          <Link
            key={`${a.symbol}-${a.cross_type}`}
            href={`/chart/${encodeURIComponent(a.symbol)}`}
            className="flex items-center justify-between rounded border border-border-muted px-3 py-2 hover:border-positive/40"
          >
            <span className="font-mono text-xs text-text-primary">{a.symbol}</span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                a.cross_type === 'golden'
                  ? 'bg-positive/15 text-positive'
                  : 'bg-negative/15 text-negative'
              }`}
            >
              {a.cross_type === 'golden' ? 'Golden Cross' : 'Death Cross'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
