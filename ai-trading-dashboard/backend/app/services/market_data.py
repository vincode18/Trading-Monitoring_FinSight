"""
Service layer untuk data pasar (harga, OHLCV, info simbol) — versi backend.

Identik secara logic dengan versi Streamlit (Tahap 1), hanya beda mekanisme
cache: di sini pakai ttl_cache in-memory murni Python, bukan st.cache_data,
karena backend FastAPI tidak punya konteks Streamlit.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, asdict
from datetime import datetime

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
    market_cap: float | None = None
    year_high: float | None = None
    year_low: float | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def _safe_float(value) -> float | None:
    try:
        if value is None:
            return None
        if isinstance(value, float) and pd.isna(value):
            return None
        f = float(value)
        if f != f:  # NaN
            return None
        return f
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
    market_cap = None
    year_high = None
    year_low = None
    try:
        info = ticker.fast_info
        last_price = _safe_float(getattr(info, "last_price", None))
        prev_close = _safe_float(getattr(info, "previous_close", None))
        currency = getattr(info, "currency", None)
        market_state = getattr(info, "market_state", None)
        year_high = _safe_float(getattr(info, "year_high", None))
        year_low = _safe_float(getattr(info, "year_low", None))
        name = symbol
        try:
            meta = ticker.get_info()
            name = meta.get("longName") or meta.get("shortName") or symbol
            market_cap = _safe_float(meta.get("marketCap"))
            if year_high is None:
                year_high = _safe_float(meta.get("fiftyTwoWeekHigh"))
            if year_low is None:
                year_low = _safe_float(meta.get("fiftyTwoWeekLow"))
        except Exception:
            pass
    except Exception:
        last_price = prev_close = None
        currency = market_state = None
        name = symbol
        market_cap = None
        year_high = year_low = None

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
        market_cap=market_cap,
        year_high=year_high,
        year_low=year_low,
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


def _to_iso_date(value) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    try:
        if hasattr(value, "to_pydatetime"):
            value = value.to_pydatetime()
        if isinstance(value, datetime):
            return value.isoformat()
        if hasattr(value, "isoformat"):
            return value.isoformat()
        ts = pd.Timestamp(value)
        if pd.isna(ts):
            return None
        return ts.to_pydatetime().isoformat()
    except Exception:
        s = str(value).strip()
        return s or None


def _normalize_timing(raw) -> str | None:
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    key = str(raw).strip().upper()
    if key in {"BMO", "BEFORE MARKET OPEN", "PRE-MARKET", "PREMARKET", "TAS"}:
        return "Pre-Market"
    if key in {"AMC", "AFTER MARKET CLOSE", "AFTER-MARKET", "AFTERMARKET"}:
        return "After-Market"
    if key in {"DURING MARKET HOURS", "DMH"}:
        return "During Market"
    return str(raw).strip() or None


def _row_to_earnings_item(
    *,
    symbol: str,
    company_name: str | None,
    earnings_date: str | None,
    timing: str | None = None,
    market_cap: float | None = None,
    eps_estimate: float | None = None,
    reported_eps: float | None = None,
    surprise_pct: float | None = None,
    event_name: str | None = None,
) -> dict | None:
    if not symbol or not earnings_date:
        return None
    return {
        "symbol": symbol.upper(),
        "company_name": company_name,
        "earnings_date": earnings_date,
        "timing": timing,
        "market_cap": market_cap,
        "eps_estimate": eps_estimate,
        "reported_eps": reported_eps,
        "surprise_pct": surprise_pct,
        "event_name": event_name,
        "raw_available": True,
    }


@ttl_cache(ttl_seconds=max(600, settings.CACHE_TTL_SECONDS))
def get_earnings_calendar(symbol: str) -> dict | None:
    """
    Ambil jadwal earnings dari yfinance.Ticker().calendar / earnings_dates
    (jalur per-simbol — dipakai hybrid untuk IDX).
    """
    try:
        ticker = yf.Ticker(symbol)
        # Prefer earnings_dates (lebih lengkap: estimate/actual/surprise)
        ed = getattr(ticker, "earnings_dates", None)
        if ed is not None and hasattr(ed, "empty") and not ed.empty:
            row = ed.iloc[0]
            item = _row_to_earnings_item(
                symbol=symbol,
                company_name=None,
                earnings_date=_to_iso_date(ed.index[0]),
                eps_estimate=_safe_float(row["EPS Estimate"] if "EPS Estimate" in row.index else None),
                reported_eps=_safe_float(row["Reported EPS"] if "Reported EPS" in row.index else None),
                surprise_pct=_safe_float(row["Surprise(%)"] if "Surprise(%)" in row.index else None),
            )
            if item:
                return item

        cal = ticker.calendar
        if cal is None:
            return None

        earnings_date = None
        eps_estimate = None
        if isinstance(cal, dict):
            raw = cal.get("Earnings Date") or cal.get("earningsDate") or cal.get("EarningsDate")
            if isinstance(raw, (list, tuple)) and raw:
                earnings_date = raw[0]
            else:
                earnings_date = raw
            eps_estimate = _safe_float(cal.get("Earnings Average") or cal.get("epsAverage"))
        else:
            try:
                if hasattr(cal, "empty") and cal.empty:
                    return None
                if "Earnings Date" in getattr(cal, "index", []):
                    earnings_date = cal.loc["Earnings Date"]
                    if hasattr(earnings_date, "iloc"):
                        earnings_date = earnings_date.iloc[0]
                elif hasattr(cal, "columns") and "Earnings Date" in cal.columns:
                    earnings_date = cal["Earnings Date"].iloc[0]
            except Exception:
                return None

        return _row_to_earnings_item(
            symbol=symbol,
            company_name=None,
            earnings_date=_to_iso_date(earnings_date),
            eps_estimate=eps_estimate,
        )
    except Exception:
        return None


@ttl_cache(ttl_seconds=3600)
def get_earnings_calendar_market_wide(
    start: str | None = None,
    end: str | None = None,
    limit: int = 50,
    only_unreported: bool = True,
) -> list[dict]:
    """
    Earnings calendar market-wide via yfinance.Calendars (US-focused).
    Kolom terverifikasi: Company, Marketcap, Event Name, Event Start Date,
    Timing (BMO/AMC), EPS Estimate, Reported EPS, Surprise(%); Symbol = index.
    """
    try:
        calendars = yf.Calendars(start=start, end=end)
        df = calendars.get_earnings_calendar(
            limit=min(max(limit, 1), 100),
            filter_most_active=True,
            force=False,
        )
    except Exception:
        return []

    if df is None or getattr(df, "empty", True):
        return []

    work = df.copy()
    if only_unreported and "Reported EPS" in work.columns:
        work = work[work["Reported EPS"].isnull()]

    results: list[dict] = []
    for idx, row in work.iterrows():
        symbol = str(idx) if not isinstance(idx, tuple) else str(idx[0])
        # Some YF versions put Symbol as a column
        if "Symbol" in work.columns and pd.notna(row.get("Symbol")):
            symbol = str(row.get("Symbol"))
        date_raw = None
        for col in ("Event Start Date", "Earnings Date", "startdatetime"):
            if col in work.columns:
                date_raw = row.get(col)
                break
        item = _row_to_earnings_item(
            symbol=symbol,
            company_name=str(row.get("Company")) if pd.notna(row.get("Company")) else None,
            earnings_date=_to_iso_date(date_raw),
            timing=_normalize_timing(row.get("Timing")),
            market_cap=_safe_float(row.get("Marketcap")),
            eps_estimate=_safe_float(row.get("EPS Estimate")),
            reported_eps=_safe_float(row.get("Reported EPS")),
            surprise_pct=_safe_float(row.get("Surprise(%)")),
            event_name=str(row.get("Event Name")) if pd.notna(row.get("Event Name")) else None,
        )
        if item:
            results.append(item)

    results.sort(key=lambda r: r["earnings_date"])
    return results[:limit]


def get_earnings_calendar_for_symbols(
    symbols: list[str],
    *,
    start: datetime | None = None,
    end: datetime | None = None,
    only_unreported: bool = True,
    limit: int | None = None,
) -> list[dict]:
    """Loop per-simbol (hybrid path untuk Indonesia / pool lokal)."""
    results: list[dict] = []
    for sym in symbols:
        item = get_earnings_calendar(sym)
        if not item or not item.get("earnings_date"):
            continue
        try:
            dt = datetime.fromisoformat(str(item["earnings_date"]).replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=None)
            cmp_dt = dt.replace(tzinfo=None) if dt.tzinfo else dt
            if start is not None:
                s = start.replace(tzinfo=None) if start.tzinfo else start
                if cmp_dt < s:
                    continue
            if end is not None:
                e = end.replace(tzinfo=None) if end.tzinfo else end
                if cmp_dt > e:
                    continue
        except Exception:
            continue
        if only_unreported and item.get("reported_eps") is not None:
            continue
        results.append(item)

    results.sort(key=lambda r: r["earnings_date"])
    if limit is not None:
        return results[:limit]
    return results


def _row_latest(df: pd.DataFrame | None, names: list[str], nth: int = 0) -> float | None:
    """Ambil nilai kolom ke-nth (0 = terbaru) dari baris yang namanya cocok."""
    if df is None or getattr(df, "empty", True):
        return None
    target = None
    wanted = {n.lower() for n in names}
    for label in df.index:
        if str(label).strip().lower() in wanted:
            target = df.loc[label]
            break
    if target is None:
        return None
    values = []
    series = target if hasattr(target, "items") else [target]
    try:
        iterable = list(target)
    except TypeError:
        iterable = [target]
    for raw in iterable:
        num = _safe_float(raw)
        if num is not None:
            values.append(num)
    if nth >= len(values):
        return None
    return values[nth]


def _margin(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return round((numerator / denominator) * 100, 4)


@ttl_cache(ttl_seconds=3600)
def get_fundamentals(symbol: str) -> dict:
    """
    Ringkasan fundamental dari yfinance (income, balance, cashflow, dividends, info).
    Nama baris dicocokkan secara longgar — kosong jika Yahoo tidak menyediakan data (umum di IDX).
    """
    empty = {
        "symbol": symbol.upper(),
        "revenue": None,
        "revenue_prev": None,
        "net_income": None,
        "net_income_prev": None,
        "eps": None,
        "gross_margin": None,
        "operating_margin": None,
        "net_margin": None,
        "total_assets": None,
        "total_liabilities": None,
        "total_equity": None,
        "debt_to_equity": None,
        "operating_cash_flow": None,
        "free_cash_flow": None,
        "capex": None,
        "pe_ratio": None,
        "pb_ratio": None,
        "market_cap": None,
        "dividends": [],
        "trend": [],
        "disclaimer": "Financial figures from third-party market data — not investment advice. IDX stocks often have empty fields.",
    }
    try:
        ticker = yf.Ticker(symbol)
        income = getattr(ticker, "income_stmt", None)
        q_income = getattr(ticker, "quarterly_income_stmt", None)
        balance = getattr(ticker, "balance_sheet", None)
        cash = getattr(ticker, "cashflow", None)
        source = q_income if q_income is not None and not getattr(q_income, "empty", True) else income

        revenue = _row_latest(source, ["Total Revenue", "Operating Revenue", "Revenue"])
        revenue_prev = _row_latest(source, ["Total Revenue", "Operating Revenue", "Revenue"], 1)
        net_income = _row_latest(source, ["Net Income", "Net Income Common Stockholders"])
        net_income_prev = _row_latest(source, ["Net Income", "Net Income Common Stockholders"], 1)
        gross = _row_latest(source, ["Gross Profit"])
        operating = _row_latest(source, ["Operating Income", "Operating Income Loss"])
        eps = _row_latest(source, ["Diluted EPS", "Basic EPS"])

        assets = _row_latest(balance, ["Total Assets"])
        liabilities = _row_latest(
            balance,
            ["Total Liabilities Net Minority Interest", "Total Liabilities"],
        )
        equity = _row_latest(
            balance,
            ["Stockholders Equity", "Total Equity Gross Minority Interest", "Common Stock Equity"],
        )
        debt = _row_latest(balance, ["Total Debt"])

        ocf = _row_latest(cash, ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities"])
        fcf = _row_latest(cash, ["Free Cash Flow"])
        capex = _row_latest(cash, ["Capital Expenditure", "Capital Expenditures"])

        pe = pb = mcap = None
        try:
            info = ticker.info or {}
            pe = _safe_float(info.get("trailingPE") or info.get("forwardPE"))
            pb = _safe_float(info.get("priceToBook"))
            mcap = _safe_float(info.get("marketCap"))
        except Exception:
            pass

        dividends = []
        try:
            div = ticker.dividends
            if div is not None and len(div):
                tail = div.tail(8)
                for idx, amount in tail.items():
                    dividends.append({"date": _to_iso_date(idx), "amount": _safe_float(amount)})
        except Exception:
            dividends = []

        trend = []
        if source is not None and not getattr(source, "empty", True):
            cols = list(source.columns)[:8]
            for col in reversed(cols):
                def cell(names: list[str]) -> float | None:
                    for label in source.index:
                        if str(label).strip().lower() in {n.lower() for n in names}:
                            return _safe_float(source.loc[label, col])
                    return None

                trend.append(
                    {
                        "period": _to_iso_date(col) or str(col)[:10],
                        "revenue": cell(["Total Revenue", "Operating Revenue", "Revenue"]),
                        "net_income": cell(["Net Income", "Net Income Common Stockholders"]),
                    }
                )

        return {
            **empty,
            "revenue": revenue,
            "revenue_prev": revenue_prev,
            "net_income": net_income,
            "net_income_prev": net_income_prev,
            "eps": eps,
            "gross_margin": _margin(gross, revenue),
            "operating_margin": _margin(operating, revenue),
            "net_margin": _margin(net_income, revenue),
            "total_assets": assets,
            "total_liabilities": liabilities,
            "total_equity": equity,
            "debt_to_equity": (debt / equity) if debt is not None and equity not in (None, 0) else None,
            "operating_cash_flow": ocf,
            "free_cash_flow": fcf,
            "capex": capex,
            "pe_ratio": pe,
            "pb_ratio": pb,
            "market_cap": mcap,
            "dividends": dividends,
            "trend": trend,
        }
    except Exception:
        return empty
