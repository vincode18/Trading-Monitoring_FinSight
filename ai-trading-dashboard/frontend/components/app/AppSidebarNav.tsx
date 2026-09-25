'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import useSWR from 'swr';

import { AuthUser, api } from '@/lib/api';
import { LogoMark } from '@/components/app/LogoMark';
import { AlertBadge } from '@/components/app/AlertBadge';

const STORAGE_KEY = 'finsight-sidebar-collapsed';
const FREE_PLAN_END_KEY = 'finsight-free-plan-end';
const FREE_PLAN_DAYS = 14;

type NavLeaf = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
};

type NavNode = NavLeaf & {
  children?: NavNode[];
};

type NavItem = {
  href: string;
  label: string;
  short: string;
  icon: ReactNode;
  soon?: boolean;
  children?: NavNode[];
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
      {children}
    </span>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function DashboardIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="2" y="2" width="5" height="5" rx="1" {...stroke} />
        <rect x="9" y="2" width="5" height="5" rx="1" {...stroke} />
        <rect x="2" y="9" width="5" height="5" rx="1" {...stroke} />
        <rect x="9" y="9" width="5" height="5" rx="1" {...stroke} />
      </svg>
    </Icon>
  );
}

function WatchlistIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M3 4.5H13M3 8H13M3 11.5H9" {...stroke} />
      </svg>
    </Icon>
  );
}

function ChartIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M2.5 12.5V3.5M2.5 12.5H13.5" {...stroke} />
        <path d="M5 10V7.5M8 10V5M11 10V8" {...stroke} />
      </svg>
    </Icon>
  );
}

function NewsIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="3" y="2.5" width="10" height="11" rx="1" {...stroke} />
        <path d="M5.5 5.5H10.5M5.5 8H10.5M5.5 10.5H8.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function AnalysisIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="7" cy="7" r="3.5" {...stroke} />
        <path d="M10 10L13 13" {...stroke} />
      </svg>
    </Icon>
  );
}

function OverviewIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="2" {...stroke} />
        <path d="M2.5 8C3.8 5.2 5.7 3.5 8 3.5S12.2 5.2 13.5 8C12.2 10.8 10.3 12.5 8 12.5S3.8 10.8 2.5 8Z" {...stroke} />
      </svg>
    </Icon>
  );
}

function CalendarIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="2.5" y="3.5" width="11" height="10" rx="1" {...stroke} />
        <path d="M2.5 6.5H13.5M5.5 2.5V4.5M10.5 2.5V4.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function AlertsIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M4 10.5V7a4 4 0 118 0v3.5l1 1.5H3l1-1.5Z" {...stroke} />
        <path d="M6.5 13a1.5 1.5 0 003 0" {...stroke} />
      </svg>
    </Icon>
  );
}

function PortfolioIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="2.5" y="5" width="11" height="8" rx="1" {...stroke} />
        <path d="M5.5 5V4a1.5 1.5 0 013 0v1M2.5 8.5H13.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function SettingsIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="2" {...stroke} />
        <path
          d="M8 2.5V4M8 12v1.5M2.5 8H4M12 8h1.5M4.2 4.2l1.1 1.1M10.7 10.7l1.1 1.1M11.8 4.2l-1.1 1.1M5.3 10.7l-1.1 1.1"
          {...stroke}
        />
      </svg>
    </Icon>
  );
}

function TimerIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8.5" r="5" {...stroke} />
        <path d="M8 5.5V8.5L10 10M6.5 2.5H9.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function UserIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="5.5" r="2.5" {...stroke} />
        <path d="M3.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" {...stroke} />
      </svg>
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M7 3H4a1 1 0 00-1 1v8a1 1 0 001 1h3M7 8H13.5M11 5.5L13.5 8 11 10.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function LegalIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M5 2.5h4.5L12.5 5.5V13a1 1 0 01-1 1H5a1 1 0 01-1-1V3.5a1 1 0 011-1z" {...stroke} />
        <path d="M9.5 2.5V5.5H12.5M6 8.5h4M6 11h3" {...stroke} />
      </svg>
    </Icon>
  );
}

function WarRoomIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="2" y="2" width="5" height="5" rx="0.5" {...stroke} />
        <rect x="9" y="2" width="5" height="5" rx="0.5" {...stroke} />
        <rect x="2" y="9" width="5" height="5" rx="0.5" {...stroke} />
        <rect x="9" y="9" width="5" height="5" rx="0.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function TechnicalIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M2.5 12.5L6 7.5L9 10L13.5 3.5" {...stroke} />
        <path d="M2.5 13.5H13.5" {...stroke} />
      </svg>
    </Icon>
  );
}

function FundamentalIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="3" y="2.5" width="10" height="11" rx="1" {...stroke} />
        <path d="M5.5 5.5H10.5M5.5 8H10.5M5.5 10.5H8" {...stroke} />
      </svg>
    </Icon>
  );
}

