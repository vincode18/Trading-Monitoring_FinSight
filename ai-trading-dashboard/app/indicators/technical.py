"""
Indikator teknikal dasar, dihitung manual dengan pandas (tanpa TA-Lib
supaya instalasi tetap ringan/portable). Semua fungsi menerima dan
mengembalikan pandas Series/DataFrame agar mudah dipakai di Plotly.

Catatan kepatuhan: skor analisis / label (Strong Buy, dll.) adalah ringkasan
teknikal otomatis — BUKAN saran atau rekomendasi finansial.
"""
from __future__ import annotations

import math

import pandas as pd


def moving_average(close: pd.Series, window: int) -> pd.Series:
    """Simple Moving Average (SMA)."""
    return close.rolling(window=window, min_periods=window).mean()


def ema(close: pd.Series, window: int) -> pd.Series:
    """Exponential Moving Average (EMA)."""
    return close.ewm(span=window, adjust=False).mean()


def rsi(close: pd.Series, window: int = 14) -> pd.Series:
    """Relative Strength Index (RSI), skala 0-100."""
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / window, min_periods=window, adjust=False).mean()

    rs = avg_gain / avg_loss.replace(0, pd.NA)
    rsi_value = 100 - (100 / (1 + rs))
    return rsi_value.fillna(50)  # netral saat belum cukup data


