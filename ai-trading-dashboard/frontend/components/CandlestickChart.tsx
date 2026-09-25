'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  MouseEventParams,
  UTCTimestamp,
} from 'lightweight-charts';
import type { StrategyOverlay } from '@/components/analysis/strategyOverlay';
import { formatDate, formatPrice } from '@/lib/format';
import { ChartData } from '@/types/market';

type ChartTime = string | UTCTimestamp;

function isIntraday(interval: string) {
  return interval !== '1d' && interval !== '1wk' && interval !== '1mo';
}

/** Daily/weekly → business day. Intraday → unix seconds so bars on the same day stay unique. */
function toChartTime(iso: string, interval: string): ChartTime {
  if (!isIntraday(interval)) return iso.split('T')[0];
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso.split('T')[0];
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function formatBarDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCrosshairTime(time: MouseEventParams['time'], interval: string): string {
  if (time == null) return '—';
  if (typeof time === 'number') {
    return formatDate(new Date(time * 1000).toISOString(), isIntraday(interval));
  }
  if (typeof time === 'string') {
    const [year, month, day] = time.split('T')[0].split('-').map(Number);
    if (year && month && day && !isIntraday(interval)) return formatBarDate(year, month, day);
    return formatDate(time, isIntraday(interval));
  }
  if (typeof time === 'object' && 'year' in time) {
    return formatBarDate(time.year, time.month, time.day);
  }
  return '—';
}

function candleOf(value: unknown): { open: number; high: number; low: number; close: number } | null {
  if (!value || typeof value !== 'object' || !('open' in value) || !('close' in value)) return null;
  const bar = value as { open: number; high: number; low: number; close: number };
  if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)) return null;
  return bar;
}

function lineOf(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || !('value' in value)) return undefined;
  const point = value as { value: number };
  return Number.isFinite(point.value) ? point.value : undefined;
}

function tooltipRow(label: string, value: string, color?: string) {
  const style = color ? ` style="color:${color}"` : '';
  return `<span class="text-text-secondary">${label}</span><span class="text-text-primary"${style}>${value}</span>`;
}

function uniqueSorted<T extends { time: ChartTime }>(rows: T[]): T[] {
  const map = new Map<ChartTime, T>();
  for (const row of rows) map.set(row.time, row);
  return Array.from(map.values()).sort((a, b) => {
    if (typeof a.time === 'number' && typeof b.time === 'number') return a.time - b.time;
    return String(a.time).localeCompare(String(b.time));
  });
}

interface CandlestickChartProps {
  data: ChartData;
  showBollinger: boolean;
  showMa?: boolean;
  overlay?: StrategyOverlay | null;
}

// Palet chart mengikuti design tokens: positive/negative dari brief,
// garis indikator pakai warna netral yang tidak bersaing dengan candle.
const CHART_COLORS = {
  background: '#0E1117',
  grid: '#1F252E',
  text: '#8B949E',
  positive: '#00E676',
  negative: '#FF5252',
  ma20: '#5EA1FF',
  ma50: '#FFB84D',
  bollinger: '#5C6673',
};

