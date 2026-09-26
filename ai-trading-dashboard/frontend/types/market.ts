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

export interface Fundamentals {
  symbol: string;
  revenue: number | null;
  revenue_prev: number | null;
  net_income: number | null;
  net_income_prev: number | null;
  eps: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  total_assets: number | null;
  total_liabilities: number | null;
  total_equity: number | null;
  debt_to_equity: number | null;
  operating_cash_flow: number | null;
  free_cash_flow: number | null;
  capex: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  market_cap: number | null;
  dividends: Array<{ date: string | null; amount: number | null }>;
  trend: Array<{ period: string; revenue: number | null; net_income: number | null }>;
  disclaimer?: string;
}

export type FundamentalFreq = 'quarterly' | 'yearly' | 'trailing';

export interface FundamentalEarningPoint {
  period: string;
  revenue: number | null;
  gross_profit: number | null;
  operating_income: number | null;
  net_income: number | null;
  net_income_prior: number | null;
  eps: number | null;
}

export interface FundamentalMarginPoint {
  period: string;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
}

export interface FundamentalBalancePoint {
  period: string;
  total_assets: number | null;
  total_equity: number | null;
  total_liabilities: number | null;
  short_debt: number | null;
  long_debt: number | null;
  total_debt: number | null;
  der: number | null;
  dtcr: number | null;
}

export interface FundamentalCashPoint {
  period: string;
  operating_cash_flow: number | null;
  free_cash_flow: number | null;
  capex: number | null;
}

export interface FundamentalValuationPoint {
  period: string;
  per: number | null;
  pbv: number | null;
  ev_ebitda: number | null;
  bvps: number | null;
  roe: number | null;
  roa: number | null;
}

export interface FundamentalRatios {
  per: number | null;
  pbv: number | null;
  ev_ebitda: number | null;
  bvps: number | null;
  roe: number | null;
  roa: number | null;
  der: number | null;
  dtcr: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
}

export interface FundamentalCharts {
  symbol: string;
  freq: string;
  equity: boolean;
  available: boolean;
  balance_freq: string;
  earnings: FundamentalEarningPoint[];
  margins: FundamentalMarginPoint[];
  balance: FundamentalBalancePoint[];
  cashflow: FundamentalCashPoint[];
  valuation: FundamentalValuationPoint[];
  dividend_years: Array<{ date: string | null; amount: number | null }>;
  dividend_payments: Array<{ date: string | null; amount: number | null }>;
  ratios: FundamentalRatios;
  notes: string[];
  disclaimer: string;
}

export interface HolderSlice {
  label: string;
  percent: number | null;
  count: number | null;
}

export interface InstitutionalHolder {
  name: string;
  shares: number | null;
  percent: number | null;
  value: number | null;
  reported: string | null;
  percent_change: number | null;
}

export interface InsiderTransaction {
  insider: string | null;
  position: string | null;
  transaction: string | null;
  shares: number | null;
  value: number | null;
  date: string | null;
}

export interface ShareholderAnalysis {
  symbol: string;
  equity: boolean;
  available: boolean;
  major_holders: HolderSlice[];
  composition: HolderSlice[];
  institutional_holders: InstitutionalHolder[];
  insider_transactions: InsiderTransaction[];
  disclaimer: string;
}

export interface FundamentalCriteria {
  pbv_max: number | null;
  der_max: number | null;
  roe_min: number | null;
  evebitda_max: number | null;
}

export interface FundamentalCriterionResult {
  key: string;
  label: string;
  actual: number | null;
  threshold: number | null;
  comparator: string;
  unit: string;
  passed: boolean | null;
}

export interface FundamentalFitResult {
  symbol: string;
  equity: boolean;
  available: boolean;
  passed_count: number;
  checked_count: number;
  results: FundamentalCriterionResult[];
  disclaimer: string;
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

export type AlertCondition =
  | 'PRICE_ABOVE'
  | 'PRICE_BELOW'
  | 'CHANGE_PCT_ABOVE'
  | 'CHANGE_PCT_BELOW'
  | 'RSI_OVERBOUGHT'
  | 'RSI_OVERSOLD'
  | 'GOLDEN_CROSS'
  | 'DEATH_CROSS'
  | 'VOLUME_SPIKE';

export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'DISABLED';

export interface Alert {
  id: string;
  symbol: string;
  condition: AlertCondition | string;
  threshold: number;
  status: AlertStatus | string;
  triggered_at: string | null;
  created_at: string;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avg_buy_price: number;
  buy_date: string | null;
  note: string | null;
  current_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pnl_pct: number | null;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_pct: number;
  holdings: Holding[];
}

export interface UserPreferences {
  defaultMarket?: string;
  defaultChartPeriod?: string;
}

export interface StrategyCatalogItem {
  slug: string;
  name: string;
}

export interface StrategyReading {
  label: string;
  value: string | null;
}

export interface StrategyState {
  code: string;
  label: string;
  active: boolean;
}

export interface StrategyResult {
  symbol: string;
  slug: string;
  name: string;
  readings: StrategyReading[];
  states: StrategyState[];
  disclaimer: string;
  explanation?: string;
  match_score?: number | null;
  trade_plan?: TradePlan | null;
}

export interface ScreenCondition {
  code: string;
  label: string;
  met: boolean;
}

export interface TradePlan {
  entry_reference: string | null;
  stop_reference: string | null;
  target_reference: string | null;
  status: string;
  disclaimer: string;
}

export interface ScreenMatch {
  symbol: string;
  match_score: number;
  status: string;
  conditions: ScreenCondition[];
}

export interface ScreenResult {
  strategy: string;
  name: string;
  scanned: number;
  matched: number;
  page?: number;
  page_size?: number;
  results: ScreenMatch[];
  disclaimer: string;
}

export interface FundamentalStrategyDetail {
  symbol: string;
  strategy: string;
  name: string;
  explanation: string;
  match_score: number;
  status: string;
  conditions: ScreenCondition[];
  trade_plan: TradePlan | null;
  equity: boolean;
}

export interface SubscriptionInfo {
  tier: string;
  status: string;
  has_billing_record: boolean;
  end_date?: string | null;
}