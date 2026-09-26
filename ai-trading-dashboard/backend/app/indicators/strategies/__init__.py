"""Public API strategi trading — katalog + evaluasi keadaan indikator."""
from __future__ import annotations

from collections.abc import Callable

import pandas as pd

from app.indicators.strategies import systems
from app.indicators.strategies.catalog import CATALOG, SLUGS
from app.indicators.strategies.common import normalize_ohlcv

_EVALUATORS: dict[str, Callable[[pd.DataFrame], dict]] = {
    "profitunity": systems.profitunity,
    "bollinger": systems.bollinger,
    "ichimoku": systems.ichimoku,
    "guppy": systems.guppy,
    "minervini": systems.minervini,
    "turtle": systems.turtle,
    "donchian": systems.donchian,
    "supertrend": systems.supertrend,
    "pixel": systems.pixel,
    "elder-impulse": systems.elder_impulse,
    "ttm": systems.ttm,
    "heiken-ashi": systems.heiken_ashi,
    "fibonacci": systems.fibonacci,
    "candlestick": systems.candlestick,
    "moving-average": systems.ma_system,
    "adx": systems.adx,
    "macd": systems.macd_system,
    "rsi": systems.rsi_system,
    "stochastic": systems.stochastic,
    "cci": systems.cci,
    "mfi": systems.mfi,
    "cmf": systems.cmf,
    "trix": systems.trix,
    "vortex": systems.vortex,
    "smi": systems.smi,
    "parabolic-sar": systems.parabolic_sar,
    "trend": systems.trend,
    "support-resistance": systems.support_resistance,
    "volume-pressure": systems.volume_pressure,
    "gap": systems.gap,
}


def list_strategies() -> list[dict]:
    return [{"slug": slug, "name": name} for slug, name in CATALOG]


def known_slug(slug: str) -> bool:
    return slug in SLUGS


def evaluate_strategy(df: pd.DataFrame, slug: str) -> dict:
    """Hitung readings + states untuk satu sistem. Naikkan KeyError bila slug asing."""
    fn = _EVALUATORS.get(slug)
    if fn is None:
        raise KeyError(slug)
    clean = normalize_ohlcv(df)
    return fn(clean)
