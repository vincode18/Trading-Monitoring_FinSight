"""Market screen for the technical strategies that reduce to a bullish pass/fail."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed

from app.indicators.strategies import evaluate_strategy
from app.indicators.strategies.catalog import NAMES
from app.services.market_data import get_history

SCREEN_DISCLAIMER = (
    "A match means the strategy's own bullish rule is true on the latest bar. "
    "It restates that rule. It is not a recommendation to buy or sell."
)
MAX_SYMBOLS = 40
ALL_MARKETS_SYMBOLS = 500
PAGE_SIZE = 10

# primary: codes that must be true to appear in the result list
# bullish: codes that make up the match-strength score
# approaching: codes that mean "close" when the primary is false
TECHNICAL_SCREENS: dict[str, dict] = {
    "profitunity": {
        "name": "Alligator / Profitunity",
        "primary": ["PTS1"],
        "bullish": ["PTS1", "BUAYA1", "BUAYA2", "BUAYA3", "PTS2", "PTS3", "FR1"],
        "approaching": ["BUAYA1", "BUAYA2", "BUAYA3", "PTS2"],
        "explanation": (
            "Bill Williams Alligator: Lips (5), Teeth (8), and Jaw (13) smoothed medians, shifted forward. "
            "The bullish state used by this screen is the green zone — close above Lips, Lips above Teeth, Teeth above Jaw."
        ),
        "entry": "Above the Lips line (current: {Lips})",
        "stop": "Below the Jaw line (current: {Jaw})",
    },
    "ichimoku": {
        "name": "Ichimoku",
        "primary": ["ICHI7"],
        "bullish": ["ICHI7", "ICHI16", "ICHI1", "ICHI42"],
        "approaching": ["ICHI9", "ICHI16"],
        "explanation": (
            "Ichimoku cloud: Tenkan (9), Kijun (26), and Senkou spans. "
            "This screen keeps symbols whose latest close is above the cloud."
        ),
        "entry": "Above the cloud (Senkou A {Senkou A}, Senkou B {Senkou B})",
        "stop": "Back through the cloud base (the lower of Senkou A and Senkou B)",
    },
    "minervini": {
        "name": "Minervini Trend Template",
        "primary": ["MV1"],
        "bullish": ["MV1"],
        "approaching": [],
        "explanation": (
            "Mark Minervini's trend template: price above the 150- and 200-day averages, "
            "the 150-day above the 200-day, the 200-day rising, price above a rising 50-day, "
            "and price at least 30% above the 52-week low and within 25% of the 52-week high. "
            "This screen keeps symbols where that template is met and the latest close is up."
        ),
        "entry": "Above the 50-day average (current: {MA50})",
        "stop": "Below the 50-day average (current: {MA50})",
    },
    "guppy": {
        "name": "Guppy MMA",
        "primary": ["G1"],
        "bullish": ["G1", "GOBULL", "GOGC"],
        "approaching": ["GOBULL"],
        "explanation": (
            "Daryl Guppy's multiple moving averages: a short group (3–15) and a long group (30–60). "
            "This screen keeps symbols where close is above the short-group mean and that mean is above the long-group mean."
        ),
        "entry": "Above the short-term EMA group (current mean: {Mean short EMA})",
        "stop": "Below the long-term EMA group (current mean: {Mean long EMA})",
    },
    "turtle": {
        "name": "Turtle System",
        "primary": ["TS1"],
        "bullish": ["TS1", "TS2"],
        "approaching": ["TS3", "TS4"],
        "explanation": (
            "Turtle breakout: a long entry is a close above the prior 20-bar high. "
            "The 55-bar high is the slower breakout. A close within 2.75% under the 20-bar high is approaching, not a match."
        ),
        "entry": "Above the prior 20-day high (current: {Upper 20})",
        "stop": "Below the prior 10-day low (current: {Lower 10})",
    },
    "supertrend": {
        "name": "SuperTrend",
        "primary": ["ST1", "ST2"],
        "bullish": ["ST1", "ST2"],
        "approaching": [],
        "explanation": (
            "SuperTrend (ATR 10, multiplier 3). "
            "This screen keeps symbols whose latest bar is on the upward side of the SuperTrend line."
        ),
        "entry": "On the upward side of the SuperTrend line (current: {SuperTrend})",
        "stop": "A close on the other side of the SuperTrend line (current: {SuperTrend})",
    },
    "heiken-ashi": {
        "name": "Heikin Ashi Trend",
        "primary": ["H2"],
        "bullish": ["H1", "H2"],
        "approaching": ["H1"],
        "explanation": (
            "Heikin Ashi candles smooth the trend. "
            "This screen keeps symbols whose latest Heikin Ashi candle is up and whose close is above the 20-day EMA."
        ),
        "entry": "Heikin Ashi up-close with price above the 20-day EMA (current: {EMA20})",
        "stop": "Below the 20-day EMA (current: {EMA20})",
    },
}


def list_technical_screens() -> list[dict]:
    return [{"slug": slug, "name": rule["name"]} for slug, rule in TECHNICAL_SCREENS.items()]


def _states(result: dict) -> dict[str, bool]:
    return {row["code"]: bool(row["active"]) for row in result.get("states") or []}


def _status(active: dict[str, bool], rule: dict) -> str:
    if any(active.get(code) for code in rule["primary"]):
        return "Condition met"
    if any(active.get(code) for code in rule["approaching"]):
        return "Approaching"
    return "Condition not met"


def _fill(template: str, readings: dict[str, str | None]) -> str:
    out = template
    for label, value in readings.items():
        out = out.replace("{" + label + "}", value if value else "—")
    return out


def _turtle_lower10(df) -> str | None:
    if df is None or len(df) < 11 or "Low" not in df.columns:
        return None
    low = df["Low"].astype(float).rolling(10).min().shift(1)
    value = low.iloc[-1]
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number:
        return None
    return f"{number:.4g}"


def annotate_strategy(slug: str, result: dict, df=None) -> dict:
    """Explanation, fulfillment subset, and a descriptive trade-plan for one evaluation."""
    rule = TECHNICAL_SCREENS.get(slug)
    if rule is None:
        return {
            "explanation": "",
            "trade_plan": None,
            "match_score": None,
        }
    active = _states(result)
    readings = {row["label"]: row["value"] for row in result.get("readings") or []}
    if slug == "turtle":
        readings["Lower 10"] = _turtle_lower10(df)
    bullish = rule["bullish"]
    met = sum(1 for code in bullish if active.get(code))
    score = round(met / len(bullish), 4) if bullish else 0.0
    shown = []
    for row in result.get("states") or []:
        if row["code"] in bullish or row["code"] in rule["approaching"]:
            shown.append({"code": row["code"], "label": row["label"], "met": bool(row["active"])})
    return {
        "explanation": rule["explanation"],
        "match_score": score,
        "trade_plan": {
            "entry_reference": _fill(rule["entry"], readings),
            "stop_reference": _fill(rule["stop"], readings),
            "target_reference": None,
            "status": _status(active, rule),
            "disclaimer": SCREEN_DISCLAIMER,
        },
        "conditions": shown,
    }


def _screen_one(slug: str, symbol: str) -> dict | None:
    df = get_history(symbol, period="2y", interval="1d")
    if df is None or getattr(df, "empty", True):
        return None
    try:
        result = evaluate_strategy(df, slug)
    except (ValueError, KeyError):
        return None
    extra = annotate_strategy(slug, result, df)
    if extra["trade_plan"]["status"] != "Condition met":
        return None
    return {
        "symbol": symbol.upper(),
        "match_score": extra["match_score"],
        "status": extra["trade_plan"]["status"],
        "conditions": extra["conditions"],
    }


def _paginate(matches: list[dict], page: int | None, page_size: int) -> tuple[list[dict], int, int]:
    if page is None:
        return matches, 1, len(matches) or page_size
    size = max(1, min(page_size, 50))
    current = max(1, page)
    start = (current - 1) * size
    return matches[start : start + size], current, size


def screen_technical(
    slug: str,
    symbols: list[str],
    page: int | None = None,
    page_size: int = PAGE_SIZE,
    symbol_limit: int = MAX_SYMBOLS,
) -> dict:
    if slug not in TECHNICAL_SCREENS:
        raise ValueError("This strategy is not in the market screener")
    cleaned = []
    seen = set()
    for raw in symbols:
        symbol = str(raw).upper().strip()
        if symbol and symbol not in seen:
            seen.add(symbol)
            cleaned.append(symbol)
        if len(cleaned) >= symbol_limit:
            break
    matches: list[dict] = []
    if cleaned:
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(_screen_one, slug, symbol) for symbol in cleaned]
            for future in as_completed(futures):
                row = future.result()
                if row:
                    matches.append(row)
    matches.sort(key=lambda row: row["match_score"], reverse=True)
    page_rows, current, size = _paginate(matches, page, page_size)
    return {
        "strategy": slug,
        "name": TECHNICAL_SCREENS[slug]["name"],
        "scanned": len(cleaned),
        "matched": len(matches),
        "page": current,
        "page_size": size,
        "results": page_rows,
        "disclaimer": SCREEN_DISCLAIMER,
    }


def strategy_display_name(slug: str) -> str:
    if slug in TECHNICAL_SCREENS:
        return TECHNICAL_SCREENS[slug]["name"]
    return NAMES.get(slug, slug)
