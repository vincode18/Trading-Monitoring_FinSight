"""
Service layer untuk data pasar (harga, OHLCV, info simbol) — versi backend.

Identik secara logic dengan versi Streamlit (Tahap 1), hanya beda mekanisme
cache: di sini pakai ttl_cache in-memory murni Python, bukan st.cache_data,
karena backend FastAPI tidak punya konteks Streamlit.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, asdict

import pandas as pd
import yfinance as yf

from app.config.settings import settings
from app.core.cache import ttl_cache


@dataclass
class QuoteSnapshot:
    symbol: str
    name: str
    last_price: float | None
    prev_close: float | None
    change: float | None
    change_pct: float | None
    currency: str | None
    market_state: str | None
    fetched_at: float

    def to_dict(self) -> dict:
        return asdict(self)


def _safe_float(value) -> float | None:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


@ttl_cache(ttl_seconds=settings.CACHE_TTL_SECONDS)
def get_history(symbol: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Ambil data OHLCV historis untuk satu simbol.
    period contoh: '1d','5d','1mo','6mo','1y','5y','max'
    interval contoh: '1m','5m','15m','1h','1d','1wk'
    """
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    if df.empty:
        return df
    df = df.reset_index()
    date_col = "Date" if "Date" in df.columns else "Datetime"
    df = df.rename(columns={date_col: "Date"})
    return df


@ttl_cache(ttl_seconds=settings.CACHE_TTL_SECONDS)
def get_quote_snapshot(symbol: str) -> QuoteSnapshot:
    """Ambil ringkasan harga terkini + perubahan harian untuk satu simbol."""
    ticker = yf.Ticker(symbol)
    try:
        info = ticker.fast_info
        last_price = _safe_float(getattr(info, "last_price", None))
        prev_close = _safe_float(getattr(info, "previous_close", None))
        currency = getattr(info, "currency", None)
        market_state = getattr(info, "market_state", None)
        name = symbol
        try:
            meta = ticker.get_info()
            name = meta.get("longName") or meta.get("shortName") or symbol
        except Exception:
            pass
    except Exception:
        last_price = prev_close = None
        currency = market_state = None
        name = symbol

    change = None
    change_pct = None
    if last_price is not None and prev_close:
        change = last_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else None

    return QuoteSnapshot(
        symbol=symbol,
        name=name,
        last_price=last_price,
        prev_close=prev_close,
        change=change,
        change_pct=change_pct,
        currency=currency,
        market_state=market_state,
        fetched_at=time.time(),
    )


def get_multiple_snapshots(symbols: list[str]) -> list[QuoteSnapshot]:
    """Ambil snapshot untuk banyak simbol sekaligus (dipakai watchlist besar)."""
    return [get_quote_snapshot(sym) for sym in symbols]


def search_symbol(query: str, max_results: int = 8) -> list[dict]:
    """Cari simbol berdasarkan nama/ticker (untuk fitur tambah watchlist)."""
    try:
        results = yf.Search(query, max_results=max_results).quotes
        return [
            {
                "symbol": r.get("symbol"),
                "name": r.get("shortname") or r.get("longname") or r.get("symbol"),
                "exchange": r.get("exchange"),
                "type": r.get("quoteType"),
            }
            for r in results
        ]
    except Exception:
        return []
