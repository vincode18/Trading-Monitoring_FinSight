"""Fundamental screens. Thresholds are the draft rules from the screener spec."""
from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
import yfinance as yf

from app.core.cache import ttl_cache
from app.services.fundamentals import (
    NET_NAMES,
    REVENUE_NAMES,
    _pick,
    get_financial_statement,
    is_equity_symbol,
)
from app.services.market_data import _safe_float
from app.services.strategy_screen import MAX_SYMBOLS, PAGE_SIZE, SCREEN_DISCLAIMER, _paginate

EARNINGS_GROWTH_MIN = 20.0
DEFAULT_DIVIDEND_YIELD = 2.0

FUNDAMENTAL_SCREENS: dict[str, dict] = {
    "minervini-fundamentals": {
        "name": "Minervini Fundamentals",
        "explanation": (
            "Quarterly earnings and revenue versus the same quarter a year earlier. "
            f"A match needs earnings growth of at least {EARNINGS_GROWTH_MIN:.0f}% and revenue that is higher than a year ago."
        ),
    },
    "graham-number": {
        "name": "Graham Number Value",
        "explanation": (
            "Benjamin Graham's number is the square root of 22.5 × trailing EPS × book value per share. "
            "A match means the latest price is at or below that number."
        ),
    },
    "dividend-yield": {
        "name": "Dividend Yield",
        "explanation": (
            "Annualized dividend yield from the data provider. "
            "A match means the yield is at or above the limit you set (default 2%)."
        ),
    },
    "analyst-consensus": {
        "name": "Analyst Consensus",
        "explanation": (
            "Latest analyst-count summary. "
            "A match means Buy plus Strong Buy is larger than Hold, Sell, and Strong Sell combined."
        ),
    },
}


def list_fundamental_screens() -> list[dict]:
    return [{"slug": slug, "name": rule["name"]} for slug, rule in FUNDAMENTAL_SCREENS.items()]


def _yield_percent(raw) -> float | None:
    number = _safe_float(raw)
    if number is None:
        return None
    if abs(number) <= 0.25:
        number *= 100
    return round(number, 2)


def _growth(latest: float | None, prior: float | None) -> float | None:
    if latest is None or prior is None or prior == 0:
        return None
    return (latest - prior) / abs(prior) * 100


def _analyst_counts(frame) -> dict | None:
    if frame is None or not isinstance(frame, pd.DataFrame) or frame.empty:
        return None
    row = frame.iloc[0]
    lookup = {str(col).lower().replace(" ", "").replace("_", ""): col for col in frame.columns}

    def num(*names: str) -> float:
        for name in names:
            key = lookup.get(name.lower().replace(" ", "").replace("_", ""))
            if key is None:
                continue
            value = _safe_float(row[key])
            if value is not None:
                return value
        return 0.0

    strong_buy = num("strongbuy")
    buy = num("buy")
    hold = num("hold")
    sell = num("sell")
    strong_sell = num("strongsell")
    if strong_buy + buy + hold + sell + strong_sell == 0:
        return None
    return {
        "strong_buy": strong_buy,
        "buy": buy,
        "hold": hold,
        "sell": sell,
        "strong_sell": strong_sell,
    }


@ttl_cache(ttl_seconds=3600)
def fundamental_snapshot(symbol: str) -> dict:
    symbol = symbol.upper().strip()
    empty = {
        "symbol": symbol,
        "equity": is_equity_symbol(symbol),
        "price": None,
        "eps": None,
        "book_value": None,
        "dividend_yield": None,
        "revenue_growth": None,
        "earnings_growth": None,
        "analyst": None,
    }
    if not empty["equity"]:
        return empty
    try:
        info = yf.Ticker(symbol).info or {}
    except Exception:
        info = {}
    empty["price"] = _safe_float(info.get("currentPrice") or info.get("regularMarketPrice"))
    empty["eps"] = _safe_float(info.get("trailingEps"))
    empty["book_value"] = _safe_float(info.get("bookValue"))
    empty["dividend_yield"] = _yield_percent(info.get("dividendYield"))
    try:
        income = get_financial_statement(symbol, "income_stmt", "quarterly")
        revenue = _pick(income, REVENUE_NAMES)
        net = _pick(income, NET_NAMES)
        if len(revenue) >= 5:
            empty["revenue_growth"] = _growth(revenue[-1], revenue[-5])
        if len(net) >= 5:
            empty["earnings_growth"] = _growth(net[-1], net[-5])
    except Exception:
        pass
    try:
        empty["analyst"] = _analyst_counts(yf.Ticker(symbol).recommendations_summary)
    except Exception:
        empty["analyst"] = None
    return empty


def _condition(code: str, label: str, met: bool | None) -> dict:
    return {"code": code, "label": label, "met": bool(met)}


def _plan(entry: str, stop: str | None, status: str) -> dict:
    return {
        "entry_reference": entry,
        "stop_reference": stop,
        "target_reference": None,
        "status": status,
        "disclaimer": SCREEN_DISCLAIMER,
    }


def _fmt(value: float | None, digits: int = 2) -> str:
    if value is None:
        return "—"
    return f"{value:.{digits}f}"


