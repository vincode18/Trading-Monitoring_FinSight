'use client';

import { useMarket } from '@/lib/market-context';
import type { MarketId } from '@/lib/marketConfig';
import { MARKET_CONFIG } from '@/lib/marketConfig';

const TABS = Object.keys(MARKET_CONFIG) as MarketId[];

export function MarketTabs() {
  const { selectedMarket, setSelectedMarket } = useMarket();

  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((id) => {
        const active = selectedMarket === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedMarket(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'bg-positive text-canvas'
                : 'border border-border bg-panel text-text-secondary hover:text-text-primary'
            }`}
          >
            {MARKET_CONFIG[id].label}
          </button>
        );
      })}
    </div>
  );
}
