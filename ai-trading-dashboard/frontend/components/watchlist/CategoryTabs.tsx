'use client';

import type { WatchlistCategory } from '@/types/market';

const TABS: { id: WatchlistCategory; label: string }[] = [
  { id: 'my', label: 'My Watchlist' },
  { id: 'tech', label: 'Tech Stocks' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
];

export function CategoryTabs({
  active,
  onChange,
}: {
  active: WatchlistCategory;
  onChange: (id: WatchlistCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-0">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`border-b-2 px-3 py-2 text-xs font-medium transition ${
            active === t.id
              ? 'border-positive text-positive'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
