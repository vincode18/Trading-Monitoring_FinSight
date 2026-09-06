'use client';

import { AppSidebarNav } from './AppSidebarNav';
import { TickerBar } from './TickerBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-canvas">
      <AppSidebarNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <TickerBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
