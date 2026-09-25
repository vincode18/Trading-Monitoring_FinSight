"""Skema request/response API (Pydantic models untuk validasi & dokumentasi otomatis)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class QuoteSnapshotResponse(BaseModel):
    symbol: str
    name: str
    last_price: float | None
    prev_close: float | None
    change: float | None
    change_pct: float | None
    currency: str | None
    market_state: str | None
    fetched_at: float
    market_cap: float | None = None
    year_high: float | None = None
    year_low: float | None = None


class CandleResponse(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class IndicatorPointResponse(BaseModel):
    date: str
    ma20: float | None = None
    ma50: float | None = None
    ma100: float | None = None
    ma200: float | None = None
    ema12: float | None = None
    ema26: float | None = None
    rsi14: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    macd_hist: float | None = None
    bb_upper: float | None = None
    bb_middle: float | None = None
    bb_lower: float | None = None


class ChartResponse(BaseModel):
    symbol: str
    period: str
    interval: str
    candles: list[CandleResponse]
    indicators: list[IndicatorPointResponse]
    signal_summary: str


class NewsItemResponse(BaseModel):
    title: str
    publisher: str
    link: str
    published_at: datetime | None


class SymbolSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str | None
    type: str | None


class WatchlistRequest(BaseModel):
    symbols: list[str]


class AnalysisIndicatorSignal(BaseModel):
    name: str
    value: float | None
    signal: str


class AnalysisScoreResponse(BaseModel):
    symbol: str
    score: float
    label: str
    indicators: list[AnalysisIndicatorSignal]
    disclaimer: str = "Not financial advice. Technical summary only."


class RadarScoreResponse(BaseModel):
    symbol: str
    price_action: float
    volume: float
    momentum: float
    trend: float
    volatility: float


class StrategyReading(BaseModel):
    label: str
    value: str | None = None


class StrategyState(BaseModel):
    code: str
    label: str
    active: bool


class StrategyCatalogItem(BaseModel):
    slug: str
    name: str


class TradePlanResponse(BaseModel):
    entry_reference: str | None = None
    stop_reference: str | None = None
    target_reference: str | None = None
    status: str
    disclaimer: str = ""


class StrategyResultResponse(BaseModel):
    symbol: str
    slug: str
    name: str
    readings: list[StrategyReading] = []
    states: list[StrategyState] = []
    disclaimer: str = "Indicator conditions for research. Not an invitation to buy or sell."
    explanation: str = ""
    match_score: float | None = None
    trade_plan: TradePlanResponse | None = None


class ScreenCondition(BaseModel):
    code: str
    label: str
    met: bool = False


class ScreenMatch(BaseModel):
    symbol: str
    match_score: float
    status: str
    conditions: list[ScreenCondition] = []


class ScreenResponse(BaseModel):
    strategy: str
    name: str
    scanned: int = 0
    matched: int = 0
    page: int = 1
    page_size: int = 10
    results: list[ScreenMatch] = []
    disclaimer: str = ""


class ScreenRequest(BaseModel):
    symbols: list[str] = []
    pool: str | None = None
    min_dividend_yield: float | None = None


class FundamentalStrategyResponse(BaseModel):
    symbol: str
    strategy: str
    name: str
    explanation: str = ""
    match_score: float = 0
    status: str
    conditions: list[ScreenCondition] = []
    trade_plan: TradePlanResponse | None = None
    equity: bool = True


class SupportResistanceResponse(BaseModel):
    symbol: str
    support: list[float | None]
    resistance: list[float | None]


class DividendPoint(BaseModel):
    date: str | None = None
    amount: float | None = None


class FundamentalTrendPoint(BaseModel):
    period: str
    revenue: float | None = None
    net_income: float | None = None


class FundamentalsResponse(BaseModel):
    symbol: str
    revenue: float | None = None
    revenue_prev: float | None = None
    net_income: float | None = None
    net_income_prev: float | None = None
    eps: float | None = None
    gross_margin: float | None = None
    operating_margin: float | None = None
    net_margin: float | None = None
    total_assets: float | None = None
    total_liabilities: float | None = None
    total_equity: float | None = None
    debt_to_equity: float | None = None
    operating_cash_flow: float | None = None
    free_cash_flow: float | None = None
    capex: float | None = None
    pe_ratio: float | None = None
    pb_ratio: float | None = None
    market_cap: float | None = None
    dividends: list[DividendPoint] = []
    trend: list[FundamentalTrendPoint] = []
    disclaimer: str = ""


class FinancialStatementResponse(BaseModel):
    symbol: str
    statement: str
    freq: str
    available: bool = False
    periods: list[str] = []
    rows: dict[str, list[float | None]] = {}


class FundamentalEarningPoint(BaseModel):
    period: str
    revenue: float | None = None
    gross_profit: float | None = None
    operating_income: float | None = None
    net_income: float | None = None
    net_income_prior: float | None = None
    eps: float | None = None


class FundamentalMarginPoint(BaseModel):
    period: str
    gross_margin: float | None = None
    operating_margin: float | None = None
    net_margin: float | None = None


class FundamentalBalancePoint(BaseModel):
    period: str
    total_assets: float | None = None
    total_equity: float | None = None
    total_liabilities: float | None = None
    short_debt: float | None = None
    long_debt: float | None = None
    total_debt: float | None = None
    der: float | None = None
    dtcr: float | None = None


class FundamentalCashPoint(BaseModel):
    period: str
    operating_cash_flow: float | None = None
    free_cash_flow: float | None = None
    capex: float | None = None


class FundamentalValuationPoint(BaseModel):
    period: str
    per: float | None = None
    pbv: float | None = None
    ev_ebitda: float | None = None
    bvps: float | None = None
    roe: float | None = None
    roa: float | None = None


class FundamentalRatios(BaseModel):
    per: float | None = None
    pbv: float | None = None
    ev_ebitda: float | None = None
    bvps: float | None = None
    roe: float | None = None
    roa: float | None = None
    der: float | None = None
    dtcr: float | None = None
    gross_margin: float | None = None
    operating_margin: float | None = None
    net_margin: float | None = None


class FundamentalChartsResponse(BaseModel):
    symbol: str
    freq: str
    equity: bool = True
    available: bool = False
    balance_freq: str = "quarterly"
    earnings: list[FundamentalEarningPoint] = []
    margins: list[FundamentalMarginPoint] = []
    balance: list[FundamentalBalancePoint] = []
    cashflow: list[FundamentalCashPoint] = []
    valuation: list[FundamentalValuationPoint] = []
    dividend_years: list[DividendPoint] = []
    dividend_payments: list[DividendPoint] = []
    ratios: FundamentalRatios = FundamentalRatios()
    notes: list[str] = []
    disclaimer: str = ""


class HolderSlice(BaseModel):
    label: str
    percent: float | None = None
    count: float | None = None


class InstitutionalHolder(BaseModel):
    name: str
    shares: float | None = None
    percent: float | None = None
    value: float | None = None
    reported: str | None = None
    percent_change: float | None = None


class InsiderTransaction(BaseModel):
    insider: str | None = None
    position: str | None = None
    transaction: str | None = None
    shares: float | None = None
    value: float | None = None
    date: str | None = None


class ShareholderAnalysisResponse(BaseModel):
    symbol: str
    equity: bool = True
    available: bool = False
    major_holders: list[HolderSlice] = []
    composition: list[HolderSlice] = []
    institutional_holders: list[InstitutionalHolder] = []
    insider_transactions: list[InsiderTransaction] = []
    disclaimer: str = ""


class FundamentalCriteriaRequest(BaseModel):
    pbv_max: float | None = 1
    der_max: float | None = 1
    roe_min: float | None = 10
    evebitda_max: float | None = 10


class FundamentalCriterionResult(BaseModel):
    key: str
    label: str
    actual: float | None = None
    threshold: float | None = None
    comparator: str
    unit: str = "ratio"
    passed: bool | None = None


class FundamentalFitResponse(BaseModel):
    symbol: str
    equity: bool = True
    available: bool = False
    passed_count: int = 0
    checked_count: int = 0
    results: list[FundamentalCriterionResult] = []
    disclaimer: str = ""


class MarketSummaryResponse(BaseModel):
    total_market_cap: float | None = None
    total_volume_24h: float | None = None
    btc_dominance: float | None = None
    symbols: list[str] = []


# --- Auth ---

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse | None = None


class UpdateProfileRequest(BaseModel):
    name: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdatePreferencesRequest(BaseModel):
    defaultMarket: str | None = None
    defaultChartPeriod: str | None = None


class SubscriptionResponse(BaseModel):
    tier: str
    status: str
    has_billing_record: bool = False
    end_date: str | None = None


class AlertCreateRequest(BaseModel):
    symbol: str
    condition: str
    threshold: float | None = None


class AlertResponse(BaseModel):
    id: str
    symbol: str
    condition: str
    threshold: float
    status: str
    triggered_at: str | None = None
    created_at: str


class HoldingCreateRequest(BaseModel):
    symbol: str
    quantity: float
    avg_buy_price: float
    buy_date: str
    note: str | None = None


class HoldingUpdateRequest(BaseModel):
    quantity: float | None = None
    avg_buy_price: float | None = None
    note: str | None = None


class HoldingResponse(BaseModel):
    id: str
    symbol: str
    quantity: float
    avg_buy_price: float
    buy_date: str | None = None
    note: str | None = None
    current_price: float | None = None
    market_value: float | None = None
    unrealized_pnl: float | None = None
    unrealized_pnl_pct: float | None = None


class PortfolioSummaryResponse(BaseModel):
    total_value: float
    total_cost: float
    total_unrealized_pnl: float
    total_unrealized_pnl_pct: float
    holdings: list[HoldingResponse] = []


class VolumeMoverResponse(BaseModel):
    symbol: str
    volume_ratio: float
    last_price: float | None = None
    change_pct: float | None = None


class MACrossAlertResponse(BaseModel):
    symbol: str
    cross_type: str  # golden | death
    ma20: float | None = None
    ma50: float | None = None


class EarningsCalendarResponse(BaseModel):
    symbol: str
    company_name: str | None = None
    earnings_date: str
    timing: str | None = None
    market_cap: float | None = None
    eps_estimate: float | None = None
    reported_eps: float | None = None
    surprise_pct: float | None = None
    event_name: str | None = None
    is_watchlist: bool = False
    raw_available: bool = True


class SentimentScoreResponse(BaseModel):
    symbol: str
    score: float
    label: str
    components: dict[str, float] = {}
    disclaimer: str = ""


class SectorPerformanceResponse(BaseModel):
    market: str
    sectors: list[dict]
