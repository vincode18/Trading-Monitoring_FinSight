'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthUser, api, getStoredToken, setStoredToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/chart', label: 'Chart' },
  { href: '/news', label: 'News' },
  { href: '/analysis', label: 'Analysis' },
  { href: '#', label: 'Alerts', soon: true },
  { href: '#', label: 'Portfolio', soon: true },
  { href: '#', label: 'Settings', soon: true },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          setStoredToken(null);
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function logout() {
    setStoredToken(null);
    setUser(null);
    router.push('/login');
  }

  const displayName = user?.name || 'Guest Trader';
  const displayMeta = user?.role?.replace(/_/g, ' ') || 'Free Plan';

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-panel">
      <div className="border-b border-border px-4 py-4">
        <Link href="/dashboard" className="block">
          <div className="text-sm font-bold tracking-tight text-text-primary">Trading Monitor</div>
          <div className="mt-0.5 text-xs text-text-muted">AI Research Terminal</div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active =
            !item.soon &&
            (pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href)));
          if (item.soon) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded px-3 py-2 text-sm text-text-muted"
              >
                <span>{item.label}</span>
                <span className="rounded-sm bg-border-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-panel-hover font-medium text-positive'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-border-muted text-xs font-semibold text-positive">
            {initials(displayName)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium text-text-primary">{displayName}</div>
            <div className="truncate text-[10px] uppercase tracking-wide text-text-muted">
              {displayMeta}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-negative/40 hover:bg-panel-hover hover:text-negative"
        >
          Log out
        </button>
        <p className="mt-3 text-[10px] leading-relaxed text-text-muted">
          Data via Yahoo Finance — bukan nasihat keuangan.
        </p>
      </div>
    </aside>
  );
}
