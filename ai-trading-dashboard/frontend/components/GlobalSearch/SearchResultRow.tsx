'use client';

import type { QuoteSnapshot, SymbolSearchResult } from '@/types/market';
import { formatPercent, formatPrice, isPositive } from '@/lib/format';

export function SearchResultRow({
  item,
  quote,
  active,
  onSelect,
  onHover,
}: {
  item: SymbolSearchResult;
  quote?: QuoteSnapshot;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const name = quote?.name || item.name;
  const price = quote?.last_price ?? null;
  const changePct = quote?.change_pct ?? null;
  const state = quote?.market_state;
  const meta = [item.exchange, item.type].filter(Boolean).join(' · ');

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors ${
        active
          ? 'border-positive bg-panel-hover'
          : 'border-transparent hover:bg-panel-hover/60'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-medium text-text-primary">{item.symbol}</span>
          <span className="truncate text-xs text-text-secondary">{name}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-text-muted">
          {meta && <span>{meta}</span>}
          {state && (
            <span className="rounded-sm bg-border-muted px-1.5 py-0.5 uppercase tracking-wide">
              {state}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm tabular-nums text-text-primary">
          {formatPrice(price)}
        </div>
        <div
          className={`font-mono text-[11px] tabular-nums ${
            isPositive(changePct) ? 'text-positive' : 'text-negative'
          }`}
        >
          {formatPercent(changePct)}
        </div>
      </div>
    </button>
  );
}
