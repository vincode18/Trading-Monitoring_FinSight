"""Endpoint API untuk data historis (candlestick) + indikator teknikal."""
import math

from fastapi import APIRouter, HTTPException, Query, Request

from app.api.schemas import CandleResponse, ChartResponse, IndicatorPointResponse
from app.core.rate_limit import DEFAULT_LIMIT, limiter
from app.indicators.technical import add_all_indicators, simple_signal
from app.services.market_data import get_history

router = APIRouter(prefix="/api/chart", tags=["chart"])


def _clean(value):
    """Konversi NaN/None pandas ke None murni supaya valid sebagai JSON."""
    if value is None:
        return None
    try:
        if math.isnan(value):
            return None
    except TypeError:
        pass
    return float(value)


@router.get("/{symbol}", response_model=ChartResponse)
@limiter.limit(DEFAULT_LIMIT)
def get_chart(
    request: Request,
    symbol: str,
    period: str = Query("6mo", description="1mo, 3mo, 6mo, 1y, 2y, 5y"),
    interval: str = Query("1d", description="1d, 1wk, 1h, 30m, 15m"),
):
    """
    Ambil data candlestick + semua indikator teknikal (MA, RSI, MACD, Bollinger)
    untuk satu simbol, siap dipakai langsung oleh chart di frontend.
    """
    symbol = symbol.upper()
    df = get_history(symbol, period=period, interval=interval)

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Data tidak tersedia untuk '{symbol}' dengan periode={period}, interval={interval}",
        )

    df_ind = add_all_indicators(df)

    candles = [
        CandleResponse(
            date=row["Date"].isoformat(),
            open=_clean(row["Open"]),
            high=_clean(row["High"]),
            low=_clean(row["Low"]),
            close=_clean(row["Close"]),
            volume=_clean(row["Volume"]) or 0,
        )
        for _, row in df_ind.iterrows()
    ]

    indicators = [
        IndicatorPointResponse(
            date=row["Date"].isoformat(),
            ma20=_clean(row.get("MA20")),
            ma50=_clean(row.get("MA50")),
            ma100=_clean(row.get("MA100")),
            ma200=_clean(row.get("MA200")),
            ema12=_clean(row.get("EMA12")),
            ema26=_clean(row.get("EMA26")),
            rsi14=_clean(row.get("RSI14")),
            macd=_clean(row.get("MACD")),
            macd_signal=_clean(row.get("MACD_Signal")),
            macd_hist=_clean(row.get("MACD_Hist")),
            bb_upper=_clean(row.get("BB_Upper")),
            bb_middle=_clean(row.get("BB_Middle")),
            bb_lower=_clean(row.get("BB_Lower")),
        )
        for _, row in df_ind.iterrows()
    ]

    return ChartResponse(
        symbol=symbol,
        period=period,
        interval=interval,
        candles=candles,
        indicators=indicators,
        signal_summary=simple_signal(df_ind),
    )
