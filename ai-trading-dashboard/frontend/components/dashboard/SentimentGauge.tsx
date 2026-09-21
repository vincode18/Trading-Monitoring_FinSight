'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

function colorFor(score: number) {
  if (score >= 70) return '#00E676';
  if (score >= 55) return '#A3E635';
  if (score >= 45) return '#FBBF24';
  if (score >= 30) return '#FB923C';
  return '#FF5252';
}

export function SentimentGauge({ symbol }: { symbol: string }) {
  const { data, error } = useSWR(['sentiment', symbol], () => api.getSentiment(symbol), {
    refreshInterval: 60_000,
  });

  const score = data?.score ?? 50;
  const label = data?.label ?? 'Neutral';
  const clamped = Math.max(0, Math.min(100, score));
  const r = 48;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const stroke = colorFor(clamped);

  return (
    <div className="flex h-full min-h-[140px] flex-col items-center rounded-md border border-border bg-panel p-4">
      <div className="w-full text-[10px] font-medium uppercase tracking-wide text-text-muted">
        Market Sentiment Score
      </div>
      {error && (
        <p className="mt-6 flex-1 text-center text-xs text-text-muted">
          Data sentimen belum tersedia.
        </p>
      )}
      {!error && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="mt-1">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#1F252E" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={stroke}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
            />
            <text
              x="60"
              y="58"
              textAnchor="middle"
              style={{ fontSize: 24, fontFamily: 'JetBrains Mono', fontWeight: 600, fill: '#F0F3F6' }}
            >
              {Math.round(clamped)}
            </text>
            <text x="60" y="76" textAnchor="middle" style={{ fontSize: 10, fill: '#8B949E' }}>
              / 100
            </text>
          </svg>
          <div className="text-sm font-semibold" style={{ color: stroke }}>
            {label}
          </div>
          <p className="mt-2 text-center text-[10px] text-text-muted">
            Skor internal — bukan Fear &amp; Greed CNN / bukan nasihat keuangan.
          </p>
        </div>
      )}
    </div>
  );
}
