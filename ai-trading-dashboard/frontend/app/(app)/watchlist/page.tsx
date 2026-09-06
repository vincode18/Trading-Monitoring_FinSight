'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { WatchlistTable } from '@/components/WatchlistTable';
import { CategoryTabs } from '@/components/watchlist/CategoryTabs';
import { AddSymbolModal } from '@/components/watchlist/AddSymbolModal';
import type { WatchlistCategory } from '@/types/market';

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, selectedSymbol, setSelectedSymbol, addSymbol, filterByCategory } =
    useWatchlist();
  const [category, setCategory] = useState<WatchlistCategory>('my');
  const [modalOpen, setModalOpen] = useState(false);

  const symbols = useMemo(() => {
    if (category === 'my') return watchlist;
    return filterByCategory(category);
  }, [category, watchlist, filterByCategory]);

  const { data: quotes, isLoading } = useSWR(
    symbols.length ? ['wl-quotes', symbols] : null,
    () => api.getWatchlistQuotes(symbols),
    { refreshInterval: 30_000 }
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Watchlist</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Kelompokkan simbol dan buka chart dengan satu klik.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas"
        >
          + Add Symbol
        </button>
      </div>

      <CategoryTabs active={category} onChange={setCategory} />

      <div className="mt-4">
        <WatchlistTable
          quotes={quotes ?? []}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={(s) => {
            setSelectedSymbol(s);
            router.push(`/chart/${encodeURIComponent(s)}`);
          }}
          loading={isLoading}
        />
      </div>

      <AddSymbolModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(s) => addSymbol(s)}
      />
    </div>
  );
}
