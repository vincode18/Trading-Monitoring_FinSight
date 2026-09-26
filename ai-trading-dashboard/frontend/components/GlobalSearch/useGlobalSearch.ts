'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  COMMODITY_SYMBOLS,
  MARKET_CONFIG,
  MARKET_LABELS,
  searchForexPool,
  searchIndexPool,
} from '@/lib/marketConfig';
import type { QuoteSnapshot, SymbolSearchResult } from '@/types/market';

export type SearchTab =
  | 'all'
  | 'watchlist'
  | 'us'
  | 'indonesia'
  | 'crypto'
  | 'forex'
  | 'indices'
  | 'commodities';

export const SEARCH_TABS: { id: SearchTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'us', label: 'US' },
  { id: 'indonesia', label: 'Indonesia' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'forex', label: 'Forex' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
];

function asResults(symbols: string[]): SymbolSearchResult[] {
  return symbols.map((symbol) => ({
    symbol,
    name: MARKET_LABELS[symbol] ?? symbol,
    exchange: null,
    type: null,
  }));
}

function inList(list: string[], symbol: string) {
  const u = symbol.toUpperCase();
  return list.some((s) => s.toUpperCase() === u);
}

function poolForTab(tab: Exclude<SearchTab, 'all' | 'watchlist'>): string[] {
  switch (tab) {
    case 'us':
      return [...MARKET_CONFIG.us.moverPoolSymbols];
    case 'indonesia':
      return [...MARKET_CONFIG.indonesia.moverPoolSymbols];
    case 'crypto':
      return [...MARKET_CONFIG.crypto.moverPoolSymbols];
    case 'forex':
      return searchForexPool();
    case 'indices':
      return searchIndexPool();
    case 'commodities':
      return [...COMMODITY_SYMBOLS];
  }
}

export function useGlobalSearch(watchlist: string[], open: boolean) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [rawResults, setRawResults] = useState<SymbolSearchResult[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveTab('all');
      setRawResults([]);
      setQuotes({});
      setActiveIndex(0);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setRawResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await api.searchSymbol(q);
        setRawResults(results);
      } catch {
        setRawResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, open]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Browse mode: empty/short query on a scoped tab → show pool / watchlist
    if (q.length < 2) {
      if (activeTab === 'watchlist') return asResults(watchlist);
      if (activeTab === 'all') return asResults(watchlist.slice(0, 8));
      return asResults(poolForTab(activeTab).slice(0, 20));
    }

    if (activeTab === 'all') return rawResults;
    if (activeTab === 'watchlist') {
      return rawResults.filter((r) => inList(watchlist, r.symbol));
    }
    const pool = poolForTab(activeTab);
    const fromSearch = rawResults.filter((r) => inList(pool, r.symbol));
    // Also surface pool matches by ticker/name when YF search misses
    const poolHits = asResults(pool).filter(
      (r) =>
        r.symbol.toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q)
    );
    const seen = new Set(fromSearch.map((r) => r.symbol.toUpperCase()));
    for (const hit of poolHits) {
      if (!seen.has(hit.symbol.toUpperCase())) {
        fromSearch.push(hit);
        seen.add(hit.symbol.toUpperCase());
      }
    }
    return fromSearch;
  }, [rawResults, activeTab, watchlist, query]);

  useEffect(() => {
    const symbolsToFetch = filteredResults.slice(0, 10).map((r) => r.symbol);
    if (!symbolsToFetch.length) {
      setQuotes({});
      return;
    }
    let cancelled = false;
    api
      .getWatchlistQuotes(symbolsToFetch)
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, QuoteSnapshot> = {};
        results.forEach((quote) => {
          map[quote.symbol] = quote;
        });
        setQuotes(map);
      })
      .catch(() => {
        if (!cancelled) setQuotes({});
      });
    return () => {
      cancelled = true;
    };
  }, [filteredResults]);

  const groupedResults = useMemo(() => {
    const inWatchlist = filteredResults.filter((r) => inList(watchlist, r.symbol));
    const others = filteredResults.filter((r) => !inList(watchlist, r.symbol));
    return { inWatchlist, others };
  }, [filteredResults, watchlist]);

  const flatResults = useMemo(
    () => [...groupedResults.inWatchlist, ...groupedResults.others],
    [groupedResults]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [filteredResults, activeTab]);

  const cycleTab = useCallback((dir: 1 | -1) => {
    setActiveTab((cur) => {
      const i = SEARCH_TABS.findIndex((t) => t.id === cur);
      const next = (i + dir + SEARCH_TABS.length) % SEARCH_TABS.length;
      return SEARCH_TABS[next].id;
    });
  }, []);

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    cycleTab,
    groupedResults,
    flatResults,
    quotes,
    loading,
    activeIndex,
    setActiveIndex,
  };
}
