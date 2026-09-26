"""Evaluator per sistem trading — rumus dari PRD AllTradingStrategy."""
from __future__ import annotations

import pandas as pd

from app.indicators.strategies.common import (
    as_float,
    atr as compute_atr,
    cross_down,
    cross_up,
    ohlc,
    pack,
    reading,
    smma,
    state,
    zero_line,
)
from app.indicators.technical import bollinger_bands, ema, macd, moving_average, rsi


def donchian_lines(df: pd.DataFrame, n: int):
    high = df["High"].astype(float).rolling(n).max()
    low = df["Low"].astype(float).rolling(n).min()
    return high, low, (high + low) / 2


def profitunity(df: pd.DataFrame) -> dict:
    o, h, l, c = ohlc(df)
    median = (h + l) / 2
    lips = smma(median, 5).shift(3)
    teeth = smma(median, 8).shift(5)
    jaw = smma(median, 13).shift(8)
    ao = moving_average(median, 5) - moving_average(median, 34)
    close = as_float(c.iloc[-1])
    lv, tv, jv = as_float(lips.iloc[-1]), as_float(teeth.iloc[-1]), as_float(jaw.iloc[-1])
    aov = as_float(ao.iloc[-1])
    spread = None
    if None not in (lv, tv, jv) and close:
        spread = max(lv, tv, jv) - min(lv, tv, jv)
    sleeping = spread is not None and close and spread / close < 0.001
    green = None not in (close, lv, tv, jv) and close > lv and lv > tv > jv
    red = None not in (close, lv, tv, jv) and close < lv and lv < tv < jv
    up_fractal = False
    if len(df) >= 5:
        window = h.iloc[-5:]
        up_fractal = as_float(window.iloc[2]) == as_float(window.max())
    return pack(
        "profitunity",
        [reading("Lips", lv), reading("Teeth", tv), reading("Jaw", jv), reading("Awesome Oscillator", aov)],
        [
            state("BUAYA1", "Lips crosses Teeth upward", cross_up(lips, teeth)),
            state("BUAYA2", "Lips crosses Jaw upward", cross_up(lips, jaw)),
            state("BUAYA3", "Teeth crosses Jaw upward", cross_up(teeth, jaw)),
            state("PTS1", "Green zone: close > Lips > Teeth > Jaw", green),
            state("PTS-RED", "Red zone: close < Lips < Teeth < Jaw", red),
            state("SLEEP", "Alligator sleeping (lines tightly packed)", sleeping),
            state("PTS2", "AO crosses zero upward", cross_up(ao, zero_line(ao.index))),
            state("PTS3", "AO crosses zero and green zone", cross_up(ao, zero_line(ao.index)) and green),
            state("FR1", "Up fractal on last 5-bar window", up_fractal and close is not None and lv is not None and close > lv),
        ],
    )


