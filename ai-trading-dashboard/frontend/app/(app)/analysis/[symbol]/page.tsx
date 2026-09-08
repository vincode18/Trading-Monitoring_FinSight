'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { RadarChart } from '@/components/analysis/RadarChart';
import { IndicatorSignalRow } from '@/components/analysis/IndicatorSignalRow';
import { SupportResistancePanel } from '@/components/analysis/SupportResistancePanel';
import { formatPrice } from '@/lib/format';

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol =
    typeof params.symbol === 'string' ? decodeURIComponent(params.symbol) : 'AAPL';
  const { watchlist, setSelectedSymbol } = useWatchlist();

  useEffect(() => {
    setSelectedSymbol(symbol);
  }, [symbol, setSelectedSymbol]);

  const { data: score } = useSWR(['score-detail', symbol], () => api.getAnalysisScore(symbol));
  const { data: radar } = useSWR(['radar', symbol], () => api.getRadar(symbol));
  const { data: sr } = useSWR(['sr-detail', symbol], () => api.getSupportResistance(symbol));
  const { data: chart } = useSWR(['chart-ma', symbol], () => api.getChart(symbol, '1y', '1d'));

  const last = chart?.indicators?.[chart.indicators.length - 1];
  const trend =
    last?.ma20 != null && last?.ma50 != null
      ? last.ma20 > last.ma50
        ? 'Uptrend'
        : 'Downtrend'
      : '—';
  const strength =
    score && score.score >= 65 ? 'Strong' : score && score.score <= 35 ? 'Weak' : 'Moderate';

  const maRows = [
    { name: 'MA20', value: last?.ma20 ?? null },
    { name: 'MA50', value: last?.ma50 ?? null },
    { name: 'MA100', value: last?.ma100 ?? null },
    { name: 'MA200', value: last?.ma200 ?? null },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-5 py-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Analysis Detail</h1>
          <select
            value={symbol}
            onChange={(e) => router.push(`/analysis/${encodeURIComponent(e.target.value)}`)}
            className="mt-2 rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs"
          >
            {watchlist.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="rounded-md border border-border bg-panel px-4 py-2">
            <div className="text-[10px] uppercase text-text-muted">Trend</div>
            <div
              className={`text-sm font-semibold ${
                trend === 'Uptrend' ? 'text-positive' : 'text-negative'
              }`}
            >
              {trend}
            </div>
          </div>
          <div className="rounded-md border border-border bg-panel px-4 py-2">
            <div className="text-[10px] uppercase text-text-muted">Strength</div>
            <div className="text-sm font-semibold text-text-primary">{strength}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {score && <ScoreGauge score={score.score} label={score.label} />}
        {radar && <RadarChart data={radar} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-panel">
          <div className="border-b border-border px-4 py-3 text-h2">Moving Averages</div>
          {maRows.map((row) => (
            <IndicatorSignalRow
              key={row.name}
              name={row.name}
              value={row.value}
              signal={
                last?.ma20 != null && row.value != null
                  ? last.ma20 >= row.value
                    ? 'Bullish bias'
                    : 'Bearish bias'
                  : 'Neutral'
              }
            />
          ))}
        </div>
        {sr && <SupportResistancePanel support={sr.support} resistance={sr.resistance} />}
      </div>

      <div className="rounded-md border border-border bg-panel p-4">
        <h3 className="text-h2 text-text-primary">Summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {chart?.signal_summary || 'Data indikator belum lengkap.'} Harga terakhir referensi MA50:{' '}
          {formatPrice(last?.ma50 ?? null)}.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { t: 'Short Term', d: 'Fokus RSI & MACD harian.' },
            { t: 'Mid Term', d: 'Pantau silang MA20/MA50.' },
            { t: 'Long Term', d: 'Referensi MA100/MA200.' },
          ].map((r) => (
            <div key={r.t} className="rounded border border-border-muted bg-canvas p-3">
              <div className="text-xs font-semibold text-text-primary">{r.t}</div>
              <div className="mt-1 text-[11px] text-text-muted">{r.d}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-text-muted">
          Panel di atas adalah ringkasan kondisi teknikal untuk riset — bukan rekomendasi investasi.
        </p>
      </div>
    </div>
  );
}
