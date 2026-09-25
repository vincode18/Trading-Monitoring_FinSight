export interface ChartSeries {
  name: string;
  color: string;
  values: Array<number | null>;
  axis?: 'left' | 'right';
}

export const FUND_COLORS = {
  revenue: '#6EA8FE',
  gross: '#3DDC97',
  operating: '#F5C16C',
  net: '#C084FC',
  eps: '#67E8F9',
  equity: '#6EA8FE',
  shortDebt: '#F5C16C',
  longDebt: '#FF8A80',
  debt: '#FF8A80',
  ocf: '#6EA8FE',
  fcf: '#3DDC97',
  capex: '#FF8A80',
  per: '#6EA8FE',
  pbv: '#F5C16C',
  ev: '#C084FC',
  bvps: '#67E8F9',
  prior: '#8B949E',
  insider: '#F5C16C',
  inst: '#6EA8FE',
  public: '#3DDC97',
};

const GRID = '#2A313C';
const LABEL = '#8B949E';

export function hasSeries(series: ChartSeries[]) {
  return series.some((item) => item.values.some((value) => value != null && Number.isFinite(value)));
}

function extent(nums: number[]) {
  if (!nums.length) return { min: 0, max: 1 };
  let min = Math.min(0, ...nums);
  let max = Math.max(0, ...nums);
  if (min === max) {
    if (min === 0) return { min: 0, max: 1 };
    const pad = Math.abs(min) * 0.25 || 1;
    return { min: min - pad, max: max + pad };
  }
  const pad = (max - min) * 0.08;
  return { min: min < 0 ? min - pad : 0, max: max + pad };
}

function ticks(min: number, max: number, count = 4) {
  return Array.from({ length: count + 1 }, (_, i) => min + ((max - min) * i) / count);
}

