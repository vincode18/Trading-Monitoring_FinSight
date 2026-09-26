'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useWatchlist } from '@/lib/watchlist-context';
import { GlobalSearchTrigger } from '@/components/GlobalSearch/GlobalSearchTrigger';
import { SymbolHeader } from '@/components/SymbolHeader';
import { CandlestickChart } from '@/components/CandlestickChart';
import { TimeframeToolbar } from '@/components/chart/TimeframeToolbar';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import { RadarChart } from '@/components/analysis/RadarChart';
import { IndicatorSignalRow } from '@/components/analysis/IndicatorSignalRow';
import { SupportResistancePanel } from '@/components/analysis/SupportResistancePanel';
import { TradingStrategyPanel } from '@/components/analysis/TradingStrategyPanel';
import { FundamentalAnalysisPanel } from '@/components/analysis/fundamental/FundamentalAnalysisPanel';
import { formatPrice } from '@/lib/format';
import { isEquitySymbol } from '@/lib/marketConfig';
import type { ChartData } from '@/types/market';

type MainTab = 'technical' | 'fundamental';
type TechTab =
  | 'summary'
  | 'ma'
  | 'rsi'
  | 'macd'
  | 'bollinger'
  | 'ohlc'
  | 'cross'
  | 'volume'
  | 'sentiment'
  | 'levels'
  | 'strategy';
const TECH_TABS: { id: TechTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'strategy', label: 'Trading Strategy' },
  { id: 'ma', label: 'MA' },
  { id: 'rsi', label: 'RSI' },
  { id: 'macd', label: 'MACD' },
  { id: 'bollinger', label: 'Bollinger' },
  { id: 'ohlc', label: 'OHLC' },
  { id: 'cross', label: 'MA Cross' },
  { id: 'volume', label: 'Volume' },
  { id: 'sentiment', label: 'Sentiment' },
  { id: 'levels', label: 'S/R' },
];

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function day(iso: string) {
  return iso.split('T')[0];
}

