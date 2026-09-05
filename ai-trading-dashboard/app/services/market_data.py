"""
Service layer untuk data pasar (harga, OHLCV, info simbol).

Kenapa dipisah jadi "service"?
Supaya UI (Streamlit) tidak pernah bicara langsung ke yfinance. Kalau nanti
Tahap 2/3 kita pindah sumber data ke API berbayar (Polygon, Alpha Vantage,
Twelve Data) karena butuh SLA lebih stabil untuk banyak user, cukup ubah
file ini saja — UI dan indikator teknikal tidak perlu disentuh.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

import pandas as pd
import streamlit as st
import yfinance as yf

from app.config.settings import settings


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


def _safe_float(value) -> float | None:
    try:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _fast_info_get(info, *keys):
    """Ambil nilai dari fast_info yang mendukung akses attribute atau dict."""
    for key in keys:
        try:
            if hasattr(info, "get"):
                value = info.get(key)
                if value is not None:
                    return value
        except Exception:
            pass
        try:
            value = getattr(info, key, None)
            if value is not None:
                return value
        except Exception:
            pass
    return None


@st.cache_data(ttl=settings.CACHE_TTL_SECONDS, show_spinner=False)
def get_history(symbol: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    """
    Ambil data OHLCV historis untuk satu simbol.
    period contoh: '1d','5d','1mo','6mo','1y','5y','max'
    interval contoh: '1m','5m','15m','1h','1d','1wk'
    Catatan: interval kecil (menit) hanya tersedia untuk periode pendek (batasan Yahoo).
    """
    empty = pd.DataFrame(columns=["Date", "Open", "High", "Low", "Close", "Volume"])
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval, auto_adjust=True)
    except Exception:
        return empty

    if df is None or df.empty:
        return empty

    df = df.reset_index()
    # Normalisasi nama kolom tanggal (kadang 'Date', kadang 'Datetime')
    date_col = "Date" if "Date" in df.columns else ("Datetime" if "Datetime" in df.columns else None)
    if date_col:
        df = df.rename(columns={date_col: "Date"})
    return df


@st.cache_data(ttl=settings.CACHE_TTL_SECONDS, show_spinner=False)
def get_quote_snapshot(symbol: str) -> QuoteSnapshot:
    """Ambil ringkasan harga terkini + perubahan harian untuk satu simbol."""
    last_price = prev_close = None
    currency = market_state = None
    name = symbol

    try:
        ticker = yf.Ticker(symbol)
        try:
            info = ticker.fast_info
            last_price = _safe_float(_fast_info_get(info, "last_price", "lastPrice"))
            prev_close = _safe_float(
                _fast_info_get(info, "previous_close", "previousClose", "regularMarketPreviousClose")
            )
            currency = _fast_info_get(info, "currency")
            market_state = _fast_info_get(info, "market_state", "marketState")
        except Exception:
            pass

        # Fallback: ambil close terakhir dari history singkat jika fast_info kosong
        if last_price is None or prev_close is None:
            try:
                hist = ticker.history(period="5d", interval="1d", auto_adjust=True)
                if hist is not None and not hist.empty:
                    closes = hist["Close"].dropna()
                    if len(closes) >= 1 and last_price is None:
                        last_price = _safe_float(closes.iloc[-1])
                    if len(closes) >= 2 and prev_close is None:
                        prev_close = _safe_float(closes.iloc[-2])
                    elif len(closes) == 1 and prev_close is None:
                        prev_close = last_price
            except Exception:
                pass

        try:
            meta = ticker.get_info()
            name = meta.get("longName") or meta.get("shortName") or meta.get("name") or symbol
            if not currency:
                currency = meta.get("currency")
            if not market_state:
                market_state = meta.get("marketState")
        except Exception:
            pass
    except Exception:
        pass

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
    results: list[QuoteSnapshot] = []
    for sym in symbols:
        try:
            results.append(get_quote_snapshot(sym))
        except Exception:
            results.append(
                QuoteSnapshot(
                    symbol=sym,
                    name=sym,
                    last_price=None,
                    prev_close=None,
                    change=None,
                    change_pct=None,
                    currency=None,
                    market_state=None,
                    fetched_at=time.time(),
                )
            )
    return results


def search_symbol(query: str, max_results: int = 8) -> list[dict]:
    """Cari simbol berdasarkan nama/ticker (untuk fitur tambah watchlist)."""
    try:
        results = yf.Search(query, max_results=max_results).quotes or []
        parsed = []
        for r in results:
            symbol = r.get("symbol")
            if not symbol:
                continue
            parsed.append(
                {
                    "symbol": symbol,
                    "name": r.get("shortname") or r.get("longname") or symbol,
                    "exchange": r.get("exchange") or r.get("exchDisp"),
                    "type": r.get("quoteType") or r.get("typeDisp"),
                }
            )
        return parsed
    except Exception:
        return []
