'use client';

import { Suspense } from 'react';
import { StrategyScreener } from '@/components/analysis/StrategyScreener';

function TechnicalStrategyContent() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            Analysis · Technical Analysis
          </p>
          <h1 className="text-h1 text-text-primary">Screener Technical</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Symbols in the chosen pool whose latest bar meets a strategy&apos;s bullish rule.
          </p>
        </div>
      </div>
      <StrategyScreener kind="technical" />
    </div>
  );
}

export default function TechnicalStrategyPage() {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-xs text-text-muted">Loading technical strategy...</p>}>
      <TechnicalStrategyContent />
    </Suspense>
  );
}