def bollinger(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    bb = bollinger_bands(c, 20, 2)
    upper, mid, lower = bb["upper"], bb["middle"], bb["lower"]
    width = (upper - lower) / mid.replace(0, pd.NA)
    last_c = as_float(c.iloc[-1])
    prev_c = as_float(c.iloc[-2]) if len(c) > 1 else None
    u, m, lo = as_float(upper.iloc[-1]), as_float(mid.iloc[-1]), as_float(lower.iloc[-1])
    pu, pm, pl = as_float(upper.iloc[-2]), as_float(mid.iloc[-2]), as_float(lower.iloc[-2])
    squeeze = False
    if width.dropna().shape[0] >= 20:
        squeeze = as_float(width.iloc[-1]) is not None and as_float(width.iloc[-1]) <= as_float(width.dropna().tail(120).quantile(0.2))
    below_upper_5 = len(c) >= 6 and all(
        as_float(c.iloc[-i]) is not None and as_float(upper.iloc[-i]) is not None and as_float(c.iloc[-i]) < as_float(upper.iloc[-i])
        for i in range(2, 7)
    )
    return pack(
        "bollinger",
        [reading("Upper", u), reading("Middle", m), reading("Lower", lo)],
        [
            state("BB1", "Close breaks mid from below", prev_c is not None and pm is not None and last_c is not None and m is not None and prev_c <= pm and last_c > m),
            state("BB2", "Close breaks mid from above", prev_c is not None and pm is not None and last_c is not None and m is not None and prev_c >= pm and last_c < m),
            state("BB3", "Close breaks upper", prev_c is not None and pu is not None and last_c is not None and u is not None and prev_c <= pu and last_c > u),
            state("BB4", "Close breaks lower", prev_c is not None and pl is not None and last_c is not None and lo is not None and prev_c >= pl and last_c < lo),
            state("BB5", "Squeeze (low bandwidth)", squeeze),
            state("BB6", "Re-enters from below lower band", prev_c is not None and pl is not None and last_c is not None and lo is not None and m is not None and prev_c < pl and lo <= last_c <= m),
            state("BB8", "Breaks upper after 5 bars below it", below_upper_5 and last_c is not None and u is not None and last_c > u),
        ],
    )


def ichimoku(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    tenkan = (h.rolling(9).max() + l.rolling(9).min()) / 2
    kijun = (h.rolling(26).max() + l.rolling(26).min()) / 2
    span_a = ((tenkan + kijun) / 2).shift(26)
    span_b = ((h.rolling(52).max() + l.rolling(52).min()) / 2).shift(26)
    close = as_float(c.iloc[-1])
    t, k = as_float(tenkan.iloc[-1]), as_float(kijun.iloc[-1])
    a, b = as_float(span_a.iloc[-1]), as_float(span_b.iloc[-1])
    cloud_top = max(x for x in (a, b) if x is not None) if a is not None and b is not None else None
    cloud_bot = min(x for x in (a, b) if x is not None) if a is not None and b is not None else None
    above = close is not None and cloud_top is not None and close > cloud_top
    below = close is not None and cloud_bot is not None and close < cloud_bot
    inside = close is not None and cloud_top is not None and cloud_bot is not None and cloud_bot <= close <= cloud_top
    return pack(
        "ichimoku",
        [reading("Tenkan", t), reading("Kijun", k), reading("Senkou A", a), reading("Senkou B", b)],
        [
            state("ICHI16", "Tenkan crosses Kijun upward", cross_up(tenkan, kijun)),
            state("ICHI17", "Tenkan crosses Kijun downward", cross_down(tenkan, kijun)),
            state("ICHI1", "Close crosses Kijun upward", cross_up(c, kijun)),
            state("ICHI7", "Close above cloud", above),
            state("ICHI8", "Close below cloud", below),
            state("ICHI9", "Close inside cloud", inside),
            state("ICHI42", "Forward cloud green", a is not None and b is not None and a > b),
            state("ICHI41", "Forward cloud red", a is not None and b is not None and a < b),
        ],
    )


def guppy(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    short = [3, 5, 8, 10, 12, 15]
    long = [30, 35, 40, 45, 50, 60]
    s = sum(ema(c, n) for n in short) / len(short)
    lg = sum(ema(c, n) for n in long) / len(long)
    osc = s - lg
    close = as_float(c.iloc[-1])
    sv, lv, ov = as_float(s.iloc[-1]), as_float(lg.iloc[-1]), as_float(osc.iloc[-1])
    return pack(
        "guppy",
        [reading("Mean short EMA", sv), reading("Mean long EMA", lv), reading("Oscillator", ov)],
        [
            state("G1", "Close > mean short > mean long", close is not None and sv is not None and lv is not None and close > sv > lv),
            state("GOBULL", "Oscillator positive", ov is not None and ov > 0),
            state("GOBEAR", "Oscillator negative", ov is not None and ov < 0),
            state("GOGC", "Oscillator crosses zero upward", cross_up(osc, zero_line(osc.index))),
            state("GODC", "Oscillator crosses zero downward", cross_down(osc, zero_line(osc.index))),
        ],
    )


def minervini(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    ma50, ma150, ma200 = moving_average(c, 50), moving_average(c, 150), moving_average(c, 200)
    close = as_float(c.iloc[-1])
    m50, m150, m200 = as_float(ma50.iloc[-1]), as_float(ma150.iloc[-1]), as_float(ma200.iloc[-1])
    m200_prev = as_float(ma200.iloc[-21]) if len(ma200) > 21 else None
    low_52 = as_float(df["Low"].astype(float).tail(252).min()) if len(df) >= 50 else None
    high_52 = as_float(df["High"].astype(float).tail(252).max()) if len(df) >= 50 else None
    checks = [
        close is not None and m150 is not None and m200 is not None and close > m150 and close > m200,
        m150 is not None and m200 is not None and m150 > m200,
        m200 is not None and m200_prev is not None and m200 > m200_prev,
        close is not None and m50 is not None and m150 is not None and m200 is not None and m50 > m150 and m50 > m200 and close > m50,
        close is not None and low_52 and close >= low_52 * 1.3,
        close is not None and high_52 and close >= high_52 * 0.75,
    ]
    score = sum(1 for x in checks if x)
    prev = as_float(c.iloc[-2]) if len(c) > 1 else None
    full = score >= 6
    return pack(
        "minervini",
        [reading("Template score", score), reading("MA50", m50), reading("MA150", m150), reading("MA200", m200)],
        [
            state("MV1", "Template met and close up", full and prev is not None and close is not None and close > prev),
            state("MV2", "Template met and close down", full and prev is not None and close is not None and close < prev),
            state("MV3", "Template met and close flat", full and prev is not None and close == prev),
        ],
    )



def turtle(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    h20, l10, _ = donchian_lines(df, 20)
    h55, _, _ = donchian_lines(df, 55)
    # breakout uses prior channel, not including today
    prev_h20 = h20.shift(1)
    prev_h55 = h55.shift(1)
    close = as_float(c.iloc[-1])
    u20 = as_float(prev_h20.iloc[-1])
    u55 = as_float(prev_h55.iloc[-1])
    near = close is not None and u20 and close >= u20 * (1 - 0.0275) and close < u20
    flat = len(h20) > 4 and as_float(h20.iloc[-1]) == as_float(h20.iloc[-4])
    return pack(
        "turtle",
        [reading("Upper 20", u20), reading("Upper 55", u55), reading("Close", close)],
        [
            state("TS1", "Close breaks prior 20-bar high", close is not None and u20 is not None and close > u20),
            state("TS2", "Close breaks prior 55-bar high", close is not None and u55 is not None and close > u55),
            state("TS3", "Within 2.75% below upper channel 20", near),
            state("TS4", "Near upper channel and channel flat", bool(near and flat)),
        ],
    )


def donchian(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    _, _, mid = donchian_lines(df, 20)
    return pack(
        "donchian",
        [reading("Mid Donchian 20", as_float(mid.iloc[-1]))],
        [
            state("DCM1", "Close breaks mid from below", cross_up(c, mid)),
            state("DCM2", "Close breaks mid from above", cross_down(c, mid)),
        ],
    )


def supertrend(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    atr = compute_atr(df, 10)
    hl2 = (df["High"].astype(float) + df["Low"].astype(float)) / 2
    basic_u = hl2 + 3 * atr
    basic_l = hl2 - 3 * atr
    direction = 1
    final = []
    dirs = []
    for i in range(len(df)):
        bu, bl = as_float(basic_u.iloc[i]), as_float(basic_l.iloc[i])
        close = as_float(c.iloc[i])
        if bu is None or bl is None or close is None or not final:
            final.append(bl if bl is not None else bu)
            dirs.append(1)
            continue
        prev_f, prev_d = final[-1], dirs[-1]
        lower = max(bl, prev_f) if prev_d == 1 and prev_f is not None else bl
        upper = min(bu, prev_f) if prev_d == -1 and prev_f is not None else bu
        if prev_d == 1 and close < (prev_f or lower):
            direction = -1
            line = upper
        elif prev_d == -1 and close > (prev_f or upper):
            direction = 1
            line = lower
        else:
            direction = prev_d
            line = lower if direction == 1 else upper
        final.append(line)
        dirs.append(direction)
    line = final[-1] if final else None
    up = dirs[-1] == 1 if dirs else False
    fresh = len(dirs) > 1 and dirs[-1] != dirs[-2]
    return pack(
        "supertrend",
        [reading("SuperTrend", line), reading("Direction", 1 if up else -1)],
        [
            state("ST1", "Just turned upward", fresh and up),
            state("ST2", "Price above line", up and not fresh),
            state("ST3", "Just turned downward", fresh and not up),
            state("ST4", "Price below line", (not up) and not fresh),
        ],
    )


def pixel(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    s5, s20, s60 = moving_average(c, 5), moving_average(c, 20), moving_average(c, 60)
    close = as_float(c.iloc[-1])

    def green(ma: pd.Series) -> bool:
        v, prev = as_float(ma.iloc[-1]), as_float(ma.iloc[-2]) if len(ma) > 1 else None
        return close is not None and v is not None and prev is not None and close > v and v >= prev

    g = (green(s5), green(s20), green(s60))
    all_g = all(g)
    prev_close = as_float(c.iloc[-2]) if len(c) > 1 else None
    was = prev_close is not None and as_float(s5.iloc[-2]) is not None and prev_close > as_float(s5.iloc[-2])
    return pack(
        "pixel",
        [reading("SMA5", as_float(s5.iloc[-1])), reading("SMA20", as_float(s20.iloc[-1])), reading("SMA60", as_float(s60.iloc[-1]))],
        [
            state("PIX1", "Three new green pixels", all_g and not was),
            state("PIX2", "Three pixels already green", all_g and was),
            state("PIX5", "Three red pixels", not any(g)),
        ],
    )


def elder_impulse(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    e = ema(c, 13)
    hist = macd(c)["histogram"]
    up_e = as_float(e.iloc[-1]) is not None and as_float(e.iloc[-2]) is not None and as_float(e.iloc[-1]) > as_float(e.iloc[-2])
    up_h = as_float(hist.iloc[-1]) is not None and as_float(hist.iloc[-2]) is not None and as_float(hist.iloc[-1]) > as_float(hist.iloc[-2])
    return pack(
        "elder-impulse",
        [reading("EMA13", as_float(e.iloc[-1])), reading("MACD hist", as_float(hist.iloc[-1]))],
        [
            state("EIS", "Daily impulse green", up_e and up_h),
            state("EIS-BLUE", "EMA and histogram not aligned", up_e != up_h),
            state("EIS-RED", "Daily impulse red", (not up_e) and (not up_h)),
        ],
    )


def ttm(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    hist = macd(c)["histogram"]
    above = hist > 0
    age = 0
    for v in reversed(above.tolist()):
        if v:
            age += 1
        else:
            break
    return pack(
        "ttm",
        [reading("Histogram", as_float(hist.iloc[-1])), reading("Age above zero", age)],
        [
            state("TTM1", "Just crossed zero, age 1", age == 1),
            state("TTM2", "Above zero, age 2", age == 2),
            state("TTM3", "Above zero, age 3", age == 3),
        ],
    )


def heiken_ashi(df: pd.DataFrame) -> dict:
    o, h, l, c = ohlc(df)
    ha_close = (o + h + l + c) / 4
    ha_open = ha_close.copy()
    for i in range(1, len(df)):
        ha_open.iloc[i] = (ha_open.iloc[i - 1] + ha_close.iloc[i - 1]) / 2
    e20 = ema(c, 20)
    up = as_float(ha_close.iloc[-1]) is not None and as_float(ha_open.iloc[-1]) is not None and as_float(ha_close.iloc[-1]) > as_float(ha_open.iloc[-1])
    prev_up = len(df) > 1 and as_float(ha_close.iloc[-2]) is not None and as_float(ha_open.iloc[-2]) is not None and as_float(ha_close.iloc[-2]) > as_float(ha_open.iloc[-2])
    return pack(
        "heiken-ashi",
        [reading("HA close", as_float(ha_close.iloc[-1])), reading("EMA20", as_float(e20.iloc[-1]))],
        [
            state("H1", "HA just turned up", up and not prev_up),
            state("H2", "HA up and above EMA20", up and as_float(c.iloc[-1]) is not None and as_float(e20.iloc[-1]) is not None and as_float(c.iloc[-1]) > as_float(e20.iloc[-1])),
            state("H4", "HA turned down", (not up) and prev_up),
        ],
    )


def fibonacci(df: pd.DataFrame) -> dict:
    h = df["High"].astype(float)
    l = df["Low"].astype(float)
    c = as_float(df["Close"].astype(float).iloc[-1])
    hi = as_float(h.tail(90).max())
    lo = as_float(l.tail(90).min())
    level = None
    if hi is not None and lo is not None:
        level = hi - (hi - lo) * 0.618
    near = c is not None and level is not None and abs(c - level) / c < 0.01
    return pack(
        "fibonacci",
        [reading("High 90", hi), reading("Low 90", lo), reading("Level 0.618", level)],
        [
            state("BOFIBO90", "Close above level 0.618 jendela 90 hari", c is not None and level is not None and c > level),
            state("GZFIBO90", "Price menempel di zona 0.618", near),
        ],
    )


def candlestick(df: pd.DataFrame) -> dict:
    o, h, l, c = ohlc(df)
    body = (c - o).abs()
    rng = (h - l).replace(0, pd.NA)
    i = -1
    doji = as_float(body.iloc[i]) is not None and as_float(rng.iloc[i]) and as_float(body.iloc[i]) / as_float(rng.iloc[i]) < 0.1
    bull = as_float(c.iloc[i]) is not None and as_float(o.iloc[i]) is not None and as_float(c.iloc[i]) > as_float(o.iloc[i])
    prev_bear = len(df) > 1 and as_float(c.iloc[-2]) is not None and as_float(o.iloc[-2]) is not None and as_float(c.iloc[-2]) < as_float(o.iloc[-2])
    engulf = bull and prev_bear and as_float(o.iloc[i]) <= as_float(c.iloc[-2]) and as_float(c.iloc[i]) >= as_float(o.iloc[-2])
    lower_wick = as_float(o.iloc[i]) is not None and as_float(c.iloc[i]) is not None and as_float(l.iloc[i]) is not None and min(as_float(o.iloc[i]), as_float(c.iloc[i])) - as_float(l.iloc[i])
    pin = lower_wick is not None and as_float(body.iloc[i]) is not None and lower_wick >= 2 * as_float(body.iloc[i]) and bull
    return pack(
        "candlestick",
        [reading("Body", as_float(body.iloc[i])), reading("Range", as_float(rng.iloc[i]))],
        [
            state("DOJI", "Doji", bool(doji)),
            state("IJO", "Green body", bull),
            state("ENBULL", "Bullish engulfing", engulf),
            state("BULLPB", "Pin bar bullish", bool(pin)),
            state("CH", "Close equals high", as_float(c.iloc[i]) is not None and as_float(h.iloc[i]) is not None and abs(as_float(c.iloc[i]) - as_float(h.iloc[i])) < 1e-9),
        ],
    )


def ma_system(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    ma20, ma50 = moving_average(c, 20), moving_average(c, 50)
    close = as_float(c.iloc[-1])
    return pack(
        "moving-average",
        [reading("SMA20", as_float(ma20.iloc[-1])), reading("SMA50", as_float(ma50.iloc[-1])), reading("SMA200", as_float(moving_average(c, 200).iloc[-1]))],
        [
            state("SMAGC", "SMA20 crosses SMA50 upward", cross_up(ma20, ma50)),
            state("SMADC", "SMA20 crosses SMA50 downward", cross_down(ma20, ma50)),
            state("PASMA20", "Close above SMA20", close is not None and as_float(ma20.iloc[-1]) is not None and close > as_float(ma20.iloc[-1])),
            state("PASMA50", "Close above SMA50", close is not None and as_float(ma50.iloc[-1]) is not None and close > as_float(ma50.iloc[-1])),
        ],
    )


def adx(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    up = h.diff()
    down = -l.diff()
    plus_dm = up.where((up > down) & (up > 0), 0.0)
    minus_dm = down.where((down > up) & (down > 0), 0.0)
    atr = compute_atr(df, 14).replace(0, pd.NA)
    plus_di = 100 * plus_dm.ewm(alpha=1 / 14, adjust=False).mean() / atr
    minus_di = 100 * minus_dm.ewm(alpha=1 / 14, adjust=False).mean() / atr
    dx = (100 * (plus_di - minus_di).abs() / (plus_di + minus_di).replace(0, pd.NA)).fillna(0)
    adx = dx.ewm(alpha=1 / 14, adjust=False).mean()
    av, p, m = as_float(adx.iloc[-1]), as_float(plus_di.iloc[-1]), as_float(minus_di.iloc[-1])
    return pack(
        "adx",
        [reading("ADX", av), reading("+DI", p), reading("-DI", m)],
        [
            state("ADX1", "ADX > 25 and +DI > -DI", av is not None and p is not None and m is not None and av > 25 and p > m),
            state("ADX2", "+DI crosses -DI upward", cross_up(plus_di, minus_di)),
        ],
    )


def macd_system(df: pd.DataFrame) -> dict:
    m = macd(df["Close"].astype(float))
    line, sig = m["macd"], m["signal"]
    lv, sv = as_float(line.iloc[-1]), as_float(sig.iloc[-1])
    cross = cross_up(line, sig)
    death = cross_down(line, sig)
    return pack(
        "macd",
        [reading("MACD", lv), reading("Signal", sv), reading("Histogram", as_float(m["histogram"].iloc[-1]))],
        [
            state("MACDGC", "MACD crosses signal upward", cross),
            state("MACDGCA", "Golden cross above zero", cross and lv is not None and lv > 0),
            state("MACDGCB", "Golden cross below zero", cross and lv is not None and lv <= 0),
            state("MACDDC", "MACD crosses signal downward", death),
        ],
    )


def rsi_system(df: pd.DataFrame) -> dict:
    series = rsi(df["Close"].astype(float), 14)
    v, prev = as_float(series.iloc[-1]), as_float(series.iloc[-2]) if len(series) > 1 else None
    return pack(
        "rsi",
        [reading("RSI14", v)],
        [
            state("OVERSOLD", "RSI below 30", v is not None and v < 30),
            state("OVERBOUGHT", "RSI above 70", v is not None and v > 70),
            state("BURSI40", "RSI crosses 40 upward", prev is not None and v is not None and prev <= 40 < v),
            state("BLRSI40", "RSI crosses 40 downward", prev is not None and v is not None and prev >= 40 > v),
        ],
    )


def stochastic(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    low_n = l.rolling(14).min()
    high_n = h.rolling(14).max()
    k = 100 * (c - low_n) / (high_n - low_n).replace(0, pd.NA)
    d = k.rolling(3).mean()
    kv, dv = as_float(k.iloc[-1]), as_float(d.iloc[-1])
    return pack(
        "stochastic",
        [reading("%K", kv), reading("%D", dv)],
        [
            state("GC30", "%K crosses %D upward below 30", cross_up(k, d) and kv is not None and kv < 30),
            state("DC", "%K crosses %D downward", cross_down(k, d)),
        ],
    )


def cci(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    tp = (h + l + c) / 3
    sma = tp.rolling(20).mean()
    mad = (tp - sma).abs().rolling(20).mean()
    cci = (tp - sma) / (0.015 * mad.replace(0, pd.NA))
    v, prev = as_float(cci.iloc[-1]), as_float(cci.iloc[-2]) if len(cci) > 1 else None
    return pack(
        "cci",
        [reading("CCI20", v)],
        [
            state("CCI1", "CCI crosses -100 upward", prev is not None and v is not None and prev <= -100 < v),
            state("CCI5", "CCI crosses 0 upward", prev is not None and v is not None and prev <= 0 < v),
            state("CCI4", "CCI crosses 100 downward", prev is not None and v is not None and prev >= 100 > v),
        ],
    )


def mfi(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    vol = df["Volume"].astype(float)
    tp = (h + l + c) / 3
    raw = tp * vol
    delta = tp.diff()
    pos = raw.where(delta > 0, 0).rolling(14).sum()
    neg = raw.where(delta < 0, 0).rolling(14).sum()
    mfi = 100 - (100 / (1 + pos / neg.replace(0, pd.NA)))
    v = as_float(mfi.iloc[-1])
    return pack(
        "mfi",
        [reading("MFI14", v)],
        [
            state("MFI1", "MFI below 20", v is not None and v < 20),
            state("MFI3", "MFI above 80", v is not None and v > 80),
        ],
    )


def cmf(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    vol = df["Volume"].astype(float)
    rng = (h - l).replace(0, pd.NA)
    mfm = ((c - l) - (h - c)) / rng
    mfv = mfm * vol
    cmf = mfv.rolling(20).sum() / vol.rolling(20).sum().replace(0, pd.NA)
    v, prev = as_float(cmf.iloc[-1]), as_float(cmf.iloc[-2]) if len(cmf) > 1 else None
    return pack(
        "cmf",
        [reading("CMF20", v)],
        [state("CMF1", "CMF crosses 0 upward", prev is not None and v is not None and prev <= 0 < v)],
    )


def trix(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    e1 = ema(c, 14)
    e2 = ema(e1, 14)
    e3 = ema(e2, 14)
    trix = e3.pct_change() * 100
    sig = moving_average(trix, 9)
    v = as_float(trix.iloc[-1])
    return pack(
        "trix",
        [reading("TRIX14", v)],
        [
            state("GCTRIX", "TRIX crosses signal upward", cross_up(trix, sig)),
            state("CZTRIX", "TRIX crosses 0 upward", cross_up(trix, zero_line(trix.index))),
            state("AZTRIX", "TRIX above zero", v is not None and v > 0),
        ],
    )


def vortex(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    vm_plus = (h - l.shift(1)).abs()
    vm_minus = (l - h.shift(1)).abs()
    tr = pd.concat([(h - l), (h - c.shift(1)).abs(), (l - c.shift(1)).abs()], axis=1).max(axis=1)
    vi_p = vm_plus.rolling(14).sum() / tr.rolling(14).sum().replace(0, pd.NA)
    vi_m = vm_minus.rolling(14).sum() / tr.rolling(14).sum().replace(0, pd.NA)
    return pack(
        "vortex",
        [reading("VI+", as_float(vi_p.iloc[-1])), reading("VI-", as_float(vi_m.iloc[-1]))],
        [state("GCVX", "VI+ crosses VI- upward", cross_up(vi_p, vi_m))],
    )


def smi(df: pd.DataFrame) -> dict:
    c = df["Close"].astype(float)
    diff = c.diff()
    abs_diff = diff.abs()
    smooth = ema(ema(diff, 20), 5)
    smooth_abs = ema(ema(abs_diff, 20), 5).replace(0, pd.NA)
    smi = 100 * smooth / smooth_abs
    sig = ema(smi, 5)
    v = as_float(smi.iloc[-1])
    return pack(
        "smi",
        [reading("SMI", v)],
        [
            state("ABOVE0", "SMI above zero", v is not None and v > 0),
            state("GC", "SMI crosses signal upward", cross_up(smi, sig)),
        ],
    )


def parabolic_sar(df: pd.DataFrame) -> dict:
    h, l = df["High"].astype(float), df["Low"].astype(float)
    step, max_af = 0.02, 0.2
    sar = [float(l.iloc[0])]
    bull = True
    af = step
    ep = float(h.iloc[0])
    for i in range(1, len(df)):
        prev = sar[-1]
        hi, lo = float(h.iloc[i]), float(l.iloc[i])
        nxt = prev + af * (ep - prev)
        if bull:
            nxt = min(nxt, float(l.iloc[i - 1]), float(l.iloc[max(i - 2, 0)]))
            if lo < nxt:
                bull = False
                nxt = ep
                ep = lo
                af = step
            elif hi > ep:
                ep = hi
                af = min(af + step, max_af)
        else:
            nxt = max(nxt, float(h.iloc[i - 1]), float(h.iloc[max(i - 2, 0)]))
            if hi > nxt:
                bull = True
                nxt = ep
                ep = hi
                af = step
            elif lo < ep:
                ep = lo
                af = min(af + step, max_af)
        sar.append(nxt)
    flipped = len(sar) > 2
    prev_bull = float(df["Close"].iloc[-2]) > sar[-2] if flipped else bull
    return pack(
        "parabolic-sar",
        [reading("SAR", sar[-1] if sar else None)],
        [
            state("PSAR1", "SAR berpindah downward harga", bull and not prev_bull),
            state("PSAR2", "SAR berpindah upward harga", (not bull) and prev_bull),
            state("PSAR-UP", "Arah up", bull),
        ],
    )


def trend(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    hh = len(c) >= 3 and as_float(h.iloc[-1]) > as_float(h.iloc[-2]) > as_float(h.iloc[-3]) and as_float(c.iloc[-1]) > as_float(df["Open"].iloc[-1])
    hhhl = len(c) >= 2 and as_float(h.iloc[-1]) > as_float(h.iloc[-2]) and as_float(l.iloc[-1]) > as_float(l.iloc[-2])
    window = c.tail(30).reset_index(drop=True)
    slope = None
    if len(window) >= 10:
        x = pd.Series(range(len(window)), dtype=float)
        y = window.astype(float)
        slope = as_float(((x - x.mean()) * (y - y.mean())).sum() / ((x - x.mean()) ** 2).sum())
    return pack(
        "trend",
        [reading("30-bar slope", slope)],
        [
            state("HH3", "Three higher highs with green bodies", bool(hh)),
            state("HHHL", "Higher high and higher low", bool(hhhl)),
            state("TRU", "Kemiringan regresi positive", slope is not None and slope > 0),
            state("TRD", "Kemiringan regresi negative", slope is not None and slope < 0),
        ],
    )


def support_resistance(df: pd.DataFrame) -> dict:
    prev = df.iloc[-2] if len(df) > 1 else df.iloc[-1]
    ph, pl, pc = as_float(prev["High"]), as_float(prev["Low"]), as_float(prev["Close"])
    pivot = r1 = s1 = None
    if None not in (ph, pl, pc):
        pivot = (ph + pl + pc) / 3
        r1 = 2 * pivot - pl
        s1 = 2 * pivot - ph
    c = as_float(df["Close"].iloc[-1])
    high_52 = as_float(df["High"].astype(float).tail(252).max())
    low_52 = as_float(df["Low"].astype(float).tail(252).min())
    dist_hi = ((high_52 - c) / c * 100) if c and high_52 else None
    return pack(
        "support-resistance",
        [reading("Pivot", pivot), reading("R1", r1), reading("S1", s1), reading("Distance to 52w high %", dist_hi)],
        [
            state("PR1", "Price di sekitar R1", c is not None and r1 is not None and abs(c - r1) / c < 0.005),
            state("PS1", "Price di sekitar S1", c is not None and s1 is not None and abs(c - s1) / c < 0.005),
            state("NH52W", "Within 2% below 52-week high", dist_hi is not None and 0 <= dist_hi <= 2),
        ],
    )


def volume_pressure(df: pd.DataFrame) -> dict:
    h, l, c = df["High"].astype(float), df["Low"].astype(float), df["Close"].astype(float)
    vol = df["Volume"].astype(float)
    rng = (h - l).replace(0, pd.NA)
    buyer = vol * (c - l) / rng
    seller = vol * (h - c) / rng
    ratio = as_float((buyer / seller.replace(0, pd.NA)).iloc[-1])
    avg = as_float(vol.iloc[:-1].tail(20).mean()) if len(vol) > 1 else None
    last_v = as_float(vol.iloc[-1])
    spike = last_v is not None and avg and last_v > 2 * avg
    up = as_float(c.iloc[-1]) is not None and as_float(c.iloc[-2]) is not None and as_float(c.iloc[-1]) > as_float(c.iloc[-2])
    return pack(
        "volume-pressure",
        [reading("Buyer/Seller", ratio), reading("Volume / MA20", (last_v / avg) if last_v and avg else None)],
        [
            state("BPR", "Buyer pressure lebih kuat", ratio is not None and ratio >= 1),
            state("SPR", "Seller pressure lebih kuat", ratio is not None and ratio < 1),
            state("VSPIKE1", "Volume > 2x average and close up", bool(spike and up)),
            state("VSPIKE2", "Volume > 2x average and close down", bool(spike and not up)),
        ],
    )


def gap(df: pd.DataFrame) -> dict:
    if len(df) < 2:
        return pack("gap", [], [])
    prev_h = as_float(df["High"].iloc[-2])
    prev_l = as_float(df["Low"].iloc[-2])
    lo = as_float(df["Low"].iloc[-1])
    hi = as_float(df["High"].iloc[-1])
    return pack(
        "gap",
        [reading("Low", lo), reading("Prev high", prev_h)],
        [
            state("GAP1", "Gap up", lo is not None and prev_h is not None and lo > prev_h),
            state("GAP2", "Gap down", hi is not None and prev_l is not None and hi < prev_l),
        ],
    )

