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
  year_high?: number | null;
  year_low?: number | null;
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

export interface VolumeMover {
  symbol: string;
  volume_ratio: number;
  last_price: number | null;
  change_pct: number | null;
}

export interface MACrossAlert {
  symbol: string;
  cross_type: 'golden' | 'death' | string;
  ma20: number | null;
  ma50: number | null;
}

export interface EarningsCalendarItem {
  symbol: string;
  company_name?: string | null;
  earnings_date: string;
  timing?: string | null;
  market_cap?: number | null;
  eps_estimate?: number | null;
  reported_eps?: number | null;
  surprise_pct?: number | null;
  event_name?: string | null;
  is_watchlist?: boolean;
  raw_available: boolean;
}

export interface SentimentScore {
  symbol: string;
  score: number;
  label: string;
  components: Record<string, number>;
  disclaimer?: string;
}

export interface SectorPerformance {
  market: string;
  sectors: Array<{
    name: string;
    avg_change_pct: number | null;
    symbols: string[];
    count: number;
  }>;
}

export type WatchlistCategory = 'my' | 'tech' | 'crypto' | 'forex';
