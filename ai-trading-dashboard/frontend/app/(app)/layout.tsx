'use client';

import { AppShell } from '@/components/app/AppShell';
import { WatchlistProvider } from '@/lib/watchlist-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WatchlistProvider>
      <AppShell>{children}</AppShell>
    </WatchlistProvider>
  );
}
