'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthUser, api } from '@/lib/api';

const STORAGE_KEY = 'finsight-sidebar-collapsed';

type NavItem = {
  href: string;
  label: string;
  short: string;
  soon?: boolean;
  children?: { href: string; label: string; short: string }[];
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', short: 'Db' },
  { href: '/watchlist', label: 'Watchlist', short: 'Wl' },
  { href: '/chart', label: 'Chart', short: 'Ch' },
  { href: '/news', label: 'News', short: 'Nw' },
  {
    href: '/analysis',
    label: 'Analysis',
    short: 'An',
    children: [
      { href: '/analysis', label: 'Overview', short: 'Ov' },
      { href: '/analysis/earnings-calendar', label: 'Earnings Calendar', short: 'Ec' },
    ],
  },
  { href: '#', label: 'Alerts', short: 'Al', soon: true },
  { href: '#', label: 'Portfolio', short: 'Pf', soon: true },
  { href: '#', label: 'Settings', short: 'St', soon: true },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
    >
      <path
        d="M10 3.5L5.5 8L10 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/analysis') {
    return pathname === '/analysis' || pathname.startsWith('/analysis/');
  }
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

function isChildActive(pathname: string, href: string) {
  if (href === '/analysis') return pathname === '/analysis';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed, hydrated]);

  useEffect(() => {
    if (pathname.startsWith('/analysis')) setAnalysisOpen(true);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function logout() {
    try {
      await api.logout();
    } catch {
      /* clear client state anyway */
    }
    setUser(null);
    router.push('/login');
  }

  const displayName = user?.name || 'Guest Trader';
  const displayMeta = user?.role?.replace(/_/g, ' ') || 'Free Plan';

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-border bg-panel transition-[width] duration-200 ease-out ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div
        className={`flex items-center border-b border-border ${
          collapsed ? 'flex-col gap-2 px-1.5 py-3' : 'justify-between gap-2 px-3 py-3'
        }`}
      >
        <Link
          href="/dashboard"
          className={collapsed ? 'block text-center' : 'min-w-0 flex-1'}
          title="FinSight"
        >
          {collapsed ? (
            <div className="text-xs font-bold tracking-tight text-text-primary">FS</div>
          ) : (
            <>
              <div className="text-sm font-bold tracking-tight text-text-primary">FinSight</div>
              <div className="mt-0.5 text-xs text-text-muted">AI Research Terminal</div>
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border bg-canvas text-text-secondary transition-colors hover:border-positive/40 hover:bg-panel-hover hover:text-text-primary"
          aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          <ChevronIcon collapsed={collapsed} />
        </button>
      </div>

      <nav className={`flex-1 space-y-0.5 overflow-y-auto py-3 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {NAV.map((item) => {
          const active = !item.soon && isActivePath(pathname, item.href);

          if (item.soon) {
            return (
              <div
                key={item.label}
                title={`${item.label} (Soon)`}
                className={`flex items-center rounded py-2 text-sm text-text-muted ${
                  collapsed ? 'justify-center px-0' : 'justify-between px-3'
                }`}
              >
                {collapsed ? (
                  <span className="font-mono text-[10px] uppercase">{item.short}</span>
                ) : (
                  <>
                    <span>{item.label}</span>
                    <span className="rounded-sm bg-border-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      Soon
                    </span>
                  </>
                )}
              </div>
            );
          }

          if (item.children?.length) {
            if (collapsed) {
              return (
                <div key={item.href} className="space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = isChildActive(pathname, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        title={child.label}
                        className={`block rounded px-0 py-2 text-center font-mono text-[10px] uppercase transition-colors ${
                          childActive
                            ? 'bg-panel-hover font-medium text-positive'
                            : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                        }`}
                      >
                        {child.short}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={item.href} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setAnalysisOpen((v) => !v)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-panel-hover font-medium text-positive'
                      : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                  }`}
                  aria-expanded={analysisOpen}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] text-text-muted transition-transform ${
                      analysisOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ›
                  </span>
                </button>
                {analysisOpen && (
                  <div className="ml-2 space-y-0.5 border-l border-border-muted pl-2">
                    {item.children.map((child) => {
                      const childActive = isChildActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block rounded px-2 py-1.5 text-xs transition-colors ${
                            childActive
                              ? 'bg-panel-hover font-medium text-positive'
                              : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`block rounded text-sm transition-colors ${
                collapsed ? 'px-0 py-2 text-center font-mono text-[10px] uppercase' : 'px-3 py-2'
              } ${
                active
                  ? 'bg-panel-hover font-medium text-positive'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
              }`}
            >
              {collapsed ? item.short : item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-border ${collapsed ? 'px-1.5 py-3' : 'px-4 py-3'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md bg-border-muted text-xs font-semibold text-positive"
              title={displayName}
            >
              {initials(displayName)}
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-canvas text-[10px] font-medium text-text-secondary transition-colors hover:border-negative/40 hover:text-negative"
              title="Log out"
              aria-label="Log out"
            >
              Out
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
