'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { PortfolioSummaryCards } from '@/components/portfolio/PortfolioSummaryCards';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { AddHoldingModal } from '@/components/portfolio/AddHoldingModal';

export default function PortfolioPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, mutate } = useSWR(
    'portfolio-summary',
    () => api.getPortfolioSummary(),
    { refreshInterval: 30_000 }
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Portfolio</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manual holding notes — unrealized P&amp;L from latest market prices. Not order
            execution.
          </p>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-text-muted">
            Portfolio is manual record-keeping — it is not connected to any real broker/exchange.
            Prices and portfolio value are estimates for personal research, not an official
            transaction record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded bg-positive px-3 py-2 text-xs font-semibold text-canvas"
        >
          + Add Holding
        </button>
      </div>

      {isLoading && !data ? (
        <p className="text-xs text-text-muted">Loading portfolio...</p>
      ) : data ? (
        <>
          <PortfolioSummaryCards summary={data} />
          <HoldingsTable holdings={data.holdings} onChanged={() => mutate()} />
        </>
      ) : null}

      <AddHoldingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => mutate()}
      />
    </div>
  );
}
