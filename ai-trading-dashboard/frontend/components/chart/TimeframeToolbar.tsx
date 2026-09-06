'use client';

const PERIODS = [
  { id: '5d', label: '5D', interval: '1h' },
  { id: '1mo', label: '1M', interval: '1d' },
  { id: '3mo', label: '3M', interval: '1d' },
  { id: '6mo', label: '6M', interval: '1d' },
  { id: '1y', label: '1Y', interval: '1d' },
  { id: '5y', label: '5Y', interval: '1wk' },
];

interface TimeframeToolbarProps {
  period: string;
  onPeriodChange: (period: string, interval: string) => void;
  showBollinger: boolean;
  showMa: boolean;
  onToggleBollinger: () => void;
  onToggleMa: () => void;
}

export function TimeframeToolbar({
  period,
  onPeriodChange,
  showBollinger,
  showMa,
  onToggleBollinger,
  onToggleMa,
}: TimeframeToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-panel px-3 py-2">
      <div className="flex flex-wrap gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPeriodChange(p.id, p.interval)}
            className={`rounded-sm px-2.5 py-1 text-xs font-medium ${
              period === p.id
                ? 'bg-positive/15 text-positive'
                : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-text-muted">Indicators</span>
        <button
          onClick={onToggleMa}
          className={`rounded-sm border px-2 py-1 text-xs ${
            showMa ? 'border-positive text-positive' : 'border-border text-text-secondary'
          }`}
        >
          MA
        </button>
        <button
          onClick={onToggleBollinger}
          className={`rounded-sm border px-2 py-1 text-xs ${
            showBollinger ? 'border-positive text-positive' : 'border-border text-text-secondary'
          }`}
        >
          Bollinger
        </button>
      </div>
    </div>
  );
}
