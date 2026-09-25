'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/lib/watchlist-context';

export default function AnalysisIndexPage() {
  const router = useRouter();
  const { selectedSymbol, watchlist } = useWatchlist();

  useEffect(() => {
    const symbol = selectedSymbol || watchlist[0];
    const href = symbol
      ? `/analysis/overview?symbol=${encodeURIComponent(symbol)}`
      : '/analysis/overview';
    router.replace(href);
  }, [router, selectedSymbol, watchlist]);

  return <p className="px-6 py-8 text-xs text-text-muted">Opening Analysis Overview...</p>;
}