def evaluate_fundamental(symbol: str, slug: str, min_dividend_yield: float = DEFAULT_DIVIDEND_YIELD) -> dict:
    if slug not in FUNDAMENTAL_SCREENS:
        raise ValueError("Unknown fundamental screen")
    snap = fundamental_snapshot(symbol)
    rule = FUNDAMENTAL_SCREENS[slug]
    conditions: list[dict] = []
    status = "Condition not met"
    entry = ""
    stop = None
    score = 0.0

    if not snap["equity"]:
        status = "Condition not met"
        entry = "Fundamental screens apply to equities."
    elif slug == "minervini-fundamentals":
        earnings_ok = snap["earnings_growth"] is not None and snap["earnings_growth"] >= EARNINGS_GROWTH_MIN
        revenue_ok = snap["revenue_growth"] is not None and snap["revenue_growth"] > 0
        conditions = [
            _condition("MVF1", f"Earnings growth at least {EARNINGS_GROWTH_MIN:.0f}% vs year-ago quarter ({_fmt(snap['earnings_growth'])}%)", earnings_ok if snap["earnings_growth"] is not None else False),
            _condition("MVF2", f"Revenue higher than the year-ago quarter ({_fmt(snap['revenue_growth'])}%)", revenue_ok if snap["revenue_growth"] is not None else False),
        ]
        if snap["earnings_growth"] is None or snap["revenue_growth"] is None:
            status = "Condition not met"
        elif earnings_ok and revenue_ok:
            status = "Condition met"
        elif (snap["earnings_growth"] or 0) >= EARNINGS_GROWTH_MIN * 0.75 or (snap["revenue_growth"] or 0) > 0:
            status = "Approaching"
        score = sum(1 for row in conditions if row["met"]) / len(conditions)
        entry = f"Earnings growth {_fmt(snap['earnings_growth'])}% and revenue growth {_fmt(snap['revenue_growth'])}% versus the year-ago quarter"
        stop = None
    elif slug == "graham-number":
        eps, book, price = snap["eps"], snap["book_value"], snap["price"]
        graham = None
        if eps is not None and book is not None and eps > 0 and book > 0:
            graham = math.sqrt(22.5 * eps * book)
        met = graham is not None and price is not None and price <= graham
        near = graham is not None and price is not None and (not met) and price <= graham * 1.05
        conditions = [
            _condition("GR1", f"Price {_fmt(price)} at or below Graham number {_fmt(graham)}", met),
        ]
        status = "Condition met" if met else "Approaching" if near else "Condition not met"
        score = 1.0 if met else 0.0
        entry = f"At or below the Graham number (current: {_fmt(graham)}). Latest price: {_fmt(price)}"
        stop = "The Graham number is a value ceiling in this rule, not a stop level"
    elif slug == "dividend-yield":
        limit = min_dividend_yield if min_dividend_yield is not None else DEFAULT_DIVIDEND_YIELD
        current = snap["dividend_yield"]
        met = current is not None and current >= limit
        near = current is not None and (not met) and current >= limit - 0.5
        conditions = [
            _condition("DY1", f"Dividend yield {_fmt(current)}% at or above {limit:.2f}%", met),
        ]
        status = "Condition met" if met else "Approaching" if near else "Condition not met"
        score = 1.0 if met else 0.0
        entry = f"Annualized yield at or above {limit:.2f}% (current: {_fmt(current)}%)"
        stop = None
    else:
        analyst = snap["analyst"]
        if analyst:
            bullish = analyst["strong_buy"] + analyst["buy"]
            other = analyst["hold"] + analyst["sell"] + analyst["strong_sell"]
            met = bullish > other and bullish > 0
            conditions = [
                _condition(
                    "AN1",
                    f"Buy {bullish:.0f} versus other ratings {other:.0f}",
                    met,
                )
            ]
            status = "Condition met" if met else "Condition not met"
            score = 1.0 if met else 0.0
            entry = f"Buy and Strong Buy ({bullish:.0f}) compared with Hold, Sell, and Strong Sell ({other:.0f})"
        else:
            conditions = [_condition("AN1", "Analyst summary is not available", False)]
            entry = "Analyst summary is not available for this symbol"
            status = "Condition not met"
            score = 0.0
        stop = None

    return {
        "symbol": snap["symbol"],
        "strategy": slug,
        "name": rule["name"],
        "explanation": rule["explanation"],
        "match_score": round(score, 4),
        "status": status,
        "conditions": conditions,
        "trade_plan": _plan(entry, stop, status),
        "equity": snap["equity"],
    }


def screen_fundamental(
    slug: str,
    symbols: list[str],
    min_dividend_yield: float = DEFAULT_DIVIDEND_YIELD,
    page: int | None = None,
    page_size: int = PAGE_SIZE,
    symbol_limit: int = MAX_SYMBOLS,
) -> dict:
    if slug not in FUNDAMENTAL_SCREENS:
        raise ValueError("Unknown fundamental screen")
    cleaned = []
    seen = set()
    for raw in symbols:
        symbol = str(raw).upper().strip()
        if symbol and symbol not in seen and is_equity_symbol(symbol):
            seen.add(symbol)
            cleaned.append(symbol)
        if len(cleaned) >= symbol_limit:
            break
    rows: list[dict] = []
    if cleaned:
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(evaluate_fundamental, symbol, slug, min_dividend_yield) for symbol in cleaned]
            for future in as_completed(futures):
                row = future.result()
                if row["status"] == "Condition met":
                    rows.append(
                        {
                            "symbol": row["symbol"],
                            "match_score": row["match_score"],
                            "status": row["status"],
                            "conditions": row["conditions"],
                        }
                    )
    rows.sort(key=lambda row: (-row["match_score"], row["symbol"]))
    page_rows, current, size = _paginate(rows, page, page_size)
    return {
        "strategy": slug,
        "name": FUNDAMENTAL_SCREENS[slug]["name"],
        "scanned": len(cleaned),
        "matched": len(rows),
        "page": current,
        "page_size": size,
        "results": page_rows,
        "disclaimer": SCREEN_DISCLAIMER,
    }
