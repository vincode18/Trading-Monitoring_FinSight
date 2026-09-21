'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { MARKET_CONFIG, type MarketId } from '@/lib/marketConfig';
import { TICKER_MOVER_LIMIT } from '@/lib/sectorBaskets';
import type { QuoteSnapshot } from '@/types/market';

interface MarketContextValue {
  selectedMarket: MarketId;
  setSelectedMarket: (m: MarketId) => void;
  config: (typeof MARKET_CONFIG)[MarketId];
  /** Snapshot pool for movers + ticker (fetched once per market). */
  poolQuotes: QuoteSnapshot[];
  poolLoading: boolean;
  /** Index + top movers by |change_pct| for status strip. */
  tickerQuotes: QuoteSnapshot[];
}

const MarketContext = createContext<MarketContextValue | null>(null);

function buildTickerQuotes(
  indexSymbols: readonly string[],
  pool: QuoteSnapshot[],
  limit: number
): QuoteSnapshot[] {
  const bySym = new Map(pool.map((q) => [q.symbol, q]));
  const indexItems: QuoteSnapshot[] = [];
  for (const s of indexSymbols) {
    const q = bySym.get(s);
    if (q) indexItems.push(q);
  }
  const indexSet = new Set(indexSymbols);
  const movers = pool
    .filter((q) => !indexSet.has(q.symbol) && q.change_pct != null)
    .sort((a, b) => Math.abs(b.change_pct ?? 0) - Math.abs(a.change_pct ?? 0))
    .slice(0, limit);
  // Prefer overview-fetched index if not in pool
  return [...indexItems, ...movers];
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [selectedMarket, setSelectedMarket] = useState<MarketId>('us');
  const config = MARKET_CONFIG[selectedMarket];

  const fetchSymbols = useMemo(() => {
    const set = new Set<string>([...config.tickerSymbols, ...config.moverPoolSymbols]);
    return Array.from(set);
  }, [config]);

  const { data: poolQuotes = [], isLoading: poolLoading } = useSWR(
    ['market-pool', selectedMarket, fetchSymbols.join(',')],
    () => api.getWatchlistQuotes(fetchSymbols),
    { refreshInterval: 45_000 }
  );

  const tickerQuotes = useMemo(
    () => buildTickerQuotes(config.tickerSymbols, poolQuotes, TICKER_MOVER_LIMIT),
    [config.tickerSymbols, poolQuotes]
  );

  const value = useMemo(
    () => ({
      selectedMarket,
      setSelectedMarket,
      config,
      poolQuotes,
      poolLoading,
      tickerQuotes,
    }),
    [selectedMarket, config, poolQuotes, poolLoading, tickerQuotes]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within MarketProvider');
  return ctx;
}