export function CategoryChart({
  categories,
  series,
  mode,
  formatTick,
  ariaLabel,
}: {
  categories: string[];
  series: ChartSeries[];
  mode: 'grouped' | 'stacked' | 'line';
  formatTick: (n: number) => string;
  ariaLabel: string;
}) {
  if (!categories.length || !hasSeries(series)) {
    return <p className="text-xs text-text-muted">No chart data for this frequency.</p>;
  }

  const dual = mode === 'line' && series.some((item) => item.axis === 'right');
  const width = 720;
  const height = 248;
  const pad = { top: 16, right: dual ? 56 : 16, bottom: 36, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const slot = innerW / categories.length;

  function yFor(value: number, scale: { min: number; max: number }) {
    const t = (value - scale.min) / (scale.max - scale.min || 1);
    return pad.top + (1 - t) * innerH;
  }

  function xCenter(index: number) {
    return pad.left + slot * index + slot / 2;
  }

  const leftSeries = dual ? series.filter((item) => item.axis !== 'right') : series;
  const rightSeries = dual ? series.filter((item) => item.axis === 'right') : [];

  function valuesFor(items: ChartSeries[]) {
    const nums: number[] = [];
    if (mode === 'stacked') {
      categories.forEach((_, index) => {
        let pos = 0;
        let neg = 0;
        items.forEach((item) => {
          const value = item.values[index];
          if (value == null || !Number.isFinite(value)) return;
          if (value >= 0) pos += value;
          else neg += value;
        });
        nums.push(pos, neg);
      });
      return nums;
    }
    items.forEach((item) => {
      item.values.forEach((value) => {
        if (value != null && Number.isFinite(value)) nums.push(value);
      });
    });
    return nums;
  }

  const left = extent(valuesFor(leftSeries.length ? leftSeries : series));
  const right = extent(valuesFor(rightSeries));
  const leftTicks = ticks(left.min, left.max);
  const rightTicks = ticks(right.min, right.max);

  const bars = categories.flatMap((_, index) => {
    if (mode === 'line') return [];
    if (mode === 'stacked') {
      let pos = 0;
      let neg = 0;
      const barW = Math.min(28, slot * 0.55);
      const x = xCenter(index) - barW / 2;
      return series.map((item) => {
        const value = item.values[index];
        if (value == null || !Number.isFinite(value) || value === 0) return null;
        const start = value >= 0 ? pos : neg;
        const end = start + value;
        if (value >= 0) pos = end;
        else neg = end;
        const top = yFor(Math.max(start, end), left);
        const bottom = yFor(Math.min(start, end), left);
        return (
          <rect
            key={`${item.name}-${index}`}
            x={x}
            y={top}
            width={barW}
            height={Math.max(1, bottom - top)}
            fill={item.color}
            rx={1}
          >
            <title>{`${item.name} · ${categories[index]} · ${formatTick(value)}`}</title>
          </rect>
        );
      });
    }

    const count = series.length;
    const gap = 2;
    const barW = Math.max(3, Math.min(18, (slot * 0.78 - gap * (count - 1)) / count));
    const groupW = count * barW + (count - 1) * gap;
    const start = xCenter(index) - groupW / 2;
    return series.map((item, seriesIndex) => {
      const value = item.values[index];
      if (value == null || !Number.isFinite(value)) return null;
      const y = yFor(value, left);
      const zero = yFor(0, left);
      const top = Math.min(y, zero);
      return (
        <rect
          key={`${item.name}-${index}`}
          x={start + seriesIndex * (barW + gap)}
          y={top}
          width={barW}
          height={Math.max(1, Math.abs(y - zero))}
          fill={item.color}
          rx={1}
        >
          <title>{`${item.name} · ${categories[index]} · ${formatTick(value)}`}</title>
        </rect>
      );
    });
  });

  const lines =
    mode === 'line'
      ? series.map((item) => {
          const scale = item.axis === 'right' ? right : left;
          let path = '';
          let drawing = false;
          item.values.forEach((value, index) => {
            if (value == null || !Number.isFinite(value)) {
              drawing = false;
              return;
            }
            const cmd = drawing ? 'L' : 'M';
            path += `${cmd} ${xCenter(index)} ${yFor(value, scale)} `;
            drawing = true;
          });
          const dots = item.values.map((value, index) => {
            if (value == null || !Number.isFinite(value)) return null;
            return (
              <circle key={`${item.name}-dot-${index}`} cx={xCenter(index)} cy={yFor(value, scale)} r={2.5} fill={item.color}>
                <title>{`${item.name} · ${categories[index]} · ${formatTick(value)}`}</title>
              </circle>
            );
          });
          return (
            <g key={item.name}>
              <path d={path.trim()} fill="none" stroke={item.color} strokeWidth={1.75} />
              {dots}
            </g>
          );
        })
      : null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
          {leftTicks.map((tick) => {
            const y = yFor(tick, left);
            return (
              <g key={`l-${tick}`}>
                <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" fill={LABEL} fontSize={10}>
                  {formatTick(tick)}
                </text>
              </g>
            );
          })}
          {dual &&
            rightTicks.map((tick) => (
              <text key={`r-${tick}`} x={width - pad.right + 8} y={yFor(tick, right) + 3} fill={LABEL} fontSize={10}>
                {formatTick(tick)}
              </text>
            ))}
          {bars}
          {lines}
          {categories.map((label, index) => (
            <text
              key={`${label}-${index}`}
              x={xCenter(index)}
              y={height - 12}
              textAnchor="middle"
              fill={LABEL}
              fontSize={10}
            >
              {label}
            </text>
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3">
          {series.map((item) => (
            <span key={item.name} className="inline-flex items-center gap-1.5 text-[10px] text-text-secondary">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DonutChart({
  slices,
}: {
  slices: Array<{ name: string; value: number; color: string }>;
}) {
  const clean = slices.filter((slice) => slice.value > 0);
  const total = clean.reduce((sum, slice) => sum + slice.value, 0);
  if (!clean.length || total <= 0) {
    return <p className="text-xs text-text-muted">Ownership composition is not available.</p>;
  }

  const cx = 88;
  const cy = 88;
  const radius = 70;
  let angle = -Math.PI / 2;
  const arcs = clean.map((slice) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    if (sweep >= Math.PI * 2 - 0.001) {
      return (
        <circle key={slice.name} cx={cx} cy={cy} r={radius} fill={slice.color}>
          <title>{`${slice.name} ${slice.value.toFixed(2)}%`}</title>
        </circle>
      );
    }
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const large = sweep > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={slice.name} d={path} fill={slice.color}><title>{`${slice.name} ${slice.value.toFixed(2)}%`}</title></path>;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 176 176" className="h-40 w-40" role="img" aria-label="Ownership composition">
        {arcs}
        <circle cx={cx} cy={cy} r={42} fill="#161B22" />
      </svg>
      <div className="space-y-2">
        {clean.map((slice) => (
          <div key={slice.name} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="text-text-secondary">{slice.name}</span>
            <span className="font-mono text-text-primary">{slice.value.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
