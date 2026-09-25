'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { AlertForm } from '@/components/alerts/AlertForm';
import { AlertsList } from '@/components/alerts/AlertsList';
import type { AlertStatus } from '@/types/market';

const TABS: { key: AlertStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'TRIGGERED', label: 'Triggered' },
  { key: 'DISABLED', label: 'Disabled' },
];

export default function AlertsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('ALL');
  const { data, isLoading, mutate } = useSWR('alerts-list', () => api.listAlerts(), {
    refreshInterval: 60_000,
  });

  useSWR('alerts-check', () => api.checkAlerts(), {
    refreshInterval: 60_000,
    shouldRetryOnError: false,
    onSuccess: () => {
      void mutate();
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (tab === 'ALL') return list;
    return list.filter((a) => a.status === tab);
  }, [data, tab]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div>
        <h1 className="text-h1 text-text-primary">Alerts</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create price/indicator triggers. Auto-evaluated while the app is open (60s polling).
        </p>
      </div>

      <AlertForm onCreated={() => mutate()} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              tab === t.key
                ? 'bg-positive text-canvas'
                : 'border border-border text-text-secondary hover:border-positive/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && !data ? (
        <p className="text-xs text-text-muted">Loading alerts...</p>
      ) : (
        <AlertsList alerts={filtered} onChanged={() => mutate()} />
      )}
    </div>
  );
}