function DetailIcon() {
  return (
    <Icon>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M3 4.5H13M3 8H13M3 11.5H9" {...stroke} />
      </svg>
    </Icon>
  );
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', short: 'Db', icon: <DashboardIcon /> },
  { href: '/watchlist', label: 'Watchlist', short: 'Wl', icon: <WatchlistIcon /> },
  {
    href: '/chart',
    label: 'Chart',
    short: 'Ch',
    icon: <ChartIcon />,
    children: [
      { href: '/chart', label: 'Single Chart', short: 'Sc', icon: <ChartIcon /> },
      { href: '/chart/war-room', label: 'War Room', short: 'Wr', icon: <WarRoomIcon /> },
    ],
  },
  { href: '/news', label: 'News', short: 'Nw', icon: <NewsIcon /> },
  {
    href: '/analysis',
    label: 'Analysis',
    short: 'An',
    icon: <AnalysisIcon />,
    children: [
      { href: '/analysis/overview', label: 'Overview Stocks', short: 'Ov', icon: <OverviewIcon /> },
      {
        href: '/analysis/technical',
        label: 'Technical Analysis',
        short: 'Ta',
        icon: <TechnicalIcon />,
        children: [
          {
            href: '/analysis/technical/detail',
            label: 'Screener Technical',
            short: 'Dt',
            icon: <DetailIcon />,
          },
        ],
      },
      {
        href: '/analysis/fundamental',
        label: 'Fundamental Analysis',
        short: 'Fa',
        icon: <FundamentalIcon />,
        children: [
          {
            href: '/analysis/fundamental/detail',
            label: 'Screener Fundamental',
            short: 'Df',
            icon: <DetailIcon />,
          },
        ],
      },
      {
        href: '/analysis/earnings-calendar',
        label: 'Earnings Calendar',
        short: 'Ec',
        icon: <CalendarIcon />,
      },
    ],
  },
  { href: '/alerts', label: 'Alerts', short: 'Al', icon: <AlertsIcon /> },
  { href: '/portfolio', label: 'Portfolio', short: 'Pf', icon: <PortfolioIcon /> },
  { href: '/settings', label: 'Settings', short: 'St', icon: <SettingsIcon /> },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 4.5H13.5M2.5 8H13.5M2.5 11.5H13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === '/analysis') {
    return pathname === '/analysis' || pathname.startsWith('/analysis/');
  }
  if (href === '/chart') {
    return pathname === '/chart' || pathname.startsWith('/chart/');
  }
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

function isLeafActive(pathname: string, href: string) {
  if (href === '/chart') {
    return (
      pathname === '/chart' ||
      (pathname.startsWith('/chart/') && !pathname.startsWith('/chart/war-room'))
    );
  }
  if (href === '/analysis/technical') {
    return pathname.startsWith('/analysis/technical');
  }
  if (href === '/analysis/fundamental') {
    return pathname.startsWith('/analysis/fundamental');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function collectLeaves(nodes: NavNode[]): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const node of nodes) {
    if (node.children?.length) out.push(...collectLeaves(node.children));
    else out.push(node);
  }
  return out;
}

function daysLeft(endMs: number): number {
  return Math.max(0, Math.ceil((endMs - Date.now()) / (1000 * 60 * 60 * 24)));
}

function freePlanEndMs(): number {
  const fallback = Date.now() + FREE_PLAN_DAYS * 24 * 60 * 60 * 1000;
  try {
    const saved = Number(localStorage.getItem(FREE_PLAN_END_KEY));
    if (saved && !Number.isNaN(saved)) return saved;
    localStorage.setItem(FREE_PLAN_END_KEY, String(fallback));
  } catch {
    /* keep the in-memory fallback */
  }
  return fallback;
}

function MembershipCountdown({ collapsed }: { collapsed: boolean }) {
  const { data } = useSWR('subscription-badge', () => api.getSubscription().catch(() => null), {
    refreshInterval: 5 * 60 * 1000,
  });
  const [fallbackEnd, setFallbackEnd] = useState<number | null>(null);
  useEffect(() => {
    setFallbackEnd(freePlanEndMs());
  }, []);
  const tier = (data?.tier || 'free').toLowerCase().replace(/_/g, ' ');
  const endMs = data?.end_date ? new Date(data.end_date).getTime() : fallbackEnd;
  const remaining = endMs == null ? FREE_PLAN_DAYS : daysLeft(endMs);
  const dayLabel = remaining === 1 ? '1 day left' : `${remaining} days left`;

  if (collapsed) {
    return (
      <div
        className="mb-1 flex h-8 w-8 items-center justify-center rounded text-positive"
        title={dayLabel ? `${tier} · ${dayLabel}` : tier}
        aria-label={dayLabel ? `${tier}, ${dayLabel}` : tier}
      >
        <TimerIcon />
      </div>
    );
  }

  return (
    <div className="mb-3 rounded border border-border bg-canvas px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-positive">{tier} plan</span>
      <div className="mt-1 text-xs text-text-primary">{dayLabel}</div>
    </div>
  );
}

