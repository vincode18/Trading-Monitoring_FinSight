'use client';

interface IndicatorSignalRowProps {
  name: string;
  value: number | null;
  signal: string;
}

function badgeClass(signal: string) {
  const s = signal.toLowerCase();
  if (s.includes('buy') || s.includes('bull') || s.includes('positive') || s.includes('oversold'))
    return 'bg-positive/15 text-positive';
  if (s.includes('sell') || s.includes('bear') || s.includes('negative') || s.includes('overbought'))
    return 'bg-negative/15 text-negative';
  return 'bg-border-muted text-text-secondary';
}

export function IndicatorSignalRow({ name, value, signal }: IndicatorSignalRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border-muted px-3 py-2.5 last:border-0">
      <span className="text-xs text-text-secondary">{name}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tabular-nums text-text-primary">
          {value === null || value === undefined ? '—' : value.toFixed(2)}
        </span>
        <span className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase ${badgeClass(signal)}`}>
          {signal}
        </span>
      </div>
    </div>
  );
}
