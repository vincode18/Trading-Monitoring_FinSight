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


class SupportResistanceResponse(BaseModel):
    symbol: str
    support: list[float | None]
    resistance: list[float | None]


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