export function AppSidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }
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
            <LogoMark size={28} />
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
          aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Open sidebar' : 'Close sidebar'}
        >
          <HamburgerIcon />
        </button>
      </div>

      <nav className={`flex-1 space-y-0.5 overflow-y-auto py-3 ${collapsed ? 'px-1.5' : 'px-2'}`}>
        {NAV.map((item) => {
          const active = !item.soon && isActivePath(pathname, item.href);

          if (item.children?.length) {
            if (collapsed) {
              const leaves = collectLeaves(item.children);
              return (
                <div key={item.href} className="space-y-0.5">
                  {leaves.map((leaf) => {
                    const leafActive = isLeafActive(pathname, leaf.href);
                    return (
                      <Link
                        key={leaf.href}
                        href={leaf.href}
                        title={leaf.label}
                        className={`flex items-center justify-center rounded px-0 py-2 transition-colors ${
                          leafActive
                            ? 'bg-panel-hover text-positive'
                            : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                        }`}
                      >
                        {leaf.icon}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const groupOpen = openGroups[item.href] ?? false;

            return (
              <div key={item.href} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.href)}
                  className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-panel-hover font-medium text-positive'
                      : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                  }`}
                  aria-expanded={groupOpen}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`text-[10px] text-text-muted transition-transform ${
                      groupOpen ? 'rotate-90' : ''
                    }`}
                  >
                    ›
                  </span>
                </button>
                {groupOpen && (
                  <div className="ml-2 space-y-0.5 border-l border-border-muted pl-2">
                    {item.children.map((child) => {
                      if (child.children?.length) {
                        const nestedOpen = openGroups[child.href] ?? false;
                        const nestedActive = isLeafActive(pathname, child.href);
                        return (
                          <div key={child.href} className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => toggleGroup(child.href)}
                              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors ${
                                nestedActive
                                  ? 'bg-panel-hover font-medium text-positive'
                                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                              }`}
                              aria-expanded={nestedOpen}
                            >
                              <span className="flex items-center gap-2">
                                {child.icon}
                                <span>{child.label}</span>
                              </span>
                              <span
                                className={`text-[10px] text-text-muted transition-transform ${
                                  nestedOpen ? 'rotate-90' : ''
                                }`}
                              >
                                ›
                              </span>
                            </button>
                            {nestedOpen && (
                              <div className="ml-2 space-y-0.5 border-l border-border-muted pl-2">
                                {child.children.map((leaf) => {
                                  const leafActive = isLeafActive(pathname, leaf.href);
                                  return (
                                    <Link
                                      key={leaf.href}
                                      href={leaf.href}
                                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-[11px] transition-colors ${
                                        leafActive
                                          ? 'bg-panel-hover font-medium text-positive'
                                          : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                                      }`}
                                    >
                                      {leaf.icon}
                                      <span>{leaf.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const childActive = isLeafActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                            childActive
                              ? 'bg-panel-hover font-medium text-positive'
                              : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
                          }`}
                        >
                          {child.icon}
                          <span>{child.label}</span>
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
              className={`flex items-center rounded text-sm transition-colors ${
                collapsed ? 'justify-center px-0 py-2' : 'justify-between gap-2 px-3 py-2'
              } ${
                active
                  ? 'bg-panel-hover font-medium text-positive'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
              }`}
            >
              {collapsed ? (
                item.icon
              ) : (
                <>
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.href === '/alerts' && <AlertBadge />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-border ${collapsed ? 'px-1.5 py-3' : 'px-4 py-3'}`}>
        <MembershipCountdown collapsed={collapsed} />

        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-8 w-8 items-center justify-center rounded text-text-secondary"
              title={displayName}
              aria-label={displayName}
            >
              <UserIcon />
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded text-text-secondary transition-colors hover:bg-panel-hover hover:text-negative"
              title="Log out"
              aria-label="Log out"
            >
              <LogoutIcon />
            </button>
            <Link
              href="/legal"
              title="Disclaimer On — Terms & Condition"
              aria-label="Disclaimer On — Terms & Condition"
              className="flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:bg-panel-hover hover:text-positive"
            >
              <LegalIcon />
            </Link>
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
            <Link
              href="/legal"
              className="mt-3 block text-[10px] leading-relaxed text-text-muted underline-offset-2 hover:text-positive hover:underline"
            >
              Disclaimer On — Terms &amp; Condition
            </Link>
            {/* <p className="mt-1 text-[9px] leading-relaxed text-text-muted">
              Privacy, T&amp;C, and disclaimer letter.
            </p> */}
          </>
        )}
      </div>
    </aside>
  );
}
