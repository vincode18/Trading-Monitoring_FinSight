'use client';

import type { QuoteSnapshot, SymbolSearchResult } from '@/types/market';
import { SearchResultRow } from './SearchResultRow';

export function SearchResultGroup({
  title,
  items,
  quotes,
  flatOffset,
  activeIndex,
  onSelect,
  onHoverIndex,
}: {
  title: string;
  items: SymbolSearchResult[];
  quotes: Record<string, QuoteSnapshot>;
  flatOffset: number;
  activeIndex: number;
  onSelect: (symbol: string) => void;
  onHoverIndex: (index: number) => void;
}) {
  if (!items.length) return null;

  return (
    <section className="py-1">
      <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
        {title}
      </div>
      <div className="divide-y divide-border-muted">
        {items.map((item, i) => {
          const index = flatOffset + i;
          return (
            <SearchResultRow
              key={`${item.symbol}-${index}`}
              item={item}
              quote={quotes[item.symbol]}
              active={index === activeIndex}
              onSelect={() => onSelect(item.symbol)}
              onHover={() => onHoverIndex(index)}
            />
          );
        })}
      </div>
    </section>
  );
}
