"""
Indikator teknikal dasar, dihitung manual dengan pandas (tanpa TA-Lib
supaya instalasi tetap ringan/portable). Semua fungsi menerima dan
mengembalikan pandas Series/DataFrame agar mudah dipakai di Plotly.
"""
from __future__ import annotations

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