export function CandlestickChart({
  data,
  showBollinger,
  showMa = true,
  overlay = null,
}: CandlestickChartProps) {
  const priceContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<IChartApi[]>([]);

  useEffect(() => {
    if (!priceContainerRef.current || !rsiContainerRef.current || !macdContainerRef.current) {
      return;
    }

    // Bersihkan chart lama sebelum render ulang (misal saat ganti simbol)
    chartsRef.current.forEach((c) => c.remove());
    chartsRef.current = [];

    const commonOptions = {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: data.interval !== '1d' && data.interval !== '1wk',
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
      },
      crosshair: {
        vertLine: { color: CHART_COLORS.text, width: 1 as const, style: 3 },
        horzLine: { color: CHART_COLORS.text, width: 1 as const, style: 3 },
      },
    };

    // --- Panel Harga (Candlestick + MA + Bollinger) ---
    const priceChart = createChart(priceContainerRef.current, {
      ...commonOptions,
      height: 380,
      width: priceContainerRef.current.clientWidth,
    });

    const candleSeries = priceChart.addCandlestickSeries({
      upColor: CHART_COLORS.positive,
      downColor: CHART_COLORS.negative,
      borderVisible: false,
      wickUpColor: CHART_COLORS.positive,
      wickDownColor: CHART_COLORS.negative,
    });
    const priceCandles = overlay?.candles?.length ? overlay.candles : data.candles;
    const candleRows = uniqueSorted(
      priceCandles
        .filter(
          (c) =>
            Number.isFinite(c.open) &&
            Number.isFinite(c.high) &&
            Number.isFinite(c.low) &&
            Number.isFinite(c.close)
        )
        .map((c) => ({
          time: toChartTime(c.date, data.interval),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
    );
    candleSeries.setData(candleRows);
    if (overlay?.markers?.length) {
      const known = new Set(candleRows.map((row) => String(row.time)));
      candleSeries.setMarkers(
        overlay.markers
          .filter((marker) => known.has(marker.time))
          .map((marker) => ({
            time: marker.time as unknown as UTCTimestamp,
            position: 'aboveBar' as const,
            color: '#F5C16C',
            shape: 'arrowDown' as const,
            text: marker.text,
          }))
      );
    }

    const drawMa = showMa && !overlay?.hideDefaultMa;
    const ma20Series = priceChart.addLineSeries({
      color: CHART_COLORS.ma20,
      lineWidth: 1,
      title: 'MA20',
      visible: drawMa,
    });
    ma20Series.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.ma20 !== null)
          .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.ma20 as number }))
      )
    );

    const ma50Series = priceChart.addLineSeries({
      color: CHART_COLORS.ma50,
      lineWidth: 1,
      title: 'MA50',
      visible: drawMa,
    });
    ma50Series.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.ma50 !== null)
          .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.ma50 as number }))
      )
    );

    let bbUpper: ISeriesApi<'Line'> | null = null;
    let bbMiddle: ISeriesApi<'Line'> | null = null;
    let bbLower: ISeriesApi<'Line'> | null = null;
    if (showBollinger) {
      bbUpper = priceChart.addLineSeries({
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper',
      });
      bbUpper.setData(
        uniqueSorted(
          data.indicators
            .filter((p) => p.bb_upper !== null)
            .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.bb_upper as number }))
        )
      );

      bbMiddle = priceChart.addLineSeries({
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Middle',
      });
      bbMiddle.setData(
        uniqueSorted(
          data.indicators
            .filter((p) => p.bb_middle !== null)
            .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.bb_middle as number }))
        )
      );

      bbLower = priceChart.addLineSeries({
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower',
      });
      bbLower.setData(
        uniqueSorted(
          data.indicators
            .filter((p) => p.bb_lower !== null)
            .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.bb_lower as number }))
        )
      );
    }

    const overlaySeries: Array<{ title: string; color: string; series: ISeriesApi<'Line'> }> = [];
    (overlay?.lines ?? []).forEach((series) => {
      const line = priceChart.addLineSeries({
        color: series.color,
        lineWidth: 1,
        title: series.title,
      });
      line.setData(
        uniqueSorted(
          series.data
            .filter((point) => Number.isFinite(point.value))
            .map((point) => ({ time: toChartTime(point.time, data.interval), value: point.value }))
        )
      );
      overlaySeries.push({ title: series.title, color: series.color, series: line });
    });

    const tooltipEl = document.createElement('div');
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.display = 'none';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.zIndex = '10';
    tooltipEl.className = 'rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs shadow-lg';
    priceContainerRef.current.appendChild(tooltipEl);

    const handleCrosshairMove = (param: MouseEventParams) => {
      const container = priceContainerRef.current;
      if (
        !container ||
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        tooltipEl.style.display = 'none';
        return;
      }

      const candle = candleOf(param.seriesData.get(candleSeries));
      if (!candle) {
        tooltipEl.style.display = 'none';
        return;
      }

      const rows = [
        tooltipRow('O', formatPrice(candle.open)),
        tooltipRow('H', formatPrice(candle.high)),
        tooltipRow('L', formatPrice(candle.low)),
        tooltipRow(
          'C',
          formatPrice(candle.close),
          candle.close >= candle.open ? CHART_COLORS.positive : CHART_COLORS.negative
        ),
      ];
      if (drawMa) {
        const ma20 = lineOf(param.seriesData.get(ma20Series));
        const ma50 = lineOf(param.seriesData.get(ma50Series));
        if (ma20 !== undefined) rows.push(tooltipRow('MA20', formatPrice(ma20), CHART_COLORS.ma20));
        if (ma50 !== undefined) rows.push(tooltipRow('MA50', formatPrice(ma50), CHART_COLORS.ma50));
      }
      if (showBollinger) {
        const upper = bbUpper ? lineOf(param.seriesData.get(bbUpper)) : undefined;
        const middle = bbMiddle ? lineOf(param.seriesData.get(bbMiddle)) : undefined;
        const lower = bbLower ? lineOf(param.seriesData.get(bbLower)) : undefined;
        if (upper !== undefined) rows.push(tooltipRow('BB Upper', formatPrice(upper)));
        if (middle !== undefined) rows.push(tooltipRow('BB Middle', formatPrice(middle)));
        if (lower !== undefined) rows.push(tooltipRow('BB Lower', formatPrice(lower)));
      }
      overlaySeries.forEach((item) => {
        const value = lineOf(param.seriesData.get(item.series));
        if (value !== undefined) rows.push(tooltipRow(item.title, formatPrice(value), item.color));
      });

      tooltipEl.innerHTML = `
        <div class="mb-1 text-text-muted">${formatCrosshairTime(param.time, data.interval)}</div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5">${rows.join('')}</div>
      `;

      const tooltipWidth = tooltipEl.offsetWidth || 160;
      const offset = 12;
      let left = param.point.x + offset;
      if (left + tooltipWidth > container.clientWidth) {
        left = param.point.x - tooltipWidth - offset;
      }
      tooltipEl.style.left = `${Math.max(0, left)}px`;
      tooltipEl.style.top = `${param.point.y + offset}px`;
      tooltipEl.style.display = 'block';
    };

    priceChart.subscribeCrosshairMove(handleCrosshairMove);
    priceChart.timeScale().fitContent();

    // --- Panel RSI ---
    const rsiChart = createChart(rsiContainerRef.current, {
      ...commonOptions,
      height: 120,
      width: rsiContainerRef.current.clientWidth,
    });
    const rsiSeries = rsiChart.addLineSeries({
      color: '#B98CFF',
      lineWidth: 1,
      title: 'RSI14',
    });
    rsiSeries.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.rsi14 !== null)
          .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.rsi14 as number }))
      )
    );
    rsiChart.timeScale().fitContent();

    // --- Panel MACD ---
    const macdChart = createChart(macdContainerRef.current, {
      ...commonOptions,
      height: 140,
      width: macdContainerRef.current.clientWidth,
    });
    const macdHistSeries = macdChart.addHistogramSeries({
      color: CHART_COLORS.text,
    });
    macdHistSeries.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.macd_hist !== null)
          .map((p) => ({
            time: toChartTime(p.date, data.interval),
            value: p.macd_hist as number,
            color: (p.macd_hist as number) >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative,
          }))
      )
    );
    const macdLineSeries = macdChart.addLineSeries({
      color: CHART_COLORS.ma20,
      lineWidth: 1,
      title: 'MACD',
    });
    macdLineSeries.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.macd !== null)
          .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.macd as number }))
      )
    );
    const macdSignalSeries = macdChart.addLineSeries({
      color: CHART_COLORS.ma50,
      lineWidth: 1,
      title: 'Signal',
    });
    macdSignalSeries.setData(
      uniqueSorted(
        data.indicators
          .filter((p) => p.macd_signal !== null)
          .map((p) => ({ time: toChartTime(p.date, data.interval), value: p.macd_signal as number }))
      )
    );
    macdChart.timeScale().fitContent();

    // Sinkronkan pergerakan crosshair/zoom antar 3 panel
    const charts = [priceChart, rsiChart, macdChart];
    charts.forEach((chart, i) => {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (!range) return;
        charts.forEach((other, j) => {
          if (i !== j) other.timeScale().setVisibleLogicalRange(range);
        });
      });
    });

    chartsRef.current = charts;

    const handleResize = () => {
      if (priceContainerRef.current) priceChart.resize(priceContainerRef.current.clientWidth, 380);
      if (rsiContainerRef.current) rsiChart.resize(rsiContainerRef.current.clientWidth, 120);
      if (macdContainerRef.current) macdChart.resize(macdContainerRef.current.clientWidth, 140);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.unsubscribeCrosshairMove(handleCrosshairMove);
      tooltipEl.remove();
      charts.forEach((c) => c.remove());
      chartsRef.current = [];
    };
  }, [data, showBollinger, showMa, overlay]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">Price</div>
        <div ref={priceContainerRef} className="relative w-full" />
        {overlay?.note && <p className="mt-1 text-[10px] text-text-muted">{overlay.note}</p>}
        {overlay?.haUp && overlay.haUp.length > 0 && (
          <div className="mt-2 flex gap-0.5" aria-label="Recent Heikin Ashi direction">
            {overlay.haUp.map((up, index) => (
              <span
                key={index}
                className={`h-2 flex-1 rounded-sm ${up ? 'bg-positive' : 'bg-negative'}`}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">RSI (14)</div>
        <div ref={rsiContainerRef} className="w-full" />
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">MACD</div>
        <div ref={macdContainerRef} className="w-full" />
      </div>
    </div>
  );
}
