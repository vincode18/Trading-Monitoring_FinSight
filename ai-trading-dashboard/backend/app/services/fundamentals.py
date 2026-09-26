"""
Fundamental statement history, shareholder breakdown, and fit check.

Field names were checked against yfinance 1.7 (`pretty=True`) for AAPL and BBCA.JK:
income, balance sheet, and cash flow row labels, plus major holders,
institutional holders, and insider transactions.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import yfinance as yf

from app.core.cache import ttl_cache
from app.services.market_data import _safe_float, _to_iso_date, get_history

STATEMENT_METHODS = ("income_stmt", "balance_sheet", "cashflow")
FREQUENCIES = ("yearly", "quarterly", "trailing")
PERIOD_LIMIT = 8

DISCLAIMER = (
    "Financial figures come from a third-party market data provider. "
    "They are research facts, not investment advice. "
    "Coverage is often thinner outside US listings."
)
HOLDER_DISCLAIMER = (
    "Major holders and insider transactions are public regulatory disclosures. "
    "They describe reported ownership. They are not a buy or sell signal."
)
FIT_DISCLAIMER = (
    "This fit check compares the symbol with thresholds you set. "
    "It is not a FinSight recommendation and not a buy or sell signal."
)

REVENUE_NAMES = ["Total Revenue", "Operating Revenue", "Revenue", "TotalRevenue", "OperatingRevenue"]
GROSS_NAMES = ["Gross Profit", "GrossProfit"]
OPERATING_NAMES = ["Operating Income", "Operating Income Loss", "OperatingIncome", "EBIT"]
NET_NAMES = ["Net Income", "Net Income Common Stockholders", "NetIncome"]
EPS_NAMES = ["Diluted EPS", "Basic EPS", "DilutedEPS", "BasicEPS"]
EBITDA_NAMES = ["EBITDA", "Normalized EBITDA", "NormalizedEBITDA"]
ASSET_NAMES = ["Total Assets", "TotalAssets"]
EQUITY_NAMES = [
    "Stockholders Equity",
    "Common Stock Equity",
    "Total Equity Gross Minority Interest",
    "CommonStockEquity",
    "StockholdersEquity",
]
LIABILITY_NAMES = [
    "Total Liabilities Net Minority Interest",
    "Total Liabilities",
    "TotalLiabilitiesNetMinorityInterest",
]
SHORT_DEBT_NAMES = [
    "Current Debt",
    "Current Debt And Capital Lease Obligation",
    "Short Term Debt",
    "CurrentDebt",
]
LONG_DEBT_NAMES = [
    "Long Term Debt",
    "Long Term Debt And Capital Lease Obligation",
    "LongTermDebt",
]
TOTAL_DEBT_NAMES = ["Total Debt", "TotalDebt"]
SHARES_NAMES = ["Ordinary Shares Number", "Share Issued", "OrdinarySharesNumber", "ShareIssued"]
CASH_NAMES = ["Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments", "CashAndCashEquivalents"]
OCF_NAMES = ["Operating Cash Flow", "Cash Flow From Continuing Operating Activities", "OperatingCashFlow"]
FCF_NAMES = ["Free Cash Flow", "FreeCashFlow"]
CAPEX_NAMES = ["Capital Expenditure", "Capital Expenditures", "CapitalExpenditure"]

PERCENT_HOLDER_KEYS = {
    "insiderspercentheld": "Insiders",
    "%ofsharesheldbyallinsider": "Insiders",
    "%ofsharesheldbyallinsiders": "Insiders",
    "institutionspercentheld": "Institutions",
    "%ofsharesheldbyinstitutions": "Institutions",
    "institutionsfloatpercentheld": "Institutions (of float)",
    "%offloatheldbyinstitutions": "Institutions (of float)",
}
COUNT_HOLDER_KEYS = {
    "institutionscount": "Institution count",
    "numberofinstitutionsholdingshares": "Institution count",
}

FIT_CHECKS = (
    ("pbv_max", "PBV", "max", "pbv", "ratio"),
    ("der_max", "Debt / Equity", "max", "der", "ratio"),
    ("roe_min", "ROE", "min", "roe", "percent"),
    ("evebitda_max", "EV/EBITDA", "max", "ev_ebitda", "ratio"),
)


def is_equity_symbol(symbol: str) -> bool:
    s = (symbol or "").upper().strip()
    if not s or s.startswith("^"):
        return False
    if s.endswith("-USD") or "USDT" in s:
        return False
    if s.endswith("=X") or s.endswith("=F"):
        return False
    return True


def _empty_statement(symbol: str, statement: str, freq: str) -> dict:
    return {
        "symbol": symbol.upper(),
        "statement": statement,
        "freq": freq,
        "available": False,
        "periods": [],
        "rows": {},
    }


def _cell(df: pd.DataFrame, label, col) -> float | None:
    raw = df.loc[label, col]
    if isinstance(raw, pd.Series):
        raw = raw.dropna()
        raw = raw.iloc[0] if len(raw) else None
    return _safe_float(raw)


def _period_key(col) -> str:
    iso = _to_iso_date(col)
    if iso:
        return iso[:10]
    return str(col)[:10]


@ttl_cache(ttl_seconds=3600)
def get_financial_statement(symbol: str, statement: str, freq: str = "quarterly") -> dict:
    """
    One statement via the official yfinance freq/pretty arguments.

    freq="trailing" is valid for income_stmt and cashflow in yfinance 1.7.
    Balance sheet rejects it because a balance sheet is a point-in-time snapshot.
    Periods are oldest-first and capped at 8 so charts stay readable.
    """
    symbol = symbol.upper().strip()
    if statement not in STATEMENT_METHODS:
        raise ValueError(f"Unknown statement: {statement}")
    if freq not in FREQUENCIES:
        raise ValueError("freq must be yearly, quarterly, or trailing")
    if statement == "balance_sheet" and freq == "trailing":
        raise ValueError("freq='trailing' is not supported for balance_sheet")

    empty = _empty_statement(symbol, statement, freq)
    if not is_equity_symbol(symbol):
        return empty

    try:
        ticker = yf.Ticker(symbol)
        method = {
            "income_stmt": ticker.get_income_stmt,
            "balance_sheet": ticker.get_balance_sheet,
            "cashflow": ticker.get_cashflow,
        }[statement]
        try:
            df = method(freq=freq, pretty=True)
        except TypeError:
            df = method(freq=freq)
    except Exception:
        return empty

    if df is None or not isinstance(df, pd.DataFrame) or df.empty:
        return empty

    columns = list(reversed(list(df.columns)[:PERIOD_LIMIT]))
    periods = [_period_key(col) for col in columns]
    rows: dict[str, list[float | None]] = {}
    for label in df.index:
        name = str(label).strip()
        if not name or name.lower() == "nan":
            continue
        values = [_cell(df, label, col) for col in columns]
        if any(value is not None for value in values):
            rows[name] = values

    if not rows:
        return empty

    return {
        "symbol": symbol,
        "statement": statement,
        "freq": freq,
        "available": True,
        "periods": periods,
        "rows": rows,
    }


def _align(values: list[float | None] | None, n: int) -> list[float | None]:
    vals = list(values or [])[:n]
    if len(vals) < n:
        vals.extend([None] * (n - len(vals)))
    return vals


def _pick(statement: dict | None, names: list[str]) -> list[float | None]:
    periods = (statement or {}).get("periods") or []
    n = len(periods)
    rows = (statement or {}).get("rows") or {}
    lookup = {str(key).strip().lower(): value for key, value in rows.items()}
    fallback = None
    for name in names:
        hit = lookup.get(name.lower())
        if hit is None:
            continue
        aligned = _align(hit, n)
        if any(value is not None for value in aligned):
            return aligned
        if fallback is None:
            fallback = aligned
    return fallback if fallback is not None else [None] * n


def _as_map(statement: dict | None, names: list[str]) -> dict[str, float | None]:
    periods = (statement or {}).get("periods") or []
    values = _pick(statement, names)
    return {period: values[i] if i < len(values) else None for i, period in enumerate(periods)}


def _on_or_before(mapping: dict[str, float | None], period: str) -> float | None:
    if not mapping or not period:
        return None
    if mapping.get(period) is not None:
        return mapping[period]
    prior = [day for day, value in mapping.items() if day <= period and value is not None]
    if not prior:
        return None
    return mapping[max(prior)]


def _window_sum(values: list[float | None], index: int, freq: str) -> float | None:
    if freq != "quarterly":
        return values[index] if index < len(values) else None
    if index < 3:
        return None
    window = values[index - 3 : index + 1]
    if any(value is None for value in window):
        return None
    return float(sum(window))


def _ratio(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator


def _pct(numerator: float | None, denominator: float | None) -> float | None:
    value = _ratio(numerator, denominator)
    if value is None:
        return None
    return round(value * 100, 2)


def _r(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None
    return round(value, digits)


def _last_field(points: list[dict], key: str) -> float | None:
    for point in reversed(points):
        if point.get(key) is not None:
            return point[key]
    return None


def _info_pct(raw) -> float | None:
    num = _safe_float(raw)
    if num is None:
        return None
    return round(num * 100, 2)


def _price_series(symbol: str) -> list[tuple[str, float]]:
    try:
        df = get_history(symbol, period="10y", interval="1d")
    except Exception:
        return []
    if df is None or getattr(df, "empty", True) or "Close" not in getattr(df, "columns", []):
        return []
    date_col = "Date" if "Date" in df.columns else df.columns[0]
    points: list[tuple[str, float]] = []
    for _, row in df.iterrows():
        iso = _to_iso_date(row[date_col])
        close = _safe_float(row["Close"])
        if iso and close is not None:
            points.append((iso[:10], close))
    points.sort()
    return points


def _price_asof(prices: list[tuple[str, float]], day: str) -> float | None:
    if not prices or not day:
        return None
    lo, hi = 0, len(prices) - 1
    best = None
    while lo <= hi:
        mid = (lo + hi) // 2
        if prices[mid][0] <= day:
            best = prices[mid][1]
            lo = mid + 1
        else:
            hi = mid - 1
    return best


def _safe_info(symbol: str) -> dict:
    try:
        info = yf.Ticker(symbol).info or {}
        return info if isinstance(info, dict) else {}
    except Exception:
        return {}


def _dividend_history(symbol: str) -> tuple[list[dict], list[dict]]:
    try:
        series = yf.Ticker(symbol).dividends
    except Exception:
        return [], []
    if series is None or len(series) == 0:
        return [], []

    payments: list[dict] = []
    by_year: dict[str, float] = {}
    for idx, amount in series.items():
        num = _safe_float(amount)
        iso = _to_iso_date(idx)
        if num is None or not iso:
            continue
        day = iso[:10]
        payments.append({"date": day, "amount": num})
        year = day[:4]
        by_year[year] = by_year.get(year, 0.0) + num

    years = [{"date": year, "amount": round(by_year[year], 6)} for year in sorted(by_year)][-8:]
    return years, payments[-12:]


def _debt_amount(total: float | None, short: float | None, long: float | None) -> float | None:
    if total is not None:
        return total
    if short is None and long is None:
        return None
    return (short or 0.0) + (long or 0.0)


def _empty_ratios() -> dict:
    return {
        "per": None,
        "pbv": None,
        "ev_ebitda": None,
        "bvps": None,
        "roe": None,
        "roa": None,
        "der": None,
        "dtcr": None,
        "gross_margin": None,
        "operating_margin": None,
        "net_margin": None,
    }


def _empty_charts(symbol: str, freq: str, equity: bool) -> dict:
    return {
        "symbol": symbol,
        "freq": freq,
        "equity": equity,
        "available": False,
        "balance_freq": "quarterly" if freq == "trailing" else freq,
        "earnings": [],
        "margins": [],
        "balance": [],
        "cashflow": [],
        "valuation": [],
        "dividend_years": [],
        "dividend_payments": [],
        "ratios": _empty_ratios(),
        "notes": [],
        "disclaimer": DISCLAIMER,
    }


@ttl_cache(ttl_seconds=3600)
def get_fundamental_charts(symbol: str, freq: str = "quarterly") -> dict:
    """Chart-ready fundamental series for one equity symbol."""
    symbol = symbol.upper().strip()
    if freq not in FREQUENCIES:
        raise ValueError("freq must be yearly, quarterly, or trailing")
    if not is_equity_symbol(symbol):
        return _empty_charts(symbol, freq, equity=False)

    balance_freq = "quarterly" if freq == "trailing" else freq
    with ThreadPoolExecutor(max_workers=6) as pool:
        income_f = pool.submit(get_financial_statement, symbol, "income_stmt", freq)
        balance_f = pool.submit(get_financial_statement, symbol, "balance_sheet", balance_freq)
        cash_f = pool.submit(get_financial_statement, symbol, "cashflow", freq)
        price_f = pool.submit(_price_series, symbol)
        info_f = pool.submit(_safe_info, symbol)
        div_f = pool.submit(_dividend_history, symbol)
        income = income_f.result()
        balance = balance_f.result()
        cash = cash_f.result()
        prices = price_f.result()
        info = info_f.result()
        dividend_years, dividend_payments = div_f.result()

    income_periods = income.get("periods") or []
    revenue = _pick(income, REVENUE_NAMES)
    gross = _pick(income, GROSS_NAMES)
    operating = _pick(income, OPERATING_NAMES)
    net = _pick(income, NET_NAMES)
    eps = _pick(income, EPS_NAMES)
    ebitda = _pick(income, EBITDA_NAMES)

    step = 4 if freq == "quarterly" else 1 if freq == "yearly" else 0
    earnings = []
    margins = []
    for i, period in enumerate(income_periods):
        prior = net[i - step] if step and i >= step else None
        earnings.append(
            {
                "period": period,
                "revenue": revenue[i],
                "gross_profit": gross[i],
                "operating_income": operating[i],
                "net_income": net[i],
                "net_income_prior": prior,
                "eps": _r(eps[i], 4) if eps[i] is not None else None,
            }
        )
        margins.append(
            {
                "period": period,
                "gross_margin": _pct(gross[i], revenue[i]),
                "operating_margin": _pct(operating[i], revenue[i]),
                "net_margin": _pct(net[i], revenue[i]),
            }
        )

    balance_periods = balance.get("periods") or []
    assets = _pick(balance, ASSET_NAMES)
    equity_vals = _pick(balance, EQUITY_NAMES)
    short_vals = _pick(balance, SHORT_DEBT_NAMES)
    long_vals = _pick(balance, LONG_DEBT_NAMES)
    total_debt_vals = _pick(balance, TOTAL_DEBT_NAMES)
    liability_vals = _pick(balance, LIABILITY_NAMES)
    balance_points = []
    for i, period in enumerate(balance_periods):
        debt = _debt_amount(total_debt_vals[i], short_vals[i], long_vals[i])
        equity = equity_vals[i]
        der = None
        dtcr = None
        if debt is not None and equity is not None and equity > 0 and debt >= 0:
            der = _r(debt / equity, 4)
            denom = debt + equity
            dtcr = _r(debt / denom, 4) if denom else None
        balance_points.append(
            {
                "period": period,
                "total_assets": assets[i],
                "total_equity": equity,
                "total_liabilities": liability_vals[i],
                "short_debt": short_vals[i],
                "long_debt": long_vals[i],
                "total_debt": debt,
                "der": der,
                "dtcr": dtcr,
            }
        )

    cash_periods = cash.get("periods") or []
    ocf = _pick(cash, OCF_NAMES)
    fcf = _pick(cash, FCF_NAMES)
    capex = _pick(cash, CAPEX_NAMES)
    cash_points = [
        {
            "period": period,
            "operating_cash_flow": ocf[i],
            "free_cash_flow": fcf[i],
            "capex": capex[i],
        }
        for i, period in enumerate(cash_periods)
    ]

    equity_map = _as_map(balance, EQUITY_NAMES)
    asset_map = _as_map(balance, ASSET_NAMES)
    shares_map = _as_map(balance, SHARES_NAMES)
    cash_map = _as_map(balance, CASH_NAMES)
    debt_map: dict[str, float | None] = {}
    for i, period in enumerate(balance_periods):
        debt_map[period] = _debt_amount(total_debt_vals[i], short_vals[i], long_vals[i])

    valuation = []
    for i, period in enumerate(income_periods):
        px = _price_asof(prices, period)
        shares = _on_or_before(shares_map, period)
        eq = _on_or_before(equity_map, period)
        assets_now = _on_or_before(asset_map, period)
        debt = _on_or_before(debt_map, period)
        cash_now = _on_or_before(cash_map, period)
        eps_used = _window_sum(eps, i, freq)
        ebitda_used = _window_sum(ebitda, i, freq)
        ni_used = _window_sum(net, i, freq)
        bvps = _ratio(eq, shares) if eq is not None and eq > 0 and shares is not None and shares > 0 else None
        per = _ratio(px, eps_used) if eps_used is not None and eps_used > 0 else None
        pbv = _ratio(px, bvps) if bvps is not None and bvps > 0 else None
        ev_ebitda = None
        if (
            px is not None
            and shares is not None
            and shares > 0
            and ebitda_used is not None
            and ebitda_used > 0
        ):
            enterprise = px * shares + (debt or 0.0) - (cash_now or 0.0)
            ev_ebitda = enterprise / ebitda_used
        valuation.append(
            {
                "period": period,
                "per": _r(per, 2),
                "pbv": _r(pbv, 2),
                "ev_ebitda": _r(ev_ebitda, 2),
                "bvps": _r(bvps, 4),
                "roe": _pct(ni_used, eq) if eq is not None and eq > 0 else None,
                "roa": _pct(ni_used, assets_now) if assets_now is not None and assets_now > 0 else None,
            }
        )

    ratios = _empty_ratios()
    ratios.update(
        {
            "per": _last_field(valuation, "per") or _r(_safe_float(info.get("trailingPE")), 2),
            "pbv": _last_field(valuation, "pbv") or _r(_safe_float(info.get("priceToBook")), 2),
            "ev_ebitda": _last_field(valuation, "ev_ebitda") or _r(_safe_float(info.get("enterpriseToEbitda")), 2),
            "bvps": _last_field(valuation, "bvps") or _r(_safe_float(info.get("bookValue")), 4),
            "roe": _last_field(valuation, "roe") or _info_pct(info.get("returnOnEquity")),
            "roa": _last_field(valuation, "roa") or _info_pct(info.get("returnOnAssets")),
            "der": _last_field(balance_points, "der"),
            "dtcr": _last_field(balance_points, "dtcr"),
            "gross_margin": _last_field(margins, "gross_margin"),
            "operating_margin": _last_field(margins, "operating_margin"),
            "net_margin": _last_field(margins, "net_margin"),
        }
    )

    notes = []
    if freq == "quarterly":
        notes.append(
            "Quarterly valuation multiples use a trailing four-quarter sum of EPS and EBITDA, with share count and debt from that quarter."
        )
    if freq == "trailing":
        notes.append(
            "Trailing twelve months applies to the income statement and cash flow. Balance sheet figures stay on the latest quarterly snapshot."
        )

    populated = any(
        [
            earnings,
            balance_points,
            cash_points,
            dividend_years,
            any(value is not None for value in ratios.values()),
        ]
    )
    return {
        "symbol": symbol,
        "freq": freq,
        "equity": True,
        "available": populated,
        "balance_freq": balance_freq,
        "earnings": earnings,
        "margins": margins,
        "balance": balance_points,
        "cashflow": cash_points,
        "valuation": valuation,
        "dividend_years": dividend_years,
        "dividend_payments": dividend_payments,
        "ratios": ratios,
        "notes": notes,
        "disclaimer": DISCLAIMER,
    }


def _norm_key(label: str) -> str:
    return "".join(ch for ch in label.lower() if ch.isalnum() or ch == "%")


def _parse_holder_number(raw) -> tuple[float | None, bool]:
    if isinstance(raw, str) and "%" in raw:
        cleaned = raw.replace("%", "").replace(",", "").strip()
        return _safe_float(cleaned), True
    return _safe_float(raw), False


def _major_pairs(df: pd.DataFrame | None) -> list[tuple[str, object]]:
    if df is None or not isinstance(df, pd.DataFrame) or df.empty:
        return []
    pairs: list[tuple[str, object]] = []
    if not isinstance(df.index, pd.RangeIndex):
        for idx, row in df.iterrows():
            pairs.append((str(idx), row.iloc[0] if len(row) else None))
        return pairs
    for _, row in df.iterrows():
        if len(row) < 2:
            continue
        left, right = row.iloc[0], row.iloc[1]
        if isinstance(left, str):
            pairs.append((left, right))
        else:
            pairs.append((str(right), left))
    return pairs


def _major_holders(df: pd.DataFrame | None) -> tuple[list[dict], list[dict]]:
    breakdown: list[dict] = []
    percents: dict[str, float] = {}
    for label, raw in _major_pairs(df):
        key = _norm_key(label)
        number, already_percent = _parse_holder_number(raw)
        if number is None:
            continue
        if key in COUNT_HOLDER_KEYS:
            breakdown.append({"label": COUNT_HOLDER_KEYS[key], "percent": None, "count": number})
            continue
        if key not in PERCENT_HOLDER_KEYS:
            continue
        pretty = PERCENT_HOLDER_KEYS[key]
        percent = number if already_percent or abs(number) > 1.5 else number * 100
        percent = round(percent, 2)
        breakdown.append({"label": pretty, "percent": percent, "count": None})
        if pretty in {"Insiders", "Institutions"}:
            percents[pretty] = percent

    composition: list[dict] = []
    insider = percents.get("Insiders")
    institutions = percents.get("Institutions")
    if insider is not None:
        composition.append({"label": "Insiders", "percent": insider, "count": None})
    if institutions is not None:
        composition.append({"label": "Institutions", "percent": institutions, "count": None})
    if insider is not None and institutions is not None:
        public = round(max(0.0, 100.0 - insider - institutions), 2)
        composition.append({"label": "Public", "percent": public, "count": None})
    return breakdown, composition


def _col(data: dict, *names):
    lookup = {str(key).lower(): key for key in data}
    for name in names:
        key = lookup.get(name.lower())
        if key is not None:
            return data[key]
    return None


def _text(value) -> str | None:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except TypeError:
        pass
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "nat"}:
        return None
    return text


def _scaled_percent(raw) -> float | None:
    number, already = _parse_holder_number(raw)
    if number is None:
        return None
    if not already and abs(number) <= 5:
        number *= 100
    return round(number, 4)


def _institutional_rows(df: pd.DataFrame | None) -> list[dict]:
    if df is None or not isinstance(df, pd.DataFrame) or df.empty:
        return []
    rows = []
    for _, row in df.head(10).iterrows():
        data = {str(col): row[col] for col in df.columns}
        reported = _to_iso_date(_col(data, "Date Reported", "Date"))
        name = _text(_col(data, "Holder", "Holder Name")) or "Unknown holder"
        rows.append(
            {
                "name": name,
                "shares": _safe_float(_col(data, "Shares", "Shares Held")),
                "percent": _scaled_percent(_col(data, "pctHeld", "% Out", "Percent")),
                "value": _safe_float(_col(data, "Value")),
                "reported": reported[:10] if reported else None,
                "percent_change": _scaled_percent(_col(data, "pctChange", "% Change")),
            }
        )
    rows.sort(key=lambda item: item["percent"] or 0, reverse=True)
    return rows


def _insider_rows(df: pd.DataFrame | None) -> list[dict]:
    if df is None or not isinstance(df, pd.DataFrame) or df.empty:
        return []
    rows = []
    for _, row in df.head(10).iterrows():
        data = {str(col): row[col] for col in df.columns}
        filed = _to_iso_date(_col(data, "Start Date", "Date", "Transaction Date"))
        transaction = _text(_col(data, "Transaction")) or _text(_col(data, "Text"))
        rows.append(
            {
                "insider": _text(_col(data, "Insider", "Insider Name")),
                "position": _text(_col(data, "Position")),
                "transaction": transaction,
                "shares": _safe_float(_col(data, "Shares")),
                "value": _safe_float(_col(data, "Value")),
                "date": filed[:10] if filed else None,
            }
        )
    return rows


@ttl_cache(ttl_seconds=3600)
def get_shareholder_analysis(symbol: str) -> dict:
    """Major holders, top institutions, and recent insider filings."""
    symbol = symbol.upper().strip()
    base = {
        "symbol": symbol,
        "equity": is_equity_symbol(symbol),
        "available": False,
        "major_holders": [],
        "composition": [],
        "institutional_holders": [],
        "insider_transactions": [],
        "disclaimer": HOLDER_DISCLAIMER,
    }
    if not base["equity"]:
        return base

    ticker = yf.Ticker(symbol)
    try:
        major_df = ticker.get_major_holders()
    except Exception:
        major_df = None
    try:
        inst_df = ticker.institutional_holders
    except Exception:
        inst_df = None
    try:
        insider_df = ticker.insider_transactions
    except Exception:
        insider_df = None

    major, composition = _major_holders(major_df)
    institutional = _institutional_rows(inst_df)
    insider = _insider_rows(insider_df)
    base.update(
        {
            "major_holders": major,
            "composition": composition,
            "institutional_holders": institutional,
            "insider_transactions": insider,
            "available": bool(major or institutional or insider),
        }
    )
    return base


def _normalize_criteria(criteria: dict | None) -> tuple:
    source = criteria or {}
    pairs = []
    for key, _label, _kind, _ratio, _unit in FIT_CHECKS:
        raw = source.get(key)
        if raw is None or raw == "":
            pairs.append((key, None))
            continue
        try:
            pairs.append((key, float(raw)))
        except (TypeError, ValueError):
            pairs.append((key, None))
    return tuple(pairs)


@ttl_cache(ttl_seconds=3600)
def _check_fundamental_criteria(symbol: str, normalized: tuple) -> dict:
    criteria = dict(normalized)
    charts = get_fundamental_charts(symbol, "yearly")
    ratios = charts.get("ratios") or _empty_ratios()
    results = []
    for key, label, kind, ratio_key, unit in FIT_CHECKS:
        threshold = criteria.get(key)
        if threshold is None:
            continue
        actual = ratios.get(ratio_key)
        if actual is None:
            passed = None
        elif kind == "max":
            passed = actual <= threshold
        else:
            passed = actual >= threshold
        results.append(
            {
                "key": key,
                "label": label,
                "actual": actual,
                "threshold": threshold,
                "comparator": "<=" if kind == "max" else ">=",
                "unit": unit,
                "passed": passed,
            }
        )
    checked = [item for item in results if item["passed"] is not None]
    return {
        "symbol": charts["symbol"],
        "equity": charts["equity"],
        "available": bool(checked),
        "passed_count": sum(1 for item in checked if item["passed"]),
        "checked_count": len(checked),
        "results": results,
        "disclaimer": FIT_DISCLAIMER,
    }


def check_fundamental_criteria(symbol: str, criteria: dict | None = None) -> dict:
    """
    Compare one symbol with the caller's value-screen limits.

    Defaults match the documented screen: PBV < 1, DER < 1, ROE > 10, EV/EBITDA < 10.
    A missing limit is skipped. Annual figures are the comparison basis.
    """
    if criteria is None:
        criteria = {"pbv_max": 1, "der_max": 1, "roe_min": 10, "evebitda_max": 10}
    return _check_fundamental_criteria(symbol.upper().strip(), _normalize_criteria(criteria))
