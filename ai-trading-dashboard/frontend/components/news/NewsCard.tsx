'use client';

import type { NewsItem } from '@/types/market';
import { formatDate } from '@/lib/format';

export function NewsCard({ item }: { item: NewsItem }) {
  const initial = (item.publisher || 'N').charAt(0).toUpperCase();

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-md border border-border bg-panel p-3 transition hover:border-text-muted"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-canvas text-sm font-semibold text-positive">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-text-primary group-hover:text-positive">{item.title}</div>
        <div className="mt-1 text-[10px] text-text-muted">
          {item.publisher} · {formatDate(item.published_at, true)}
        </div>
      </div>
    </a>
  );
}
