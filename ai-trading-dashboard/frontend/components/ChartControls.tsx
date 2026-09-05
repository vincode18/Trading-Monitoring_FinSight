'use client';

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y'];
const INTERVALS = ['1d', '1wk', '1h', '30m', '15m'];

interface ChartControlsProps {
  period: string;
  interval: string;
  showBollinger: boolean;
  onPeriodChange: (v: string) => void;
  onIntervalChange: (v: string) => void;
  onBollingerToggle: (v: boolean) => void;
}

export function ChartControls({
  period,
  interval,
  showBollinger,
  onPeriodChange,
  onIntervalChange,
  onBollingerToggle,
}: ChartControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-1 py-2">
      <div className="flex items-center gap-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`rounded-sm px-2 py-1 font-mono text-xs ${
              period === p
                ? 'bg-panel-hover text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border" />

      <select
        value={interval}
        onChange={(e) => onIntervalChange(e.target.value)}
        className="rounded-sm border border-border bg-canvas px-2 py-1 font-mono text-xs text-text-secondary focus:border-positive focus:outline-none"
      >
        {INTERVALS.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-border" />

      <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={showBollinger}
          onChange={(e) => onBollingerToggle(e.target.checked)}
          className="h-3.5 w-3.5 accent-positive"
        />
        Bollinger Bands
      </label>
    </div>
  );
}
