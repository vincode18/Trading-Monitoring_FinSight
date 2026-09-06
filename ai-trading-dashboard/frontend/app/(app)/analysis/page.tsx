'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { IndicatorSignalRow } from '@/components/analysis/IndicatorSignalRow';
import { SupportResistancePanel } from '@/components/analysis/SupportResistancePanel';
import Link from 'next/link';

export default function AnalysisOverviewPage() {
  const { watchlist, selectedSymbol, setSelectedSymbol } = useWatchlist();
  const symbol = selectedSymbol || watchlist[0] || 'AAPL';

  const { data: score, isLoading } = useSWR(['analysis-score', symbol], () =>
    api.getAnalysisScore(symbol)
  );
  const { data: sr } = useSWR(['analysis-sr', symbol], () =>
    api.getSupportResistance(symbol)
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Analysis</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Overview skor teknikal untuk simbol terpilih.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={symbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs"
          >
            {watchlist.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Link
            href={`/analysis/${encodeURIComponent(symbol)}`}
            className="rounded border border-border px-3 py-1.5 text-xs text-text-primary hover:border-positive"
          >
            Detail →
          </Link>
        </div>
      </div>

      {isLoading && !score && (
        <p className="text-sm text-text-muted">Menghitung skor...</p>
      )}

      {score && (
        <div className="grid gap-4 lg:grid-cols-3">
          <ScoreGauge score={score.score} label={score.label} />
          <div className="rounded-md border border-border bg-panel lg:col-span-2">
            <div className="border-b border-border px-4 py-3 text-h2 text-text-primary">
              Key Indicators
            </div>
            {(score.indicators ?? []).map((ind) => (
              <IndicatorSignalRow
                key={ind.name}
                name={ind.name}
                value={ind.value}
                signal={ind.signal}
              />
            ))}
          </div>
        </div>
      )}

      {sr && (
        <SupportResistancePanel support={sr.support} resistance={sr.resistance} />
      )}

      <p className="rounded-md border border-border-muted bg-panel/50 px-3 py-2 text-[10px] text-text-muted">
        {score?.disclaimer ||
          'Badge Buy/Sell di sini adalah ringkasan matematis indikator — bukan rekomendasi finansial.'}
      </p>
    </div>
  );
}