def macd(close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
    """
    MACD (Moving Average Convergence Divergence).
    Mengembalikan DataFrame dengan kolom: macd, signal, histogram.
    """
    ema_fast = ema(close, fast)
    ema_slow = ema(close, slow)
    macd_line = ema_fast - ema_slow
    signal_line = ema(macd_line, signal)
    histogram = macd_line - signal_line
    return pd.DataFrame({"macd": macd_line, "signal": signal_line, "histogram": histogram})


def bollinger_bands(close: pd.Series, window: int = 20, num_std: float = 2.0) -> pd.DataFrame:
    """Bollinger Bands: upper, middle (SMA), lower."""
    middle = moving_average(close, window)
    std = close.rolling(window=window, min_periods=window).std()
    upper = middle + num_std * std
    lower = middle - num_std * std
    return pd.DataFrame({"upper": upper, "middle": middle, "lower": lower})


def add_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Tambahkan semua indikator standar ke DataFrame OHLCV.
    Mengharapkan kolom 'Close' sudah ada.
    """
    out = df.copy()
    out["MA20"] = moving_average(out["Close"], 20)
    out["MA50"] = moving_average(out["Close"], 50)
    out["MA100"] = moving_average(out["Close"], 100)
    out["MA200"] = moving_average(out["Close"], 200)
    out["EMA12"] = ema(out["Close"], 12)
    out["EMA26"] = ema(out["Close"], 26)
    out["RSI14"] = rsi(out["Close"], 14)

    macd_df = macd(out["Close"])
    out["MACD"] = macd_df["macd"]
    out["MACD_Signal"] = macd_df["signal"]
    out["MACD_Hist"] = macd_df["histogram"]

    bb_df = bollinger_bands(out["Close"])
    out["BB_Upper"] = bb_df["upper"]
    out["BB_Middle"] = bb_df["middle"]
    out["BB_Lower"] = bb_df["lower"]

    return out


def simple_signal(df_with_indicators: pd.DataFrame) -> str:
    """
    Sinyal sederhana berbasis aturan (BUKAN rekomendasi finansial,
    hanya ringkasan kondisi teknikal untuk membantu keputusan pengguna sendiri).
    """
    if df_with_indicators.empty or len(df_with_indicators) < 2:
        return "Data tidak cukup"

    last = df_with_indicators.iloc[-1]
    signals = []

    if pd.notna(last.get("RSI14")):
        if last["RSI14"] > 70:
            signals.append("RSI menunjukkan overbought")
        elif last["RSI14"] < 30:
            signals.append("RSI menunjukkan oversold")

    if pd.notna(last.get("MACD")) and pd.notna(last.get("MACD_Signal")):
        if last["MACD"] > last["MACD_Signal"]:
            signals.append("MACD di atas signal line (momentum positif)")
        else:
            signals.append("MACD di bawah signal line (momentum negatif)")

    if pd.notna(last.get("MA20")) and pd.notna(last.get("MA50")):
        if last["MA20"] > last["MA50"]:
            signals.append("MA20 di atas MA50 (tren jangka pendek naik)")
        else:
            signals.append("MA20 di bawah MA50 (tren jangka pendek turun)")

    return " | ".join(signals) if signals else "Netral / data indikator belum lengkap"


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _safe_float(value) -> float | None:
    try:
        if value is None or (isinstance(value, float) and math.isnan(value)):
            return None
        if pd.isna(value):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _score_to_label(score: float) -> str:
    if score >= 80:
        return "Strong Buy"
    if score >= 60:
        return "Buy"
    if score >= 40:
        return "Neutral"
    if score >= 20:
        return "Sell"
    return "Strong Sell"


def compute_analysis_score(df: pd.DataFrame) -> dict:
    """
    Skor teknikal 0–100 dari RSI, MACD vs signal, dan MA20 vs MA50 (bobot setara).

    BUKAN saran finansial — hanya ringkasan kondisi indikator untuk edukasi/UI.
    """
    empty = {
        "score": 50.0,
        "label": "Neutral",
        "indicators": [],
        "disclaimer": "Not financial advice. Technical summary only.",
    }
    if df is None or df.empty:
        return empty

    last = df.iloc[-1]
    component_scores: list[float] = []
    indicators: list[dict] = []

    # RSI14: rendah = lebih bullish (oversold), tinggi = lebih bearish
    rsi_val = _safe_float(last.get("RSI14"))
    if rsi_val is not None:
        rsi_score = _clamp(100.0 - rsi_val)
        component_scores.append(rsi_score)
        if rsi_val < 30:
            rsi_signal = "Buy"
        elif rsi_val > 70:
            rsi_signal = "Sell"
        else:
            rsi_signal = "Neutral"
        indicators.append({"name": "RSI14", "value": round(rsi_val, 4), "signal": rsi_signal})

    # MACD vs signal line
    macd_val = _safe_float(last.get("MACD"))
    macd_sig = _safe_float(last.get("MACD_Signal"))
    if macd_val is not None and macd_sig is not None:
        hist = macd_val - macd_sig
        # Skala kasar: hist relatif terhadap |MACD| + epsilon
        scale = abs(macd_val) + abs(macd_sig) + 1e-9
        macd_score = _clamp(50.0 + (hist / scale) * 50.0)
        component_scores.append(macd_score)
        macd_signal = "Buy" if macd_val > macd_sig else ("Sell" if macd_val < macd_sig else "Neutral")
        indicators.append({"name": "MACD", "value": round(macd_val, 6), "signal": macd_signal})

    # MA20 vs MA50
    ma20 = _safe_float(last.get("MA20"))
    ma50 = _safe_float(last.get("MA50"))
    if ma20 is not None and ma50 is not None:
        diff_pct = ((ma20 - ma50) / abs(ma50)) * 100 if ma50 else 0.0
        ma_score = _clamp(50.0 + diff_pct * 10.0)
        component_scores.append(ma_score)
        if ma20 > ma50:
            ma_signal = "Buy"
        elif ma20 < ma50:
            ma_signal = "Sell"
        else:
            ma_signal = "Neutral"
        indicators.append({"name": "MA20", "value": round(ma20, 4), "signal": ma_signal})
        indicators.append({"name": "MA50", "value": round(ma50, 4), "signal": ma_signal})

    if not component_scores:
        return empty

    score = round(sum(component_scores) / len(component_scores), 2)
    return {
        "score": score,
        "label": _score_to_label(score),
        "indicators": indicators,
        "disclaimer": "Not financial advice. Technical summary only.",
    }


def compute_radar_scores(df: pd.DataFrame) -> dict:
    """
    Lima skor 0–100 untuk radar chart: price_action, volume, momentum, trend, volatility.
    Menggunakan OHLCV + indikator yang sudah dihitung (MA, RSI).
    """
    defaults = {
        "price_action": 50.0,
        "volume": 50.0,
        "momentum": 50.0,
        "trend": 50.0,
        "volatility": 50.0,
    }
    if df is None or df.empty or len(df) < 5:
        return defaults

    close = df["Close"].astype(float)
    last_close = float(close.iloc[-1])

    # Price action: posisi close vs MA20 (atau MA50 fallback)
    ma_ref = None
    if "MA20" in df.columns and pd.notna(df["MA20"].iloc[-1]):
        ma_ref = float(df["MA20"].iloc[-1])
    elif "MA50" in df.columns and pd.notna(df["MA50"].iloc[-1]):
        ma_ref = float(df["MA50"].iloc[-1])
    if ma_ref and ma_ref != 0:
        pct = ((last_close - ma_ref) / abs(ma_ref)) * 100
        price_action = _clamp(50.0 + pct * 5.0)
    else:
        price_action = 50.0

    # Volume: volume terbaru vs rata-rata 20 hari
    if "Volume" in df.columns:
        vol = df["Volume"].astype(float)
        recent_vol = float(vol.iloc[-1])
        avg_vol = float(vol.tail(20).mean()) if len(vol) >= 2 else recent_vol
        if avg_vol > 0:
            volume = _clamp((recent_vol / avg_vol) * 50.0)
        else:
            volume = 50.0
    else:
        volume = 50.0

    # Momentum: dari RSI (50 netral → skala 0–100 langsung)
    if "RSI14" in df.columns and pd.notna(df["RSI14"].iloc[-1]):
        momentum = _clamp(float(df["RSI14"].iloc[-1]))
    else:
        # fallback: return 10 hari
        ret = close.pct_change().tail(10).mean()
        momentum = _clamp(50.0 + float(ret or 0) * 1000)

    # Trend: kemiringan MA20 (atau close) 10 bar terakhir
    if "MA20" in df.columns and df["MA20"].notna().sum() >= 10:
        ma_series = df["MA20"].dropna()
        slope = (float(ma_series.iloc[-1]) - float(ma_series.iloc[-10])) / abs(float(ma_series.iloc[-10]) or 1e-9)
        trend = _clamp(50.0 + slope * 500)
    else:
        slope = (last_close - float(close.iloc[-10])) / abs(float(close.iloc[-10]) or 1e-9) if len(close) >= 10 else 0.0
        trend = _clamp(50.0 + slope * 500)

    # Volatility: stdev return 20 hari, dinormalisasi (tinggi = skor tinggi)
    returns = close.pct_change().dropna().tail(20)
    if len(returns) >= 5:
        vol_stdev = float(returns.std())
        # ~2% harian stdev ≈ skor tinggi; skala kasar
        volatility = _clamp(vol_stdev * 2500)
    else:
        volatility = 50.0

    return {
        "price_action": round(price_action, 2),
        "volume": round(volume, 2),
        "momentum": round(momentum, 2),
        "trend": round(trend, 2),
        "volatility": round(volatility, 2),
    }


def compute_support_resistance(df: pd.DataFrame, lookback: int = 60) -> dict:
    """
    Estimasi 2 level support & 2 resistance dari local min/max Low/High
    pada jendela `lookback` bar terakhir.
    """
    empty = {"support": [None, None], "resistance": [None, None]}
    if df is None or df.empty or "Low" not in df.columns or "High" not in df.columns:
        return empty

    recent = df.tail(lookback).copy()
    if len(recent) < 3:
        return empty

    lows = recent["Low"].astype(float).tolist()
    highs = recent["High"].astype(float).tolist()
    close = float(recent["Close"].astype(float).iloc[-1])

    local_mins: list[float] = []
    local_maxs: list[float] = []
    for i in range(1, len(lows) - 1):
        if lows[i] <= lows[i - 1] and lows[i] <= lows[i + 1]:
            local_mins.append(lows[i])
        if highs[i] >= highs[i - 1] and highs[i] >= highs[i + 1]:
            local_maxs.append(highs[i])

    supports_below = sorted({s for s in local_mins if s < close}, reverse=True)
    resistances_above = sorted({r for r in local_maxs if r > close})

    # Fallback: pakai ekstrem absolut di jendela jika local extrema kurang
    if len(supports_below) < 2:
        sorted_lows = sorted(set(lows))
        for lv in sorted_lows:
            if lv < close and lv not in supports_below:
                supports_below.append(lv)
        supports_below = sorted(supports_below, reverse=True)

    if len(resistances_above) < 2:
        sorted_highs = sorted(set(highs), reverse=True)
        for hv in sorted_highs:
            if hv > close and hv not in resistances_above:
                resistances_above.append(hv)
        resistances_above = sorted(resistances_above)

    s1 = round(supports_below[0], 6) if len(supports_below) > 0 else None
    s2 = round(supports_below[1], 6) if len(supports_below) > 1 else None
    r1 = round(resistances_above[0], 6) if len(resistances_above) > 0 else None
    r2 = round(resistances_above[1], 6) if len(resistances_above) > 1 else None

    return {"support": [s1, s2], "resistance": [r1, r2]}
