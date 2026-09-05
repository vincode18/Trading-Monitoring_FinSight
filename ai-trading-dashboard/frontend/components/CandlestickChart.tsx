'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { ChartData } from '@/types/market';

interface CandlestickChartProps {
  data: ChartData;
  showBollinger: boolean;
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

export function CandlestickChart({ data, showBollinger }: CandlestickChartProps) {
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
    candleSeries.setData(
      data.candles.map((c) => ({
        time: c.date.split('T')[0],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const ma20Series = priceChart.addLineSeries({
      color: CHART_COLORS.ma20,
      lineWidth: 1,
      title: 'MA20',
    });
    ma20Series.setData(
      data.indicators
        .filter((p) => p.ma20 !== null)
        .map((p) => ({ time: p.date.split('T')[0], value: p.ma20 as number }))
    );

    const ma50Series = priceChart.addLineSeries({
      color: CHART_COLORS.ma50,
      lineWidth: 1,
      title: 'MA50',
    });
    ma50Series.setData(
      data.indicators
        .filter((p) => p.ma50 !== null)
        .map((p) => ({ time: p.date.split('T')[0], value: p.ma50 as number }))
    );

    if (showBollinger) {
      const bbUpper = priceChart.addLineSeries({
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Upper',
      });
      bbUpper.setData(
        data.indicators
          .filter((p) => p.bb_upper !== null)
          .map((p) => ({ time: p.date.split('T')[0], value: p.bb_upper as number }))
      );

      const bbLower = priceChart.addLineSeries({
        color: CHART_COLORS.bollinger,
        lineWidth: 1,
        lineStyle: 2,
        title: 'BB Lower',
      });
      bbLower.setData(
        data.indicators
          .filter((p) => p.bb_lower !== null)
          .map((p) => ({ time: p.date.split('T')[0], value: p.bb_lower as number }))
      );
    }

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
      data.indicators
        .filter((p) => p.rsi14 !== null)
        .map((p) => ({ time: p.date.split('T')[0], value: p.rsi14 as number }))
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
      data.indicators
        .filter((p) => p.macd_hist !== null)
        .map((p) => ({
          time: p.date.split('T')[0],
          value: p.macd_hist as number,
          color: (p.macd_hist as number) >= 0 ? CHART_COLORS.positive : CHART_COLORS.negative,
        }))
    );
    const macdLineSeries = macdChart.addLineSeries({
      color: CHART_COLORS.ma20,
      lineWidth: 1,
      title: 'MACD',
    });
    macdLineSeries.setData(
      data.indicators
        .filter((p) => p.macd !== null)
        .map((p) => ({ time: p.date.split('T')[0], value: p.macd as number }))
    );
    const macdSignalSeries = macdChart.addLineSeries({
      color: CHART_COLORS.ma50,
      lineWidth: 1,
      title: 'Signal',
    });
    macdSignalSeries.setData(
      data.indicators
        .filter((p) => p.macd_signal !== null)
        .map((p) => ({ time: p.date.split('T')[0], value: p.macd_signal as number }))
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
      charts.forEach((c) => c.remove());
      chartsRef.current = [];
    };
  }, [data, showBollinger]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="mb-1 text-xs font-medium text-text-muted">Harga</div>
        <div ref={priceContainerRef} className="w-full" />
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
