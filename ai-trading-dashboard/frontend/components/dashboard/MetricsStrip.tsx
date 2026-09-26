'use client';

import type { FearGreed, MarketSummary, QuoteSnapshot } from '@/types/market';
import type { MarketId } from '@/lib/marketConfig';
import { formatPercent, isPositive } from '@/lib/format';

function fmtCap(v: number | null) {
  if (v === null || v === undefined) return '—';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toFixed(0)}`;
}

export function MetricsStrip({
  market,
  summary,
  fearGreed,
  indexQuote,
}: {
  market: MarketId;
  summary: MarketSummary | undefined;
  fearGreed: FearGreed | undefined;
  indexQuote: QuoteSnapshot | undefined;
}) {
  const cryptoItems = [
    { label: 'Crypto Market Cap', value: fmtCap(summary?.total_market_cap ?? null) },
    { label: '24h Volume (est.)', value: fmtCap(summary?.total_volume_24h ?? null) },
    {
      label: 'BTC Dominance',
      value: summary?.btc_dominance != null ? `${summary.btc_dominance.toFixed(1)}%` : '—',
    },
    {
      label: 'F&G Placeholder',
      value: fearGreed?.value != null ? String(fearGreed.value) : fearGreed?.label ?? '—',
    },
  ];

  const equityItems = [
    {
      label: 'Index Change',
      value: formatPercent(indexQuote?.change_pct ?? null),
      tone: isPositive(indexQuote?.change_pct ?? null) ? 'pos' : 'neg',
    },
    {
      label: 'Last Price',
      value:
        indexQuote?.last_price != null
          ? indexQuote.last_price.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : '—',
    },
    {
      label: 'Prev Close',
      value:
        indexQuote?.prev_close != null
          ? indexQuote.prev_close.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : '—',
    },
    {
      label: 'Market State',
      value: indexQuote?.market_state ?? '—',
    },
  ];

  const items = market === 'crypto' ? cryptoItems : equityItems;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-panel px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {item.label}
          </div>
          <div
            className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
              'tone' in item && item.tone === 'pos'
                ? 'text-positive'
                : 'tone' in item && item.tone === 'neg'
                  ? 'text-negative'
                  : 'text-text-primary'
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
