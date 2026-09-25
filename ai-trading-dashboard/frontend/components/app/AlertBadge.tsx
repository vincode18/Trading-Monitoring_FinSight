'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export function AlertBadge() {
  const { data: triggeredAlerts } = useSWR('alerts-check', () => api.checkAlerts(), {
    refreshInterval: 60_000,
    shouldRetryOnError: false,
  });

  const count = triggeredAlerts?.length ?? 0;
  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-canvas">
      {count > 9 ? '9+' : count}
    </span>
  );
}
