'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { NewsCard } from '@/components/news/NewsCard';

const TABS = [
  { id: 'top', label: 'Top News' },
  { id: 'market', label: 'Market News' },
  { id: 'my', label: 'My News' },
  { id: 'all', label: 'All' },
] as const;

export default function NewsPage() {
  const { watchlist, selectedSymbol } = useWatchlist();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('my');

  const symbol =
    tab === 'market'
      ? '^GSPC'
      : tab === 'top'
        ? 'AAPL'
        : selectedSymbol || watchlist[0] || 'AAPL';

  const { data: news, isLoading } = useSWR(['news-page', symbol, tab], () =>
    api.getNews(symbol)
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-5">
      <h1 className="text-h1 text-text-primary">News</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Headline terkait pasar dan simbol di watchlist kamu.
      </p>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-xs font-medium ${
              tab === t.id
                ? 'border-positive text-positive'
                : 'border-transparent text-text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-panel" />
            ))}
          </div>
        )}
        {!isLoading &&
          (news ?? []).map((item, i) => <NewsCard key={i} item={item} />)}
        {!isLoading && !news?.length && (
          <p className="py-12 text-center text-sm text-text-muted">Tidak ada berita.</p>
        )}
      </div>
    </div>
  );
}
