'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/lib/watchlist-context';
import { GlobalSearchModal } from './GlobalSearchModal';

interface GlobalSearchContextValue {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { watchlist, setSelectedSymbol } = useWatchlist();

  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  const toggleSearch = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const onSelectSymbol = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      router.push(`/chart/${encodeURIComponent(symbol)}`);
    },
    [router, setSelectedSymbol]
  );

  const value = useMemo(
    () => ({ open, openSearch, closeSearch, toggleSearch }),
    [open, openSearch, closeSearch, toggleSearch]
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
      <GlobalSearchModal
        open={open}
        onClose={closeSearch}
        watchlist={watchlist}
        onSelectSymbol={onSelectSymbol}
      />
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearchUi() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) throw new Error('useGlobalSearchUi must be used within GlobalSearchProvider');
  return ctx;
}