function downloadExcel(symbol: string, chart: ChartData) {
  const rows = chart.candles;
  const start = rows[0] ? day(rows[0].date) : 'start';
  const end = rows.length ? day(rows[rows.length - 1].date) : 'end';
  const body = rows
    .map(
      (c) =>
        `<tr><td>${day(c.date)}</td><td>${c.open}</td><td>${c.high}</td><td>${c.low}</td><td>${c.close}</td><td>${c.volume}</td></tr>`
    )
    .join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table><tr><th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th></tr>${body}</table></body></html>`;
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${symbol}_OHLC_${start}_${end}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 font-mono text-sm text-text-primary">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-text-muted">{hint}</div>}
    </div>
  );
}

export function AnalysisOverview() {
  const params = useSearchParams();
  const router = useRouter();
  const { watchlist, selectedSymbol, setSelectedSymbol } = useWatchlist();
  const querySymbol = params.get('symbol');
  const symbol = querySymbol || selectedSymbol || watchlist[0] || 'AAPL';

  const [main, setMain] = useState<MainTab>('technical');
  const [tech, setTech] = useState<TechTab>('summary');
  const [period, setPeriod] = useState('6mo');
  const [interval, setInterval] = useState('1d');
  const [showBollinger, setShowBollinger] = useState(false);
  const [showMa, setShowMa] = useState(true);

  const { data: quotes } = useSWR(['analysis-quote', symbol], () => api.getWatchlistQuotes([symbol]));
  const quote = quotes?.[0] ?? null;

  const { data: chart, error: chartError, isLoading } = useSWR(
    ['analysis-chart', symbol, period, interval],
    () => api.getChart(symbol, period, interval)
  );
  const { data: score } = useSWR(['analysis-score', symbol], () => api.getAnalysisScore(symbol));
  const { data: radar } = useSWR(['analysis-radar', symbol], () => api.getRadar(symbol));
  const { data: sr } = useSWR(['analysis-sr', symbol], () => api.getSupportResistance(symbol));

  useEffect(() => {
    if (!isEquitySymbol(symbol) && main === 'fundamental') setMain('technical');
  }, [symbol, main]);

  const last = chart?.indicators?.[chart.indicators.length - 1];
  const lastClose = chart?.candles?.[chart.candles.length - 1]?.close ?? null;
  const trend =
    last?.ma20 != null && last?.ma50 != null
      ? last.ma20 > last.ma50
        ? 'Uptrend'
        : 'Downtrend'
      : '—';
  const strength =
    score && score.score >= 65 ? 'Strong' : score && score.score <= 35 ? 'Weak' : 'Moderate';
  const maRows = [
    { name: 'MA20', value: last?.ma20 ?? null },
    { name: 'MA50', value: last?.ma50 ?? null },
    { name: 'MA100', value: last?.ma100 ?? null },
    { name: 'MA200', value: last?.ma200 ?? null },
  ];

  const crosses = useMemo(() => {
    const pts = chart?.indicators ?? [];
    const out: { date: string; type: 'golden' | 'death' }[] = [];
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      if (prev.ma20 == null || prev.ma50 == null || cur.ma20 == null || cur.ma50 == null) continue;
      if (prev.ma20 <= prev.ma50 && cur.ma20 > cur.ma50) out.push({ date: cur.date, type: 'golden' });
      if (prev.ma20 >= prev.ma50 && cur.ma20 < cur.ma50) out.push({ date: cur.date, type: 'death' });
    }
    return out.slice(-12).reverse();
  }, [chart]);

  const volumeStats = useMemo(() => {
    const candles = chart?.candles ?? [];
    if (candles.length < 2) return null;
    const lastVol = candles[candles.length - 1].volume;
    const window = candles.slice(-21, -1);
    const avg = window.reduce((s, c) => s + c.volume, 0) / (window.length || 1);
    return { lastVol, avg, ratio: avg ? lastVol / avg : null };
  }, [chart]);

  function pickSymbol(next: string) {
    setSelectedSymbol(next);
    router.replace(`/analysis/overview?symbol=${encodeURIComponent(next)}`);
  }

  return (
    <div className="w-full space-y-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-text-primary">Analysis Overview</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Technical and fundamental figures — research facts, not recommendations.
          </p>
        </div>
      </div>

      <GlobalSearchTrigger variant="wide" />

      <div className="flex flex-wrap items-end justify-between gap-3">
        {quote ? (
          <SymbolHeader quote={quote} loading={false} />
        ) : (
          <h2 className="font-mono text-lg text-text-primary">{symbol}</h2>
        )}
        <select
          value={symbol}
          onChange={(e) => pickSymbol(e.target.value)}
          className="rounded border border-border bg-panel px-2 py-1.5 font-mono text-xs"
        >
          {[...new Set([symbol, ...watchlist])].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Chart di atas analysis tabs */}
      <TimeframeToolbar
        period={period}
        onPeriodChange={(p, i) => {
          setPeriod(p);
          setInterval(i);
        }}
        showBollinger={showBollinger}
        showMa={showMa}
        onToggleBollinger={() => setShowBollinger((v) => !v)}
        onToggleMa={() => setShowMa((v) => !v)}
      />
      {isLoading && !chart && (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          Loading chart...
        </div>
      )}
      {chartError && !chart && (
        <p className="rounded border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative">
          Failed to load chart data for this period.
        </p>
      )}
      {chart && (
        <CandlestickChart data={chart} showBollinger={showBollinger} showMa={showMa} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMain('technical')}
          className={`rounded px-3 py-1.5 text-xs ${
            main === 'technical'
              ? 'bg-positive font-medium text-canvas'
              : 'border border-border bg-panel text-text-secondary'
          }`}
        >
          Technical Analysis
        </button>
        {isEquitySymbol(symbol) && (
          <button
            type="button"
            onClick={() => setMain('fundamental')}
            className={`rounded px-3 py-1.5 text-xs ${
              main === 'fundamental'
                ? 'bg-positive font-medium text-canvas'
                : 'border border-border bg-panel text-text-secondary'
            }`}
          >
            Fundamental Analysis
          </button>
        )}
      </div>
      {!isEquitySymbol(symbol) && (
        <p className="text-[10px] text-text-muted">
          Fundamental analysis applies to equities. This symbol is an index, FX pair, commodity, or crypto pair.
        </p>
      )}

      {main === 'technical' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {TECH_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTech(t.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] ${
                  tech === t.id
                    ? 'border-positive/50 bg-positive/10 text-positive'
                    : 'border-border text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading && !chart && (
            <p className="py-8 text-center text-xs text-text-muted">Loading analysis...</p>
          )}

          {tech === 'strategy' && <TradingStrategyPanel symbol={symbol} />}

          {tech === 'summary' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-md border border-border bg-panel px-4 py-2">
                  <div className="text-[10px] uppercase text-text-muted">Trend</div>
                  <div
                    className={`text-sm font-semibold ${
                      trend === 'Uptrend' ? 'text-positive' : trend === 'Downtrend' ? 'text-negative' : 'text-text-primary'
                    }`}
                  >
                    {trend}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-panel px-4 py-2">
                  <div className="text-[10px] uppercase text-text-muted">Strength</div>
                  <div className="text-sm font-semibold text-text-primary">{strength}</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {score && <ScoreGauge score={score.score} label={score.label} />}
                {radar && <RadarChart data={radar} />}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-panel">
                  <div className="border-b border-border px-4 py-3 text-h2">Moving Averages</div>
                  {maRows.map((row) => (
                    <IndicatorSignalRow
                      key={row.name}
                      name={row.name}
                      value={row.value}
                      signal={
                        last?.ma20 != null && row.value != null
                          ? last.ma20 >= row.value
                            ? 'Bullish bias'
                            : 'Bearish bias'
                          : 'Neutral'
                      }
                    />
                  ))}
                </div>
                {sr && <SupportResistancePanel support={sr.support} resistance={sr.resistance} />}
              </div>

              {score && (
                <div className="rounded-md border border-border bg-panel">
                  <div className="border-b border-border px-4 py-3 text-h2">Per indicator</div>
                  {(score.indicators ?? []).map((ind) => (
                    <IndicatorSignalRow
                      key={ind.name}
                      name={ind.name}
                      value={ind.value}
                      signal={ind.signal}
                    />
                  ))}
                </div>
              )}

              <div className="rounded-md border border-border bg-panel p-4">
                <h3 className="text-h2 text-text-primary">Summary</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {chart?.signal_summary || 'Indicator data incomplete.'} Latest price vs
                  MA50: {formatPrice(last?.ma50 ?? null)}.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { t: 'Short Term', d: 'Focus on daily RSI & MACD.' },
                    { t: 'Mid Term', d: 'Watch MA20/MA50 crosses.' },
                    { t: 'Long Term', d: 'Reference MA100/MA200.' },
                  ].map((r) => (
                    <div key={r.t} className="rounded border border-border-muted bg-canvas p-3">
                      <div className="text-xs font-semibold text-text-primary">{r.t}</div>
                      <div className="mt-1 text-[11px] text-text-muted">{r.d}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-text-muted">
                  The panel above is a technical condition summary for research — not investment
                  recommendations.
                </p>
              </div>
            </div>
          )}

          {tech === 'ma' && last && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(['ma20', 'ma50', 'ma100', 'ma200'] as const).map((key) => {
                const value = last[key] ?? null;
                const above = lastClose != null && value != null && lastClose >= value;
                return (
                  <Metric
                    key={key}
                    label={key.toUpperCase()}
                    value={formatPrice(value)}
                    hint={value == null ? undefined : above ? 'Price above MA' : 'Price below MA'}
                  />
                );
              })}
            </div>
          )}

          {tech === 'rsi' && last && (
            <Metric
              label="RSI 14"
              value={fmt(last.rsi14)}
              hint={
                last.rsi14 == null
                  ? undefined
                  : last.rsi14 > 70
                    ? 'Overbought (>70)'
                    : last.rsi14 < 30
                      ? 'Oversold (<30)'
                      : 'Netral'
              }
            />
          )}

          {tech === 'macd' && last && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="MACD" value={fmt(last.macd, 4)} />
              <Metric label="Signal" value={fmt(last.macd_signal, 4)} />
              <Metric
                label="Histogram"
                value={fmt(last.macd_hist, 4)}
                hint={
                  last.macd_hist == null ? undefined : last.macd_hist >= 0 ? 'Momentum positif' : 'Momentum negatif'
                }
              />
            </div>
          )}

          {tech === 'bollinger' && last && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Upper" value={formatPrice(last.bb_upper)} />
              <Metric label="Middle" value={formatPrice(last.bb_middle)} />
              <Metric
                label="Lower"
                value={formatPrice(last.bb_lower)}
                hint={
                  lastClose != null && last.bb_upper != null && lastClose >= last.bb_upper
                    ? 'Price near / above upper band'
                    : lastClose != null && last.bb_lower != null && lastClose <= last.bb_lower
                      ? 'Price near / below lower band'
                      : 'Inside bands'
                }
              />
            </div>
          )}

          {tech === 'ohlc' && chart && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => downloadExcel(symbol, chart)}
                className="rounded border border-border bg-panel px-3 py-1.5 text-xs text-text-secondary hover:border-positive/40 hover:text-positive"
              >
                Download Excel
              </button>
              <div className="max-h-[420px] overflow-auto rounded-md border border-border">
                <table className="min-w-full text-left text-xs">
                  <thead className="sticky top-0 bg-panel text-[10px] uppercase text-text-muted">
                    <tr>
                      {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...chart.candles].reverse().map((c) => (
                      <tr key={c.date} className="border-t border-border-muted">
                        <td className="px-3 py-1.5 font-mono">{day(c.date)}</td>
                        <td className="px-3 py-1.5 font-mono">{fmt(c.open)}</td>
                        <td className="px-3 py-1.5 font-mono">{fmt(c.high)}</td>
                        <td className="px-3 py-1.5 font-mono">{fmt(c.low)}</td>
                        <td className="px-3 py-1.5 font-mono">{fmt(c.close)}</td>
                        <td className="px-3 py-1.5 font-mono">{fmt(c.volume, 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tech === 'cross' && (
            <div className="space-y-2">
              <p className="text-[11px] text-text-muted">
                MA20/MA50 cross history in the selected range — technical fact, not a buy/sell signal.
              </p>
              {crosses.map((c) => (
                <div
                  key={`${c.date}-${c.type}`}
                  className="flex items-center justify-between rounded border border-border-muted px-3 py-2 text-xs"
                >
                  <span className="font-mono text-text-secondary">{day(c.date)}</span>
                  <span className={c.type === 'golden' ? 'text-positive' : 'text-negative'}>
                    {c.type === 'golden' ? 'Golden cross' : 'Death cross'}
                  </span>
                </div>
              ))}
              {!crosses.length && <p className="text-xs text-text-muted">No crosses in this range.</p>}
            </div>
          )}

          {tech === 'volume' && volumeStats && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Latest volume" value={fmt(volumeStats.lastVol, 0)} />
              <Metric label="20-day average" value={fmt(volumeStats.avg, 0)} />
              <Metric
                label="Rasio"
                value={volumeStats.ratio == null ? '—' : `${volumeStats.ratio.toFixed(2)}x`}
                hint={volumeStats.ratio != null && volumeStats.ratio >= 1.5 ? 'Unusual volume' : undefined}
              />
            </div>
          )}

          {tech === 'sentiment' && score && (
            <div className="grid gap-4 lg:grid-cols-3">
              <ScoreGauge score={score.score} label={score.label} />
              <div className="rounded-md border border-border bg-panel p-4 lg:col-span-2">
                <p className="text-xs text-text-secondary">
                  Combined score from calculated indicators. Not licensed Fear &amp; Greed.
                </p>
                <div className="mt-3 space-y-1">
                  {(score.indicators ?? []).map((ind) => (
                    <IndicatorSignalRow key={ind.name} name={ind.name} value={ind.value} signal={ind.signal} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tech === 'levels' && sr && (
            <SupportResistancePanel support={sr.support} resistance={sr.resistance} />
          )}
        </>
      )}

      {main === 'fundamental' && isEquitySymbol(symbol) && <FundamentalAnalysisPanel symbol={symbol} />}

      <p className="text-[10px] leading-relaxed text-text-muted">
        {score?.disclaimer ||
          'All figures on this page are data summaries and calculations — not financial advice.'}
      </p>
    </div>
  );
}
