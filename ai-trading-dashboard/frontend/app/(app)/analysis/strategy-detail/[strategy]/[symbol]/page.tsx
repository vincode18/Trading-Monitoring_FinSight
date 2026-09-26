'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CalculationDetail } from '@/components/analysis/CalculationDetail';
import { EntryPointRecommendation } from '@/components/analysis/EntryPointRecommendation';
import { StrategyChart } from '@/components/analysis/StrategyChart';
import { StrategyReason } from '@/components/analysis/StrategyReason';
import { SupportResistancePanel } from '@/components/analysis/SupportResistancePanel';
import { buildStrategyOverlay } from '@/components/analysis/strategyOverlay';
import { api } from '@/lib/api';
import type { ScreenCondition, TradePlan } from '@/types/market';

const FUNDAMENTAL = new Set([
  'minervini-fundamentals',
  'graham-number',
  'dividend-yield',
  'analyst-consensus',
]);

function StrategyDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const strategy = decodeURIComponent(String(params.strategy || ''));
  const symbol = decodeURIComponent(String(params.symbol || '')).toUpperCase();
  const yieldLimit = Number(searchParams.get('yield') || '2');
  const minYield = Number.isFinite(yieldLimit) ? yieldLimit : 2;
  const fundamental = FUNDAMENTAL.has(strategy);

  const { data: technical, error: technicalError } = useSWR(
    !fundamental && symbol && strategy ? ['strategy-detail', symbol, strategy] : null,
    () => api.getStrategy(symbol, strategy)
  );
  const { data: fundamentalData, error: fundamentalError } = useSWR(
    fundamental && symbol && strategy ? ['fundamental-detail', symbol, strategy, minYield] : null,
    () => api.getFundamentalStrategy(symbol, strategy, minYield)
  );
  const { data: chart, isLoading: chartLoading } = useSWR(
    symbol ? ['strategy-chart', symbol] : null,
    () => api.getChart(symbol, '6mo', '1d')
  );
  const { data: levels } = useSWR(symbol ? ['strategy-sr', symbol] : null, () =>
    api.getSupportResistance(symbol)
  );

  const overlay = useMemo(
    () => (chart && !fundamental ? buildStrategyOverlay(chart.candles, strategy) : null),
    [chart, fundamental, strategy]
  );

  const name = technical?.name || fundamentalData?.name || strategy;
  const explanation = technical?.explanation || fundamentalData?.explanation || '';
  const tradePlan: TradePlan | null | undefined = technical?.trade_plan || fundamentalData?.trade_plan;
  const conditions: ScreenCondition[] = fundamental
    ? fundamentalData?.conditions || []
    : (technical?.states || []).map((state) => ({
        code: state.code,
        label: state.label,
        met: state.active,
      }));
  const readings = technical?.readings?.length
    ? technical.readings
    : conditions.map((row) => ({ label: row.label, value: row.met ? 'Yes' : 'No' }));
  const error = technicalError || fundamentalError;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-5 py-5">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-text-muted">Strategy detail analysis</p>
        <h1 className="text-h1 text-text-primary">
          {name} — <span className="font-mono">{symbol}</span>
        </h1>
        <Link
          href={fundamental ? '/analysis/fundamental/detail' : '/analysis/technical/detail'}
          className="mt-2 inline-block text-xs text-positive"
        >
          Back to the screen
        </Link>
      </div>

      {chartLoading && !chart && <p className="text-xs text-text-muted">Loading chart...</p>}
      {chart && <StrategyChart data={chart} overlay={overlay} />}

      {error && <p className="text-xs text-negative">The strategy detail could not be loaded.</p>}
      <StrategyReason status={tradePlan?.status} conditions={conditions} />
      <CalculationDetail readings={readings} />

      {explanation && (
        <section className="rounded-md border border-border bg-panel p-4">
          <h2 className="text-xs font-medium text-text-primary">Detailed explanation</h2>
          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{explanation}</p>
        </section>
      )}

      {tradePlan && <EntryPointRecommendation plan={tradePlan} />}
      {levels && <SupportResistancePanel support={levels.support} resistance={levels.resistance} />}
    </div>
  );
}

export default function StrategyDetailPage() {
  return (
    <Suspense fallback={<p className="px-6 py-8 text-xs text-text-muted">Loading strategy detail...</p>}>
      <StrategyDetailContent />
    </Suspense>
  );
}
