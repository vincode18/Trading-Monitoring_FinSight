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
