'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, UTCTimestamp } from 'lightweight-charts';
import { ChartData } from '@/types/market';

interface MiniCandlestickChartProps {
  data: ChartData;
  height?: number;
}

const CHART_COLORS = {
  background: '#0E1117',
  grid: '#1F252E',
  text: '#8B949E',
  positive: '#00E676',
  negative: '#FF5252',
};

function isIntraday(interval: string) {
  return interval !== '1d' && interval !== '1wk' && interval !== '1mo';
}

function toChartTime(iso: string, interval: string): string | UTCTimestamp {
  if (!isIntraday(interval)) return iso.split('T')[0];
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso.split('T')[0];
  return Math.floor(ms / 1000) as UTCTimestamp;
}

export function MiniCandlestickChart({ data, height = 180 }: MiniCandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    chartRef.current?.remove();
    chartRef.current = null;

    const width = Math.max(el.clientWidth, 1);
    const chart = createChart(el, {
      height,
      width,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        visible: false,
        timeVisible: isIntraday(data.interval),
      },
      rightPriceScale: { borderColor: CHART_COLORS.grid },
      handleScroll: false,
      handleScale: false,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.positive,
      downColor: CHART_COLORS.negative,
      borderVisible: false,
      wickUpColor: CHART_COLORS.positive,
      wickDownColor: CHART_COLORS.negative,
    });

    const rows = data.candles
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
      }));

    const map = new Map(rows.map((r) => [r.time, r]));
    candleSeries.setData(
      Array.from(map.values()).sort((a, b) =>
        typeof a.time === 'number' && typeof b.time === 'number'
          ? a.time - b.time
          : String(a.time).localeCompare(String(b.time))
      )
    );
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resize = () => {
      if (!containerRef.current || !chartRef.current) return;
      const nextWidth = Math.max(containerRef.current.clientWidth, 1);
      chartRef.current.resize(nextWidth, height);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(el);
    // Re-measure after layout settles (grid column shrink when 2nd panel mounts)
    requestAnimationFrame(resize);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return (
    <div
      ref={containerRef}
      className="w-full min-w-0 overflow-hidden rounded-sm"
      style={{ height }}
    />
  );
}
