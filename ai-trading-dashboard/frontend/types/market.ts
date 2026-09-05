// Tipe-tipe ini sengaja dijaga sinkron manual dengan backend/app/api/schemas.py.
// Kalau schema backend berubah, update juga di sini.

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
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
}
