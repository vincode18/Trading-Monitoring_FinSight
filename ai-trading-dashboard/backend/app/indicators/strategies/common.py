"""Helper bersama untuk evaluasi strategi OHLC."""
from __future__ import annotations

import math

import pandas as pd

from app.indicators.strategies.catalog import DISCLAIMER, NAMES

REQUIRED_COLS = ("Open", "High", "Low", "Close", "Volume")


def as_float(value) -> float | None:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(v) or math.isinf(v):
        return None
    return v


def reading(label: str, value) -> dict:
    n = as_float(value)
    return {"label": label, "value": None if n is None else f"{n:.4g}"}


def state(code: str, label: str, active: bool) -> dict:
    return {"code": code, "label": label, "active": bool(active)}


def pack(slug: str, readings: list, states: list) -> dict:
    return {
        "slug": slug,
        "name": NAMES[slug],
        "readings": readings,
        "states": states,
        "disclaimer": DISCLAIMER,
    }


def cross_up(a: pd.Series, b: pd.Series) -> bool:
    if len(a) < 2 or len(b) < 2:
        return False
    p, c = as_float(a.iloc[-2]), as_float(a.iloc[-1])
    pb, cb = as_float(b.iloc[-2]), as_float(b.iloc[-1])
    if None in (p, c, pb, cb):
        return False
    return p <= pb and c > cb


def cross_down(a: pd.Series, b: pd.Series) -> bool:
    if len(a) < 2 or len(b) < 2:
        return False
    p, c = as_float(a.iloc[-2]), as_float(a.iloc[-1])
    pb, cb = as_float(b.iloc[-2]), as_float(b.iloc[-1])
    if None in (p, c, pb, cb):
        return False
    return p >= pb and c < cb


def zero_line(index) -> pd.Series:
    return pd.Series(0.0, index=index)


def smma(series: pd.Series, period: int) -> pd.Series:
    from app.indicators.technical import smma as _smma

    return _smma(series, period)


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    from app.indicators.technical import atr as _atr

    return _atr(df, period)

def ohlc(df: pd.DataFrame):
    return (
        df["Open"].astype(float),
        df["High"].astype(float),
        df["Low"].astype(float),
        df["Close"].astype(float),
    )


def normalize_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    """Pastikan kolom OHLCV float siap dipakai evaluator."""
    if df is None or df.empty:
        raise ValueError("Data OHLC kosong")
    out = df.copy()
    missing = [c for c in REQUIRED_COLS if c not in out.columns]
    if missing:
        raise ValueError(f"Kolom hilang: {', '.join(missing)}")
    for col in REQUIRED_COLS:
        out[col] = pd.to_numeric(out[col], errors="coerce")
    out = out.dropna(subset=["Open", "High", "Low", "Close"])
    if out.empty:
        raise ValueError("Tidak ada bar OHLC valid")
    return out.reset_index(drop=True)
