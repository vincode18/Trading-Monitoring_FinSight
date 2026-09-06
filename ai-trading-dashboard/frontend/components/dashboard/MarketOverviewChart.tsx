'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

const INDEX_OPTIONS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^DJI', label: 'DOW 30' },
  { symbol: '^IXIC', label: 'NASDAQ' },
  { symbol: 'BTC-USD', label: 'BTC' },
];

export function MarketOverviewChart() {
  const [symbol, setSymbol] = useState('^GSPC');
  const { data } = useSWR(['overview-chart', symbol], () =>
    api.getChart(symbol, '3mo', '1d')
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data?.candles?.length) return;
    const chart = createChart(ref.current, {
      height: 180,
      width: ref.current.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: '#161B22' },
        textColor: '#8B949E',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: '#1F252E' },
        horzLines: { color: '#1F252E' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const series = chart.addAreaSeries({
      lineColor: '#00E676',
      topColor: 'rgba(0,230,118,0.25)',
      bottomColor: 'rgba(0,230,118,0.02)',
      lineWidth: 2,
    });
    series.setData(
      data.candles.map((c) => ({
        time: c.date.split('T')[0],
        value: c.close,
      }))
    );
    chart.timeScale().fitContent();
    const onResize = () => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-h2 text-text-primary">Market Overview</h2>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded border border-border bg-canvas px-2 py-1 text-xs text-text-primary"
        >
          {INDEX_OPTIONS.map((o) => (
            <option key={o.symbol} value={o.symbol}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div ref={ref} className="w-full" />
    </div>
  );
}
