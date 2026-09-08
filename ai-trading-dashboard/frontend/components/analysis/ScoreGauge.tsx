'use client';

interface ScoreGaugeProps {
  score: number;
  label: string;
}

function colorFor(score: number) {
  if (score >= 70) return '#00E676';
  if (score >= 55) return '#A3E635';
  if (score >= 45) return '#FBBF24';
  if (score >= 30) return '#FB923C';
  return '#FF5252';
}

export function ScoreGauge({ score, label }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const stroke = colorFor(clamped);

  return (
    <div className="flex flex-col items-center rounded-md border border-border bg-panel p-5">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1F252E" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-text-primary"
          style={{ fontSize: 28, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
        >
          {Math.round(clamped)}
        </text>
        <text
          x="70"
          y="86"
          textAnchor="middle"
          style={{ fontSize: 11, fill: '#8B949E' }}
        >
          / 100
        </text>
      </svg>
      <div className="mt-1 text-sm font-semibold" style={{ color: stroke }}>
        {label}
      </div>
      <p className="mt-2 text-center text-[10px] text-text-muted">
        Ringkasan teknikal — bukan rekomendasi beli/jual.
      </p>
    </div>
  );
}
