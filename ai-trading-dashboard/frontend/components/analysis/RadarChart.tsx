'use client';

import type { RadarScore } from '@/types/market';

interface RadarChartProps {
  data: RadarScore;
}

const AXES: { key: keyof Omit<RadarScore, 'symbol'>; label: string }[] = [
  { key: 'price_action', label: 'Price' },
  { key: 'volume', label: 'Volume' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'trend', label: 'Trend' },
  { key: 'volatility', label: 'Volatility' },
];

export function RadarChart({ data }: RadarChartProps) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const n = AXES.length;

  function point(i: number, value: number) {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  const polygon = AXES.map((a, i) => point(i, data[a.key] as number).join(',')).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((scale) =>
    AXES.map((_, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
      const r = radius * scale;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ')
  );

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <h3 className="text-h2 text-text-primary">Radar Profile</h3>
      <div className="mt-2 flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {grid.map((g, i) => (
            <polygon key={i} points={g} fill="none" stroke="#1F252E" strokeWidth="1" />
          ))}
          {AXES.map((a, i) => {
            const [x, y] = point(i, 100);
            return (
              <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke="#2A313C" strokeWidth="1" />
            );
          })}
          <polygon points={polygon} fill="rgba(0,230,118,0.2)" stroke="#00E676" strokeWidth="2" />
          {AXES.map((a, i) => {
            const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
            const lx = cx + (radius + 18) * Math.cos(angle);
            const ly = cy + (radius + 18) * Math.sin(angle);
            return (
              <text
                key={a.key}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 9, fill: '#8B949E' }}
              >
                {a.label}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="mt-1 text-center text-[10px] text-text-muted">
        Skor relatif 0–100 dari indikator teknikal — bukan rekomendasi finansial.
      </p>
    </div>
  );
}
