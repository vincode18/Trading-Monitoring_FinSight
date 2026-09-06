'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { WatchlistCategory } from '@/types/market';
import { api } from '@/lib/api';

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

function readLocalWatchlist(): string[] {
  try {
    const saved = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!saved) return [...DEFAULT_WATCHLIST];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* keep default */
  }
  return [...DEFAULT_WATCHLIST];
}

function readLocalMeta(): Record<string, WatchlistCategory> {
  try {
    const savedMeta = window.localStorage.getItem(WATCHLIST_META_KEY);
    if (savedMeta) return JSON.parse(savedMeta);
  } catch {
    /* empty */
  }
  return {};
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
  syncedToAccount: boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [meta, setMeta] = useState<Record<string, WatchlistCategory>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncedToAccount, setSyncedToAccount] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const localList = readLocalWatchlist();
      const categories = readLocalMeta();
      for (const s of localList) {
        if (!categories[s]) categories[s] = inferCategory(s);
      }

      try {
        await api.me();
        if (cancelled) return;

        let server = await api.getUserWatchlist();
        if (cancelled) return;

        if (server.symbols.length === 0 && localList.length > 0) {
          server = await api.replaceUserWatchlist(localList);
        }

        const list = server.symbols.length > 0 ? server.symbols : localList;
        const nextMeta = { ...categories };
        for (const s of list) {
          if (!nextMeta[s]) nextMeta[s] = inferCategory(s);
        }

        setWatchlist(list);
        setMeta(nextMeta);
        setSelectedSymbol(list[0] ?? null);
        setSyncedToAccount(true);
        syncedRef.current = true;
      } catch {
        if (cancelled) return;
        setWatchlist(localList);
        setMeta(categories);
        setSelectedSymbol(localList[0] ?? null);
        setSyncedToAccount(false);
        syncedRef.current = false;
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
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
    if (syncedRef.current) {
      api.addUserWatchlistSymbol(s).catch(() => {
        /* keep local optimistic state */
      });
    }
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const next = prev.filter((x) => x !== symbol);
      setSelectedSymbol((cur) => (cur === symbol ? next[0] ?? null : cur));
      return next;
    });
    setMeta((prev) => {
      const copy = { ...prev };
      delete copy[symbol];
      return copy;
    });
    if (syncedRef.current) {
      api.removeUserWatchlistSymbol(symbol).catch(() => {
        /* keep local optimistic state */
      });
    }
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
      syncedToAccount,
    }),
    [
      watchlist,
      selectedSymbol,
      addSymbol,
      removeSymbol,
      getCategory,
      filterByCategory,
      ready,
      syncedToAccount,
    ]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
