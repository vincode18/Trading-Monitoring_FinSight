'use client';

import { NewsItem } from '@/types/market';
import { formatDate } from '@/lib/format';

interface NewsPanelProps {
  news: NewsItem[];
  loading: boolean;
}

export function NewsPanel({ news, loading }: NewsPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-panel" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-text-muted">
        Tidak ada berita ditemukan.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {news.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col gap-0.5 rounded-sm border-b border-border-muted px-2 py-2.5 last:border-0 hover:bg-panel"
        >
          <span className="text-sm text-text-primary group-hover:text-positive">
            {item.title}
          </span>
          <span className="text-xs text-text-muted">
            {item.publisher} · {formatDate(item.published_at, true)}
          </span>
        </a>
      ))}
    </div>
  );
}
