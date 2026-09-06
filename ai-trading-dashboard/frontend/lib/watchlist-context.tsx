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
import type { WatchlistCategory } from '@/types/market';

const DEFAULT_WATCHLIST = ['BBCA.JK', 'BBRI.JK', 'TLKM.JK', 'AAPL', 'MSFT', 'BTC-USD'];
export const WATCHLIST_STORAGE_KEY = 'trading-dashboard-watchlist';
export const WATCHLIST_META_KEY = 'trading-dashboard-watchlist-meta';

const TECH = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX']);
const CRYPTO = new Set(['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD']);
const FOREX = new Set(['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X']);

function inferCategory(symbol: string): WatchlistCategory {
  const s = symbol.toUpperCase();
  if (CRYPTO.has(s) || s.endsWith('-USD') || s.includes('USDT')) return 'crypto';
  if (FOREX.has(s) || s.endsWith('=X')) return 'forex';
  if (TECH.has(s)) return 'tech';
  return 'my';
}

interface WatchlistContextValue {
  watchlist: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (symbol: string | null) => void;
  addSymbol: (symbol: string, category?: WatchlistCategory) => void;
  removeSymbol: (symbol: string) => void;
  getCategory: (symbol: string) => WatchlistCategory;
  filterByCategory: (category: WatchlistCategory | 'all') => string[];
  ready: boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [meta, setMeta] = useState<Record<string, WatchlistCategory>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    const savedMeta = window.localStorage.getItem(WATCHLIST_META_KEY);
    let list = DEFAULT_WATCHLIST;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch {
        /* keep default */
      }
    }
    let categories: Record<string, WatchlistCategory> = {};
    if (savedMeta) {
      try {
        categories = JSON.parse(savedMeta);
      } catch {
        categories = {};
      }
    }
    for (const s of list) {
      if (!categories[s]) categories[s] = inferCategory(s);
    }
    setWatchlist(list);
    setMeta(categories);
    setSelectedSymbol(list[0] ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    window.localStorage.setItem(WATCHLIST_META_KEY, JSON.stringify(meta));
  }, [watchlist, meta, ready]);

  const addSymbol = useCallback((symbol: string, category?: WatchlistCategory) => {
    const s = symbol.toUpperCase();
    setWatchlist((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setMeta((prev) => ({ ...prev, [s]: category ?? inferCategory(s) }));
    setSelectedSymbol(s);
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((s) => s !== symbol);
      setSelectedSymbol((cur) => (cur === symbol ? next[0] ?? null : cur));
      return next;
    });
    setMeta((prev) => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
  }, []);

  const getCategory = useCallback(
    (symbol: string) => meta[symbol] ?? inferCategory(symbol),
    [meta]
  );

  const filterByCategory = useCallback(
    (category: WatchlistCategory | 'all') => {
      if (category === 'all') return watchlist;
      if (category === 'my') return watchlist;
      return watchlist.filter((s) => getCategory(s) === category);
    },
    [watchlist, getCategory]
  );

  const value = useMemo(
    () => ({
      watchlist,
      selectedSymbol,
      setSelectedSymbol,
      addSymbol,
      removeSymbol,
      getCategory,
      filterByCategory,
      ready,
    }),
    [
      watchlist,
      selectedSymbol,
      addSymbol,
      removeSymbol,
      getCategory,
      filterByCategory,
      ready,
    ]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
