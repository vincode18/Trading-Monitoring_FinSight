'use client';

import { AppShell } from '@/components/app/AppShell';
import { WatchlistProvider } from '@/lib/watchlist-context';
import { MarketProvider } from '@/lib/market-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WatchlistProvider>
      <MarketProvider>
        <AppShell>{children}</AppShell>
      </MarketProvider>
    </WatchlistProvider>
  );
}
