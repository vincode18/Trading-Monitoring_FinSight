'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, UTCTimestamp } from 'lightweight-charts';
import type { StrategyOverlay } from '@/components/analysis/strategyOverlay';
import type { ChartData } from '@/types/market';

type ChartTime = string | UTCTimestamp;

function toChartTime(iso: string): ChartTime {
  return iso.split('T')[0];
}

function uniqueSorted<T extends { time: ChartTime }>(rows: T[]): T[] {
  const map = new Map<ChartTime, T>();
  for (const row of rows) map.set(row.time, row);
  return Array.from(map.values()).sort((a, b) => String(a.time).localeCompare(String(b.time)));
}

const COLORS = {
  background: '#0E1117',
  grid: '#1F252E',
  text: '#8B949E',
  positive: '#00E676',
  negative: '#FF5252',
  macd: '#5EA1FF',
  signal: '#FFB84D',
};

export function StrategyChart({
  data,
  overlay = null,
  showRsi = false,
}: {
  data: ChartData;
  overlay?: StrategyOverlay | null;
  showRsi?: boolean;
}) {
  const priceRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<IChartApi[]>([]);

  useEffect(() => {
    if (!priceRef.current || !macdRef.current) return;
    if (showRsi && !rsiRef.current) return;

    chartsRef.current.forEach((chart) => chart.remove());
    chartsRef.current = [];

    const common = {
      layout: {
        background: { type: ColorType.Solid, color: COLORS.background },
        textColor: COLORS.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      timeScale: { borderColor: COLORS.grid },
      rightPriceScale: { borderColor: COLORS.grid },
    };

    const priceChart = createChart(priceRef.current, {
      ...common,
      height: 380,
      width: priceRef.current.clientWidth,
    });
    const candleSeries = priceChart.addCandlestickSeries({
      upColor: COLORS.positive,
      downColor: COLORS.negative,
      borderVisible: false,
      wickUpColor: COLORS.positive,
      wickDownColor: COLORS.negative,
    });
    const source = overlay?.candles?.length ? overlay.candles : data.candles;
    const candleRows = uniqueSorted(
      source
        .filter((candle) => [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
        .map((candle) => ({
          time: toChartTime(candle.date),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
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
    (overlay?.lines ?? []).forEach((series) => {
      const line = priceChart.addLineSeries({ color: series.color, lineWidth: 1, title: series.title });
      line.setData(
        uniqueSorted(
          series.data
            .filter((point) => Number.isFinite(point.value))
            .map((point) => ({ time: toChartTime(point.time), value: point.value }))
        )
      );
    });
    priceChart.timeScale().fitContent();

    const charts: IChartApi[] = [priceChart];

    if (showRsi && rsiRef.current) {
      const rsiChart = createChart(rsiRef.current, {
        ...common,
        height: 120,
        width: rsiRef.current.clientWidth,
      });
      const rsiSeries = rsiChart.addLineSeries({ color: '#B98CFF', lineWidth: 1, title: 'RSI14' });
      rsiSeries.setData(
        uniqueSorted(
          data.indicators
            .filter((point) => point.rsi14 != null)
            .map((point) => ({ time: toChartTime(point.date), value: point.rsi14 as number }))
        )
      );
      rsiChart.timeScale().fitContent();
      charts.push(rsiChart);
    }

    const macdChart = createChart(macdRef.current, {
      ...common,
      height: 140,
      width: macdRef.current.clientWidth,
    });
    const hist = macdChart.addHistogramSeries({ color: COLORS.text });
    hist.setData(
      uniqueSorted(
        data.indicators
          .filter((point) => point.macd_hist != null)
          .map((point) => ({
            time: toChartTime(point.date),
            value: point.macd_hist as number,
            color: (point.macd_hist as number) >= 0 ? COLORS.positive : COLORS.negative,
          }))
      )
    );
    const macdLine = macdChart.addLineSeries({ color: COLORS.macd, lineWidth: 1, title: 'MACD' });
    macdLine.setData(
      uniqueSorted(
        data.indicators
          .filter((point) => point.macd != null)
          .map((point) => ({ time: toChartTime(point.date), value: point.macd as number }))
      )
    );
    const signal = macdChart.addLineSeries({ color: COLORS.signal, lineWidth: 1, title: 'Signal' });
    signal.setData(
      uniqueSorted(
        data.indicators
          .filter((point) => point.macd_signal != null)
          .map((point) => ({ time: toChartTime(point.date), value: point.macd_signal as number }))
      )
    );
    macdChart.timeScale().fitContent();
    charts.push(macdChart);

    charts.forEach((chart, index) => {
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (!range) return;
        charts.forEach((other, otherIndex) => {
          if (index !== otherIndex) other.timeScale().setVisibleLogicalRange(range);
        });
      });
    });
    chartsRef.current = charts;

    const onResize = () => {
      if (priceRef.current) priceChart.resize(priceRef.current.clientWidth, 380);
      if (showRsi && rsiRef.current) charts[1]?.resize(rsiRef.current.clientWidth, 120);
      if (macdRef.current) macdChart.resize(macdRef.current.clientWidth, 140);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      charts.forEach((chart) => chart.remove());
      chartsRef.current = [];
    };
  }, [data, overlay, showRsi]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">Price</div>
        <div ref={priceRef} className="w-full" />
        {overlay?.note && <p className="mt-1 text-[10px] text-text-muted">{overlay.note}</p>}
        {overlay?.haUp && overlay.haUp.length > 0 && (
          <div className="mt-2 flex gap-0.5" aria-label="Recent Heikin Ashi direction">
            {overlay.haUp.map((up, index) => (
              <span key={index} className={`h-2 flex-1 rounded-sm ${up ? 'bg-positive' : 'bg-negative'}`} />
            ))}
          </div>
        )}
      </div>
      {showRsi && (
        <div>
          <div className="mb-1 text-xs font-medium text-text-muted">RSI (14)</div>
          <div ref={rsiRef} className="w-full" />
        </div>
      )}
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">MACD</div>
        <div ref={macdRef} className="w-full" />
      </div>
    </div>
  );
}
