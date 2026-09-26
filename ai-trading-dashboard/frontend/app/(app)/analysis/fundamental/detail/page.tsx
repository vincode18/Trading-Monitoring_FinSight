'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { StrategyBrief } from '@/components/analysis/StrategyBrief';
import { StrategyScreener } from '@/components/analysis/StrategyScreener';
import { FundamentalAnalysisPanel } from '@/components/analysis/fundamental/FundamentalAnalysisPanel';
import { api } from '@/lib/api';

function FundamentalStrategyContent() {
  const searchParams = useSearchParams();
  const symbol = searchParams.get('symbol');
  const strategy = searchParams.get('strategy');
  const yieldLimit = Number(searchParams.get('yield') || '2');
  const minYield = Number.isFinite(yieldLimit) ? yieldLimit : 2;
  const { data, error, isLoading } = useSWR(
    symbol && strategy ? ['fundamental-strategy', symbol, strategy, minYield] : null,
    () => api.getFundamentalStrategy(symbol as string, strategy as string, minYield)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-muted">
            Analysis · Fundamental Analysis
          </p>
          <h1 className="text-h1 text-text-primary">Screener Fundamental</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {symbol && strategy
              ? `Rule check for ${symbol}.`
              : 'Equities in the selected market that meet a fundamental rule.'}
          </p>
        </div>
      </div>

      {symbol && strategy ? (
        <div className="space-y-4">
          <Link href="/analysis/fundamental/detail" className="text-xs text-positive">
            Back to the screen
          </Link>
          {isLoading && !data && <p className="text-xs text-text-muted">Loading the rule check...</p>}
          {error && <p className="text-xs text-negative">The rule check could not be loaded.</p>}
          {data && (
            <StrategyBrief
              name={data.name}
              explanation={data.explanation}
              conditions={data.conditions}
              tradePlan={data.trade_plan}
            />
          )}
          <FundamentalAnalysisPanel symbol={symbol.toUpperCase()} />
        </div>
      ) : (
        <StrategyScreener kind="fundamental" />
      )}
    </div>
  );
}

export default function FundamentalStrategyPage() {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-xs text-text-muted">Loading fundamental strategy...</p>}>
      <FundamentalStrategyContent />
    </Suspense>
  );
}
