// Sinkron manual dengan backend/app/api/schemas.py

export interface QuoteSnapshot {
  symbol: string;
  name: string;
  last_price: number | null;
  prev_close: number | null;
  change: number | null;
  change_pct: number | null;
  currency: string | null;
  market_state: string | null;
  fetched_at: number;
  market_cap?: number | null;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint {
  date: string;
  ma20: number | null;
  ma50: number | null;
  ma100?: number | null;
  ma200?: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
}

export interface ChartData {
  symbol: string;
  period: string;
  interval: string;
  candles: Candle[];
  indicators: IndicatorPoint[];
  signal_summary: string;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  published_at: string | null;
  thumbnail?: string | null;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
}

export interface AnalysisIndicatorSignal {
  name: string;
  value: number | null;
  signal: string;
}

export interface AnalysisScore {
  symbol: string;
  score: number;
  label: string;
  indicators: AnalysisIndicatorSignal[];
  disclaimer?: string;
}

export interface RadarScore {
  symbol: string;
  price_action: number;
  volume: number;
  momentum: number;
  trend: number;
  volatility: number;
}

export interface SupportResistance {
  symbol: string;
  support: (number | null)[];
  resistance: (number | null)[];
}

export interface MarketSummary {
  total_market_cap: number | null;
  total_volume_24h: number | null;
  btc_dominance: number | null;
  symbols: string[];
}

export interface FearGreed {
  value: number | null;
  label: string;
  source?: string;
}

export type WatchlistCategory = 'my' | 'tech' | 'crypto' | 'forex';
