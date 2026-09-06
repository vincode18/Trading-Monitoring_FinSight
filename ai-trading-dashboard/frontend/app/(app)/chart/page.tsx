'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/lib/watchlist-context';

export default function ChartIndexPage() {
  const router = useRouter();
  const { selectedSymbol, watchlist } = useWatchlist();

  useEffect(() => {
    const s = selectedSymbol || watchlist[0] || 'AAPL';
    router.replace(`/chart/${encodeURIComponent(s)}`);
  }, [selectedSymbol, watchlist, router]);

  return (
    <div className="flex h-64 items-center justify-center text-sm text-text-muted">
      Membuka chart...
    </div>
  );
}
