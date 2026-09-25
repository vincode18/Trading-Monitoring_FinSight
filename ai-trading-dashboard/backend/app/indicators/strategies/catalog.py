"""Katalog slug strategi — selaras PRD 2026-09-21_AllTradingStrategy_v1."""
from __future__ import annotations

DISCLAIMER = "Indicator conditions for research. Not an invitation to buy or sell."

CATALOG: list[tuple[str, str]] = [
    ("profitunity", "Profitunity / Bill Williams"),
    ("bollinger", "Bollinger"),
    ("ichimoku", "Ichimoku"),
    ("guppy", "Guppy MMA"),
    ("minervini", "Minervini Trend Template"),
    ("turtle", "Turtle"),
    ("donchian", "Donchian"),
    ("supertrend", "SuperTrend"),
    ("pixel", "Trading With Pixel"),
    ("elder-impulse", "Elder Impulse"),
    ("ttm", "TTM"),
    ("heiken-ashi", "Heiken Ashi"),
    ("fibonacci", "Fibonacci"),
    ("candlestick", "Candlestick"),
    ("moving-average", "Moving Average"),
    ("adx", "ADX"),
    ("macd", "MACD"),
    ("rsi", "RSI"),
    ("stochastic", "Stochastic"),
    ("cci", "CCI"),
    ("mfi", "MFI"),
    ("cmf", "CMF"),
    ("trix", "TRIX"),
    ("vortex", "Vortex"),
    ("smi", "SMI Ergodic"),
    ("parabolic-sar", "Parabolic SAR"),
    ("trend", "Trend"),
    ("support-resistance", "Support & Resistance"),
    ("volume-pressure", "Volume & Pressure"),
    ("gap", "Gap"),
]

SLUGS = {slug for slug, _ in CATALOG}
NAMES = dict(CATALOG)
